// Node.js API.
const util = require('util')
const assert = require('assert')

// Return the first non-`null` like parameter.
const coalesce = require('extant')

// Deep differences.
const Keyify = require('keyify')

// A map of existing `Interrupt` derived exceptions to their construction
// material for use in creating de-duplications.
const MATERIAL = new WeakMap

// **TODO** Does this work if there is no stack trace at all?

// Parse the file and line number from a Node.js stack trace.
const location = require('./location')

// `sprintf` supports named parameters, so we can use our context messages.
const sprintf = require('sprintf-js').sprintf


// **TODO** Will crash on circular references, right? Ensure that we parse
// safely or remove any circular references in advance of parsing.

// Stringify a context object to JSON treating any errors as a special case.
function stringify (object) {
    return JSON.stringify(object, function (key, value) {
        if (value instanceof Error) {
            var object = { message: value.message, stack: value.stack }
            for (var key in value) {
                object[key] = value[key]
            }
            return object
        }
        return value
    }, 4)
}

const PROTECTED = Symbol('PROTECTED')

class Interrupt extends Error {
    //

    // This constructor is only called by derived class and should not be called
    // by the user. An argument could be made that we accommodate the user that
    // hasn't read the documentation because they could be calling this in
    // production having never tested an exceptional branch of their code, but
    // they could just as easily have misspelled `Interrupt`. Basically, we're
    // not going to be as accommodating as all that.

    //
    constructor (Protected, Class, name, vargs) {
        assert(PROTECTED === Protected, 'Interrupt constructor is not a public interface')
        // When called with no arguments we call our super constructor with no
        // arguments to eventually call `Error` with no argments to create an
        // empty error.
        if (vargs.length == 0) {
            super()
            MATERIAL.set(this, { message: null, context: {} })
            Object.defineProperties(this, {
                name: {
                    value: this.constructor.name,
                    enumerable: false
                },
                errors: { value: [] },
                contexts: { value: [] }
            })
            return
        }
        const options = Class.options.apply(null, vargs)
        options.message = sprintf(options.format, options.context)
        let dump = options.message
        const contexts = []
        const errors = []
        const keys = Object.keys(options.context).length
        if (keys != 0 || options.errors.length) {
            dump += '\n'

            if (keys != 0) {
                dump += '\n' + stringify(options.context) + '\n'
            }

            for (let i = 0, I = options.errors.length; i < I; i++) {
                const cause = Array.isArray(options.errors[i]) ? options.errors[i] : [ options.errors[i] ]
                const text = (cause[0] instanceof Error)
                    ? coalesce(cause[0].stack, cause[0].message)
                    : cause[0].toString()
                const indented = text.replace(/^/gm, '    ')
                if (cause.length == 1) {
                    dump += '\ncause:\n\n' + indented + '\n'
                } else {
                    const contextualized = stringify(cause[1]).replace(/^/gm, '    ')
                    dump += '\ncause:\n\n' + contextualized + '\n\n' + indented + '\n'
                }
                errors.push(cause[0])
                // TODO Note that nullishness makes this useful and `||`
                // doesn't always do it.
                contexts.push(coalesce(cause[1]))
            }
        } else {
            dump += '\n'
        }

        dump += '\nstack:\n'
        super(dump)

        MATERIAL.set(this, { message: options.message, context: options.context })

        Object.defineProperty(this, "name", {
            value: this.constructor.name,
            enumerable: false
        })

        // FYI It is faster to use `Error.captureStackTrace` again than
        // it is to try to strip the stack frames created by `Error`
        // using a regular expression or string manipulation. You know
        // because you tried.

        //
        if (options.callee != null) {
            Error.captureStackTrace(this, options.callee)
        }

        const assign = { label: options.message, errors: options.errors, contexts, ...options.context }
        if (options.code) {
            assign.code = options.code
        }
        const IGNORE = [ 'message', 'code', 'name' ]
        for (const property in assign) {
            if (! ~IGNORE.indexOf(property) || this[property] == null) {
                Object.defineProperty(this, property, { value: assign[property] })
            }
        }
    }

    // **TODO** Wouldn't it be nice to have some sort of way to specify
    // properties by code? Like which subsystem or a severity?

