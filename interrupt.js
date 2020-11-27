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

const Classes = new WeakMap

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
const OPTIONS = Symbol('OPTIONS')

function createOptions () {
    return {
        type: OPTIONS,
        code: null,
        format: null,
        errors: [],
        context: {},
        callee: null
    }
}

class Interrupt extends Error {
    //

    // This constructor is only called by derived class and should not be called
    // by the user. An argument could be made that we accommodate the user that
    // hasn't read the documentation because they could be calling this in
    // production having never tested an exceptional branch of their code, but
    // they could just as easily have misspelled `Interrupt`. Basically, we're
    // not going to be as accommodating as all that.

    //
    constructor (Protected, Class, name, vargs, Meta) {
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
        // **TODO** We can extract this and reuse it for "contexts".
        let dump
        const code = typeof options.code == 'symbol'
            ? Meta.codes.get(options.code) || null
            : options.code
        const format = options.format || Class.messages[code] || code
        try {
            dump = sprintf(format, options.context)
        } catch (error) {
            // **TODO** Instrument errors somehow? Maybe a second context that
            // reports Interrupt errors.
            dump = format
        }
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
        if (Class.messages[code]) {
            assign.code = code
        }
        if (typeof Class[code] === 'symbol') {
            Object.defineProperty(this, 'symbol', {
                value: Class[code],
                enumerable: false
            })
        }
        const IGNORE = [ 'message', 'code', 'name', 'symbol' ]
        for (const property in assign) {
            if (! ~IGNORE.indexOf(property) || this[property] == null) {
                Object.defineProperty(this, property, { value: assign[property] })
            }
        }
    }

    static get OPTIONS () {
        return OPTIONS
    }

    static get CURRY () {
        return { type: OPTIONS }
    }

    // **TODO** Wouldn't it be nice to have some sort of way to specify
    // properties by code? Like which subsystem or a severity?

