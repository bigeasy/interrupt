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
const Instances = new WeakMap

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
const AUDIT = new Error('example')

function createOptions () {
    return {
        type: OPTIONS,
        code: null,
        format: null,
        errors: [],
        _errors: [],
        properties: {},
        callee: null
    }
}

class Interrupt extends Error {
    static SPRINTF_ERROR = Symbol('SPRINTF_ERROR')

    static DEFERRED_CONSTRUCTOR_INVALID_RETURN = Symbol('DEFERRED_CONSTRUCTOR_INVALID_RETURN')

    static DEFERRED_CONSTRUCTOR_NOT_CALLED = Symbol('DEFERRED_CONSTRUCTOR_NOT_CALLED')

    static Error = Interrupt.create('Interrupt.Error', {
        INVALID_CODE: 'code is already a property of the superclass',
        UNKNOWN_CODE: 'unknown code',
        INVALID_CODE_TYPE: 'invalid code type'
    })

    //

    // This constructor is only called by derived class and should not be called
    // by the user. An argument could be made that we accommodate the user that
    // hasn't read the documentation because they could be calling this in
    // production having never tested an exceptional branch of their code, but
    // they could just as easily have misspelled `Interrupt`. Basically, we're
    // not going to be as accommodating as all that.

    //
    constructor (Protected, Class, Prototype, vargs) {
        // **TODO** Use `Interrupt.Error`.
        assert(PROTECTED === Protected, 'Interrupt constructor is not a public interface')
        const instance = { errors: [] }
        // When called with no arguments we call our super constructor with no
        // arguments to eventually call `Error` with no argments to create an
        // empty error.
        if (vargs.length == 0) {
            super()
            Instances.set(this, instance)
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
        const { options, prototype } = function () {
            const options = Class._options(vargs)
            const code = typeof options.code == 'symbol'
                ? Prototype.symbols.get(options.code) || null
                : options.code
            const prototype = Prototype.codes[code] || { message: null, properties: null, code: null }
            return {
                options: prototype.properties ? Class._options([{ properties: prototype.properties }], [ options ]) : options,
                prototype: prototype
            }
        } ()
        // **TODO** We can extract this and reuse it for "contexts".
        let dump
        const format = options.format || prototype.message || prototype.code
        try {
            dump = sprintf(format, options.properties)
        } catch (error) {
            instance.errors.push({
                code: Interrupt.SPRINTF_ERROR,
                format: format,
                properties: options.properties,
                error: error
            })
            // **TODO** Instrument errors somehow? Maybe a second context that
            // reports Interrupt errors.
            dump = format
        }
        const contexts = []
        const errors = []
        const context = { ...options.properties, code: options.code }
        const keys = Object.keys(context).length
        if (keys != 0 || options.errors.length) {
            dump += '\n'

            if (keys != 0) {
                dump += '\n' + stringify(context) + '\n'
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

        MATERIAL.set(this, { message: options.message, context: options.properties })
        Instances.set(this, instance)

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

        const assign = { label: options.message, errors: options.errors, contexts, ...options.properties }
        if (Prototype.codes[prototype.code]) {
            assign.code = prototype.code
        }
        if (Prototype.codes[prototype.code] != null) {
            Object.defineProperty(this, 'symbol', {
                value: Prototype.codes[prototype.code].symbol,
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
        const codes = vargs.length > 0 && typeof vargs[0] == 'object' ? vargs.shift() : {}

        function construct (options, vargs, errors, ...callees) {
            const error = _construct(options, vargs, errors, callees)
            if (typeof Interrupt.audit === 'function') {
                const instance = Instances.get(error)
                Interrupt.audit(error, instance.errors)
            }
            return error
        }

        function _construct (options, vargs, errors, callees) {
            if (vargs.length === 1 && typeof vargs[0] == 'function') {
                let called = false
                const f = vargs.pop()
                const merged = Class._options([{ callee: callees[1] || $ }], [ options ])
                function $ (...vargs) {
                    called = true
                    const options = Class._options([ merged ], vargs, [{ errors }])
                    return new Class(options)
                }
                const error = f($)
                if (!called) {
                    const error = new Class
                    const instance = Instances.get(error)
                    instance.errors.push({
                        code: Interrupt.DEFERRED_CONSTRUCTOR_NOT_CALLED
                    })
                    return error
                }
                if (typeof error != 'object' || error == null || !(error instanceof Class)) {
                    const error = new Class
                    const instance = Instances.get(error)
                    instance.errors.push({
                        code: Interrupt.DEFERRED_CONSTRUCTOR_INVALID_RETURN
                    })
                    return error
                }
                return error
            } else {
                return new Class(Class._options([{ callee: callees[0] }], [ options ], vargs, [{ errors }]))
            }
        }

        assert(superclass == Interrupt || superclass.prototype instanceof Interrupt)
        const Class = class extends superclass {
            constructor (...vargs) {
                if (superclass == Interrupt) {
                    super(PROTECTED, Class, Prototype, vargs)
                } else {
                    super(...vargs)
                }
            }

            static get codes () {
                return Object.keys(Prototype.codes)
            }

            static code (code, ...vargs) {
                let resolved
                switch (typeof code) {
                case 'string': {
                        resolved = Prototype.symbols.get(code)
                    }
                    break
                case 'symbol': {
                        resolved = Prototype.codes[code] && Prototype.codes[code].symbol
                    }
                    break
                default:
                    throw new Interrupt.Error('INVALID_CODE_TYPE')
                }
                if (resolved != null) {
                    return resolved
                }
                if (vargs.length != 0) {
                    return vargs[0]
                }
                throw new Interrupt.Error('UNKNOWN_CODE', { code: String(resolved) })
            }

            static _options (...vargs) {
                function merge (options, vargs) {
                    if (vargs.length == 0) {
                        return options
                    }
                    const argument = vargs.shift()
                    if (typeof argument == 'object' && argument != null) {
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
                        if (Array.isArray(argument._errors)) {
                            options._errors.push.apply(options._errors, argument._errors)
                        }
                        if (typeof argument.properties == 'object' && argument.properties != null) {
                            options.properties = { ...options.properties, ...argument.properties }
                        }
                        if (typeof argument.callee == 'function') {
                            options.callee = argument.callee
                        }
                    } else {
                        switch (typeof argument) {
                        // Possibly assign the code.
                        case 'symbol': {
                                const code = Prototype.symbols.get(argument)
                                if (code != null) {
                                    options.code = code
                                }
                            }
                            break
                        case 'string':
                            if (Prototype.codes[argument] == null) {
                                options.format = argument
                            } else {
                                options.code = argument
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
                                    options.properties = { ...options.prerties, ...argument }
                                } else {
                                    options._errors.push({ code: NULL_POSITIONAL_ARGUMENT })
                                }
                                break
                            // Possibly assign the code.
                            case 'symbol': {
                                    const code = Prototype.symbols.get(argument)
                                    if (code != null) {
                                        options.code = code
                                    }
                                }
                                break
                            case 'string':
                                if (Prototype.codes[argument] == null) {
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
                const options = {
                    type: OPTIONS,
                    code: null,
                    format: null,
                    errors: [],
                    _errors: [],
                    properties: {},
                    callee: null
                }
                while (vargs.length != 0) {
                    merge(options, vargs.shift())
                }
                return options
            }


            static voptions (...vargs) {
                let options = createOptions()
                while (vargs.length != 0) {
                    const argument = vargs.shift()
                    if (typeof argument == 'object' && argument != null) {
                        if (Array.isArray(argument)) {
                            options = Class.options.apply(Class, [ options ].concat(argument))
                        } else {
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
                            const code = Prototype.symbols.get(argument)
                            if (code != null) {
                                options.code = code
                            }
                        }
                        break
                    case 'string': {
                            if (Prototype.codes[argument] == null) {
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
                                options.properties = { ...options.prerties, ...argument }
                            } else {
                                options._errors.push({ code: NULL_POSITIONAL_ARGUMENT })
                            }
                            break
                        // Possibly assign the code.
                        case 'symbol': {
                                const code = Prototype.symbols.get(argument)
                                if (code != null) {
                                    options.code = code
                                }
                            }
                            break
                        case 'string':
                            if (Prototype.codes[argument] == null) {
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
                    const merged = Class._options([ options ], vargs)
                    return function assert (...vargs) {
                        Class._assert(assert, merged, vargs)
                    }
                } else if (!vargs[0]) {
                    vargs.shift()
                    throw construct(options, vargs, [], callee, callee)
                } else if (typeof Interrupt.audit == 'function') {
                    construct(options, vargs, [], callee, callee)
                }
            }

            static assert (...vargs) {
                return Class._assert(Class.assert, {}, vargs)
            }

            static _invoke (callee, options, vargs) {
                if (typeof vargs[0] == 'function') {
                    const f = vargs.shift()
                    try {
                        const result = f()
                        if (typeof Interrupt.audit === 'function') {
                            construct(options, vargs, [ AUDIT ], callee, callee)
                        }
                        return result
                    } catch (error) {
                        throw construct(options, vargs, [ error ], callee, callee)
                    }
                }
                const merged = Class._options([ options ], vargs)
                return function invoker (...vargs) {
                    return Class._invoke(invoker, merged, vargs)
                }
            }

            static invoke (...vargs) {
                return Class._invoke(Class.invoke, {}, vargs)
            }

            static _callback (callee, options, vargs) {
                if (typeof vargs[0] == 'function') {
                    // **TODO** Assert constructor is a function.
                    const [ constructor, callback ] = vargs
                    return function (...vargs) {
                        if (vargs[0] == null) {
                            callback.apply(null, vargs)
                            if (typeof Interrupt.audit == 'function') {
                                construct(options, [ constructor ], [ AUDIT ])
                            }
                        } else {
                            callback(construct(options, [ constructor ], [ vargs[0] ]))
                        }
                    }
                }
                const merged = Class._options([ options ], vargs)
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
                    const result = await f
                    if (typeof Interrupt.audit == 'function') {
                        construct(options, vargs, [ AUDIT ], callee)
                    }
                    return result
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
                const merged = Class._options([ options ], vargs)
                return function resolver (...vargs) {
                    return Class._resolver(resolver, merged, vargs)
                }
            }

            static resolve (...vargs) {
                return Class._resolver(Class.resolve, {}, vargs)
            }
        }

        // We have an prototypical state of an exception that we do not want to
        // store in the class and we definately do not want to expose it
        // publically.
        const Prototype = {
            name: name,
            symbols: new Map,
            codes: {}
        }

        // Detect duplicate declarations.
        const duplicates = new Set

        for (const code in codes) {
            // Duplicate declaration detection.
            if (duplicates.has(code)) {
                throw new Interrupt.Error('DUPLICATE_CODE', { code })
            }
            duplicates.add(code)

            // Use an existing code symbol from the super class if one exists,
            // otherwise create a new symbol.
            const existing = superclass[code]
            if (existing != null && typeof existing != 'symbol') {
                throw new Interrupt.Error('INVALID_CODE')
            }
            const symbol = superclass[code] || Symbol(code)

            // Create a property to hold the symbol in the class.
            Object.defineProperty(Class, code, { get: function () { return symbol } })

            // Our internal tracking of symbols.
            Prototype.symbols.set(symbol, code)

            // Convert the defintion to a code prototype.
            switch (typeof codes[code]) {
            case 'string':
                Prototype.codes[code] = { code, message: codes[code], properties: {}, symbol }
                break
            case 'object':
                if (codes[code] == null) {
                    Prototype.codes[code] = { code, message: null, properties: {}, symbol }
                } else {
                    // This will ensure that the properties can be serialized as
                    // JSON.
                    const properties = JSON.parse(JSON.stringify(codes[code]))
                    Prototype.codes[code] = { code, message: coalesce(properties.message), properties, symbol }
                    delete Prototype.codes[code].properties.message
                }
                break
            }
        }

        Object.defineProperty(Class, 'name', { value: name })

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