    //
    static create (name, ...vargs) {
        // **TODO** Doesn't superclass come first?
        const messages = vargs.length > 0 && typeof vargs[0] == 'object' ? vargs.shift() : {}
        const superclass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt
        assert(superclass == Interrupt || superclass.prototype instanceof Interrupt)
        const interrupt = class extends superclass {
            constructor (...vargs) {
                if (superclass == Interrupt) {
                    super(PROTECTED, interrupt, name, vargs)
                } else {
                    super(...vargs)
                }
            }

            // Convert the positional arguments to a options argument.
            static options (...vargs) {
                // Create the base object.
                const options = {
                    format: null,
                    message: null,
                    code: null,
                    errors: [],
                    context: null,
                    callee: null
                }
                if (typeof vargs[0] == 'object' && typeof vargs[0] != null) {
                    const merge = vargs.shift()
                    options.format = coalesce(merge.code, options.format)
                    if (merge.errors != null && Array.isArray(merge.errors)) {
                        options.errors.push.apply(options.errors, merge.errors)
                    }
                    if (merge.context != null && typeof merge.context == 'object') {
                        options.context = { ...options.context, ...merge.context }
                    }
                    if (merge.callee != null && typeof merge.callee == 'function') {
                        options.callee = merge.callee
                    }
                } else {
                    options.format = vargs.shift()
                }
                // Use the formatted for a given code if available. **TODO**
                // this doesn't belong here, we're creating an arguments map.
                if (messages[options.format]) {
                    options.code = options.format
                    options.format = messages[options.code]
                }
                // Assign a single error or an array of errors to the errors array.
                if (vargs[0] instanceof Error) {
                    options.errors.push(vargs.shift())
                } else if (Array.isArray(vargs[0])) {
                    // **TODO** Going to say that contexts for errors, it's
                    // dubious. If you really want to give context to errors you
                    // should wrap them in an Interrupt, which is more
                    // consistent and therefor easier to document. We'll have to
                    // revisit Destructible to make this happen.
                    options.errors.push.apply(options.errors, vargs.shift())
                }
                // Assign the context object.
                if (typeof vargs[0] == 'object' && vargs[0] != null) {
                    options.context = vargs.shift()
                } else {
                    options.context = {}
                }
                // Assign the stack pruning checkpoint.
                if (typeof vargs[vargs.length - 1] == 'function') {
                    options.callee = vargs.pop()
                }
                // Return the generated options object.
                return options
            }

            static assert (condition, ...vargs) {
                if (!condition) {
                    vargs.unshift(null)
                    vargs.push(interrupt.assert)
                    throw new (Function.prototype.bind.apply(interrupt, vargs))
                }
            }

            static resolver (context, callee = null) {
                vargs.unshift('')
                const resolver = function (f, ...vargs) {
                    const named = _named(vargs)
                    named.context = { ...context, ...named.context }
                    named.callee || (named.callee = callee || resolver)
                    return interrupt.resolve(f, named)
                }
                return resolver
            }

            static callback (message, callback) {
                return function (...cvargs) {
                    function constructor (...vargs) {
                        vargs.splice(1, 0, cvargs[0])
                        vargs.unshift(null)
                        if (typeof vargs[vargs.length - 1] != 'function') {
                            vargs.push(constructor)
                        }
                        return new (Function.prototype.bind.apply(interrupt, vargs))
                    }
                    if (cvargs[0] == null) {
                        callback.apply(null, cvargs)
                    } else {
                        callback(message(constructor))
                    }
                }
            }

            static async resolve (f, ...vargs) {
                try {
                    if (typeof f == 'function') {
                        f = f()
                    }
                    return await f
                } catch (error) {
                    vargs.splice(1, 0, error)
                    vargs.unshift(null)
                    if (typeof vargs[vargs.length - 1] != 'function') {
                        vargs.push(interrupt.resolve)
                    }
                    throw new (Function.prototype.bind.apply(interrupt, vargs))
                }
            }

            static invoke (f, ...vargs) {
                try {
                    if (typeof f == 'function') {
                        f = f()
                    }
                    return f
                } catch (error) {
                    vargs.splice(1, 0, error)
                    vargs.unshift(null)
                    vargs.push(interrupt.attempt)
                    throw new (Function.prototype.bind.apply(interrupt, vargs))
                }
            }
        }
        Object.defineProperty(interrupt, 'name', { value: name })
        Object.defineProperty(interrupt, 'messages', { value: messages })
        return interrupt
    }