    //
    static create (name, ...vargs) {
        // **TODO** Now I don't know if codes, symbols and messages are
        // inherited. Would have to see where I would ever create an error
        // heirarchy.
        const superclass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt
        const messages = vargs.length > 0 && typeof vargs[0] == 'object' ? vargs.shift() : {}
        const merged = {}, symbols = {}
        for (const code in messages) {
            if (superclass[code]) {
                throw new Error(`code is already defined in superclass: ${code}`)
            }
            if (merged[code]) {
                throw new Error(`code is defined more than once: ${code}`)
            }
            merged[code] = messages[code]
            symbols[code] = Symbol(code)
        }
        function audit (f) {
            if (Interrupt.audit) {
                return function (...vargs) {
                    Interrupt.audit(new Class(Class.options.apply(Class, vargs.slice(1))))
                    return f.options.apply(f, vargs)
                }
            } else {
                return f
            }
        }

        function construct (options, vargs, errors, ...callees) {
            if (vargs.length === 1 && typeof vargs[0] == 'function') {
                let called = false
                const f = vargs.pop()
                const merged = Class.voptions({ callee: callees[1] || $ }, options, vargs)
                function $ (...vargs) {
                    called = true
                    const options = Class.voptions(merged, vargs, { errors })
                    return new Class(options)
                }
                return f($)
            } else {
                return new Class(Class.voptions({ callee: callees[0] }, options, vargs, { errors }))
            }
        }

        assert(superclass == Interrupt || superclass.prototype instanceof Interrupt)
        const Class = class extends superclass {
            constructor (...vargs) {
                if (superclass == Interrupt) {
                    super(PROTECTED, Class, name, vargs, Meta)
                } else {
                    super(...vargs)
                }
            }

            static voptions (...vargs) {
                let options = createOptions()
                while (vargs.length != 0) {
                    const argument = vargs.shift()
                    if (typeof argument == 'object' && argument != null) {
                        if (Array.isArray(argument)) {
                            options = Class.options.apply(Class, [ options ].concat(argument))
                        } else {
                            switch (typeof argument.code) {
                            case 'string':
                            case 'symbol':
                                options.code = argument.code
                            }
                            if (typeof argument.format == 'string') {
                                options.format = argument.format
                            }
                            if (Array.isArray(argument.errors)) {
                                options.errors.push.apply(options.errors, argument.errors)
                            }
                            if (typeof argument.context == 'object' && argument.context != null) {
                                options.context = { ...options.context, ...argument.context }
                            }
                            if (typeof argument.callee == 'function') {
                                options.callee = argument.callee
                            }
                        }
                    }
                }
                return options
            }

            // Convert the positional arguments to a options argument.
            static options (...vargs) {
                // Called with no vargs, return empty options.
                if (vargs.length == 0) {
                    return createOptions()
                }

                // Create the base object.
                let options

                const argument = vargs.shift()

                // First argument must be an options object, code string, code
                // symbol, or message format. If not we do not process any more
                // of the vargs.

                if (typeof argument == 'object' && argument != null) {
                    options = Class.voptions(argument)
                } else {
                    options = createOptions()
                    switch (typeof argument) {
                    case 'symbol': {
                            const code = Meta.codes.get(argument)
                            if (code != null) {
                                options.code = code
                            }
                        }
                        break
                    case 'string': {
                            if (symbols[argument] == null) {
                                options.format = argument
                            } else {
                                options.code = argument
                            }
                        }
                        break
                    default:
                        return options
                    }
                }
                // If the argument cannot be interpreted, discard it.
                while (vargs.length != 0) {
                    const argument = vargs.shift()
                    // Assign a single error or an array of errors to the errors array.
                    if (argument instanceof Error) {
                        options.errors.push(argument)
                    } else if (Array.isArray(argument)) {
                        // **TODO** Going to say that contexts for errors, it's
                        // dubious. If you really want to give context to errors you
                        // should wrap them in an Interrupt, which is more
                        // consistent and therefor easier to document. We'll have to
                        // revisit Destructible to make this happen.
                        options.errors.push.apply(options.errors, argument)
                    } else {
                        switch (typeof argument) {
                        // Assign the context object.
                        case 'object':
                            if (argument != null) {
                                options.context = { ...options.context, ...argument }
                            }
                            break
                        // Possibly assign the code.
                        case 'symbol': {
                                const code = Meta.codes.get(argument)
                                if (code != null) {
                                    options.code = code
                                }
                            }
                            break
                        case 'string':
                            if (symbols[argument] == null) {
                                options.format = argument
                            } else {
                                options.code = argument
                            }
                            break
                        }
                    }
                }
                // Return the generated options object.
                return options
            }

            static _assert (callee, options, vargs) {
                if (typeof vargs[0] === 'object' && vargs[0].type === OPTIONS) {
                    const merged = Class.voptions(options, vargs)
                    return function assert (...vargs) {
                        Class._assert(assert, merged, vargs)
                    }
                } else if (!vargs[0]) {
                    vargs.shift()
                    throw construct(options, vargs, [], callee, callee)
                }
            }

            static assert (...vargs) {
                return Class._assert(Class.assert, {}, vargs)
            }

            static _callback (callee, options, vargs) {
                if (typeof vargs[0] == 'function') {
                    // **TODO** Assert constructor is a function.
                    const [ constructor, callback ] = vargs
                    return function (...vargs) {
                        if (vargs[0] == null) {
                            callback.apply(null, vargs)
                        } else {
                            callback(construct(options, [ constructor ], [ vargs[0] ]))
                        }
                    }
                }
                const merged = Class.voptions(options, vargs)
                return function wrapper (...vargs) {
                    return Class._callback(wrapper, merged, vargs)
                }
            }

            static callback (...vargs) {
                return Class._callback(Class.callback, {}, vargs)
            }

            // **TODO** Now I can't think of a way to memoize assert. Maybe I
            // don't want to because assert is supposed to be fast, or that's
            // the excuse I'll use.

            //
            static async _resolve (callee, f, options, vargs) {
                try {
                    if (typeof f == 'function') {
                        f = f()
                    }
                    return await f
                } catch (error) {
                    throw construct(options, vargs, [ error ], callee)
                }
            }

            static _resolver (callee, options, vargs) {
                if (
                    typeof vargs[0] == 'function' ||
                    (
                        typeof vargs[0] == 'object' &&
                        vargs[0] != null &&
                        typeof vargs[0].then == 'function'
                    )
                ) {
                    return this._resolve(callee, vargs.shift(), options, vargs)
                }
                return function resolver (...vargs) {
                    return Class._resolver(resolver, Class.voptions([ options, vargs ]), vargs)
                }
            }

            static resolve (...vargs) {
                return Class._resolver(Class.resolve, {}, vargs)
            }

            static _invoke (callee, options, vargs) {
                if (typeof vargs[0] == 'function') {
                    const f = vargs.shift()
                    try {
                        return f()
                    } catch (error) {
                        throw construct(options, vargs, [ error ], callee, callee)
                    }
                }
                const merged = Class.voptions(options, vargs)
                return function invoker (...vargs) {
                    return Class._invoke(invoker, merged, vargs)
                }
            }

            static invoke (...vargs) {
                return Class._invoke(Class.inovke, {}, vargs)
            }
        }
        const Meta = { codes: new Map }
        for (const code in symbols) {
            Class[code] = symbols[code]
            Meta.codes.set(symbols[code], code)
        }
        Object.defineProperty(Class, 'name', { value: name })
        Object.defineProperty(Class, 'messages', { value: messages })
        return Class
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