    static dedup (error, keyify = (_, file, line) => [ file, line ]) {
        const seen = {}
        let id = 0
        function treeify (parent, error, context = {}) {
            const [ file, line ] = location(error.stack)
            const key = keyify(error, file, line)
            if (error instanceof Interrupt) {
                const node = {
                    parent: parent,
                    duplicated: false,
                    duplicates: new Set,
                    id: id++,
                    key: key,
                    stringified: Keyify.stringify(key),
                    error: error,
                    context: context,
                    errors: null
                }
                node.errors = error.errors.map((cause, index) => {
                    return treeify(node, cause, { ...(error.contexts[index] || {}) })
                })
                return node
            }
            return {
                parent: parent,
                duplicated: false,
                id: id++,
                key: key,
                duplicates: new Set,
                stringified: Keyify.stringify(key),
                error: error,
                context: context,
                errors: null
            }
        }
        const leaves = {}
        function leafify (node) {
            if (node.errors != null && node.errors.length != 0) {
                for (const cause of node.errors) {
                    leafify(cause)
                }
            } else {
                const key = node.stringified
                if (leaves[key] == null) {
                    leaves[key] = []
                }
                leaves[key].push(node)
            }
        }
        function compare (left, right) {
            if (left.stringified != right.stringified) {
                return false
            }
            if (left.errors == null && right.errors == null) {
                return true
            }
            if (left.errors.length != right.errors.length) {
                return false
            }
            const errors = right.errors.slice(0)
            CAUSES: for (const cause of left.errors) {
                for (let i = 0; i < errors.length; i++) {
                    if (compare(cause, errors[i])) {
                        errors.splice(i, 1)
                        continue CAUSES
                    }
                }
                return false
            }
            return true
        }
        function mark (node) {
            if (node.duplicated) {
                return
            }
            if (node.errors != null && node.errors.length != 0) {
                for (const cause of node.errors) {
                    mark(cause)
                }
            } else {
                for (const other of leaves[node.stringified]) {
                    if (other === node) {
                        continue
                    }
                    const iterator = {
                        self: node,
                        other: other
                    }
                    const departure = {
                        self: null,
                        other: null
                    }
                    while (
                        iterator.self.parent != null &&
                        iterator.other.parent != null &&
                        iterator.self !== iterator.other &&
                        iterator.self.parent.stringified == iterator.other.parent.stringified
                    ) {
                        departure.self = iterator.self
                        departure.other = iterator.other
                        iterator.self = iterator.self.parent
                        iterator.other = iterator.other.parent
                    }
                    if (departure.self != null) {
                        if (compare(departure.self, departure.other)) {
                            departure.self.duplicates.add(departure.other.id)
                            departure.other.duplicated = true
                        }
                    }
                }
            }
        }
        function format (node) {
            if (node.errors == null || node.errors.length == 0) {
                const repeated = node.duplicates.size + 1
                const context = node.context
                if (repeated != 1) {
                    context.repeated = repeated
                }
                const text = (node.error instanceof Error)
                    ? coalesce(node.error.stack, node.error.message)
                    : node.error.toString()
                if (Object.keys(context).length != 0) {
                    const contextualized = stringify(context)
                    return `${contextualized}\n\n${text}`
                }
                return text
            }
            const errors = []
            for (const cause of node.errors) {
                const formatted = format(cause)
                const indented = formatted.replace(/^/gm, '    ')
                errors.push(`\ncause:\n\n${indented}\n`)
            }
            const repeated = node.duplicates.size + 1
            const material = MATERIAL.get(node.error)
            const context = { ...material.context }
            if (repeated != 1) {
                context.repeated = repeated
            }
            const stack = node.error.stack.replace(/[\s\S]*^stack:$/m, 'stack:')
            if (Object.keys(context).length != 0) {
                const contextualized = stringify(context)
                return `${node.error.name}: ${material.message}\n\n${contextualized}\n\n${errors.join('')}\n\n${stack}`
            }
            return `${node.error.name}: ${material.message}\n\n${errors.join('')}\n\n${stack}`
        }
        /*
        function print (indent, extract, node) {
            console.log(`${indent}${util.inspect(extract(node), { depth: null, breakLength: Infinity })}`)
            if (node.errors != null && node.errors.length != 0) {
                for (const cause of node.errors) {
                    print(`  ${indent}`, extract, cause)
                }
            }
        }*/
        function trim (node, parent) {
            if (parent != null) {
                parent.errors = parent.errors.filter(sibling => ! node.duplicates.has(sibling.id))
            }
            if (node.errors != null && node.errors.length != 0) {
                let i = 0
                while (node.errors.length != i) {
                    trim(node.errors[i++], node)
                }
            }
        }
        const tree = treeify(null, error)
        leafify(tree)
        mark(tree)
        // print('', $ => [ $.id, 1 + $.duplicates.size ], tree)
        trim(tree, null)
        // print('', $ => [ $.id, 1 + $.duplicates.size ], tree)
        return format(tree)
    }
}

module.exports = Interrupt
