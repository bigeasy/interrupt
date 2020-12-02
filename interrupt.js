// Node.js API.
const util = require('util')

// Return the first non-`null` like parameter.
const coalesce = require('extant')

// Deep differences.
const Keyify = require('keyify')

// Weak map of instances to construction material used for de-duplication and
// reporting to report the errors of our errors. Errors in JavaScript are simple
// objects and utilities that encounter them will do things like print their
// properties to console so protected status of protected properties is likely
// to be violated.
const Instances = new WeakMap

// Parse the file and line number from a Node.js stack trace.
const location = require('./location')

// `sprintf` supports named parameters so we can use our parameters object to
// fill in the `sprintf` place-holders.
const sprintf = require('sprintf-js').sprintf

// Used to assert that the constructor is only ever called from a generated
// derived Interrupt class.
const PROTECTED = Symbol('PROTECTED')

// The value of the `type` property for the options object to the constructor.
// Use for disambiguation when currying `assert`.
const OPTIONS = Symbol('OPTIONS')

// This is a place-holder object for the nested exception when we generate
// exceptions to audit assertions and guarded functions.
const AUDIT = new Error('example')

// Generate the message for the Goole V8 exception. The message is specially
// formatted to appear integrated with the stack trace from `error.stack` which
// includes the message in the stack trace.
function context (options, prototype, instance, stack = true) {
    let message
    const format = options.format || prototype.message || prototype.code
    try {
        message = instance.message = sprintf(format, options.properties)
    } catch (error) {
        instance.errors.push({
            code: Interrupt.Error.SPRINTF_ERROR,
            format: format,
            properties: options.properties,
            error: error
        })
        message = instance.message = format
    }
    const contexts = []
    const context = options.code != null
        ? { code: options.code, ...options.properties }
        : { ...options.properties }
    if (Object.keys(context).length != 0) {
        message += '\n\n' + Interrupt.JSON.stringify(context)
    }
    // **TODO** Without context messages we have more space. We could, if the
    // type is not an Error, serialize the cause as JSON. Parsing would be a
    // matter of detecting if it is an error, if not it is going to be JSON.
    // JSON will not look like an error, perhaps just plain `null` would be
    // confusing, but I doubt it.
    if (options.errors.length) {
        for (let i = 0, I = options.errors.length; i < I; i++) {
            const error = options.errors[i]
            const text = error instanceof Error ? Interrupt.stringify(error) : error.toString()
            const indented = text.replace(/^/gm, '    ')
            message += '\n\ncause:\n\n' + indented
        }
    }

    if (stack) {
        message += '\n\nstack:\n'
    }

    return message
}

// Get an object from a tree of objects `object` using the given array of
// indexes in the given `path`. Used by our specialized JSON to generate and
// resolve references.
function get (object, path) {
    let iterator = object
    for (const part of path) {
        iterator = iterator[part]
    }
    return iterator
}

class Collector {
    constructor () {
        this._lines = []
    }

    push (line) {
        this._lines.push(line)
    }

    end () {
        if (this._lines[this._lines.length - 1] === '') {
            this._lines.pop()
        }
        return this._lines.join('\n')
    }
}

// An assert internal to Interrupt that will not get audited.
function assert (condition, ...vargs) {
    if (! condition) {
        throw new Interrupt.Error(Interrupt._options([{ callee: assert }], vargs))
    }
}

// The Interrupt class extends `Error` using class ES6 extension.

//
class Interrupt extends Error {
    // **TODO** Maybe a set of common symbols mapped to the existing Node.js
    // error types? No, the ability to specify a symbol, but it must be unique,
    // and we can put those types in `Interrupt.Error`.

    // The `Interrupt.Error` class is itself an interrupt defined error.
    static Error = Interrupt.create('Interrupt.Error', {
        INVALID_CODE: 'code is already a property of the superclass',
        UNKNOWN_CODE: 'unknown code',
        INVALID_CODE_TYPE: 'invalid code type',
        INVALID_ACCESS: 'constructor is not a public interface',
        PARSE_ERROR: null,
        SPRINTF_ERROR: null,
        DEFERRED_CONSTRUCTOR_INVALID_RETURN: null,
        DEFERRED_CONSTRUCTOR_NOT_CALLED: null
    })

    static explode (error) {
        const preamble = error.message == ''
            ? `${error.name}`
            : `${error.name}: ${error.message}`
        if (
            error.name == null ||
            error.message == null ||
            error.stack == null ||
            error.stack.indexOf(preamble) != 0 ||
            !RE.identifier.test(error.name)
        ) {
            return [{
                constructor: error.constructor.name,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack == null ? null : unstacker.parse(error.stack),
                    properties: { ...error }
                }
            }]
        }
        const stack = error.stack[preamble.length] == '\n'
            ? error.stack.substring(preamble.length + 1)
            : error.stack.substring(preamble.length)
        return {
            name: error.name,
            message: error.message,
            properties: { ...error },
            stack: stack
        }
    }

    static stringify (error) {
        if (error instanceof Interrupt) {
            return error.stack
        }
        const exploded = Interrupt.explode(error)
        if (Array.isArray(exploded)) {
            return Interrupt.JSON.stringify(exploded[0])
        }
        if (exploded.message == '' && Object.keys(exploded.properties).length == 0) {
            return error.stack
        }
        const message = error.message.split('\n')
        for (let i = 1, I = message.length; i < I; i++) {
            message[i] = `    ${message[i]}`
        }
        const title = exploded.message == ''
            ? `${exploded.name}`
            : `${exploded.name}: ${message.join('\n')}`
        const header = Object.keys(exploded.properties).length == 0
            ? title
            : `${title}\n\n${Interrupt.JSON.stringify(exploded.properties)}`
        if (exploded.stack.length == 0) {
            return header
        }
        return `${header}\n\nstack:\n\n${exploded.stack}`
    }

    static Parser = class Parser {
        constructor (scan = false) {
            this._scannable = scan
            this._scanning = scan
            this._mode = scan ? 'scan' : 'exception'
            this._collector = null
            this._depth = 0
            this._position = { line: 1 }
        }

        static _DEDENT = {
            'message': 1,
            'properties': 0,
            'stack': 0
        }

        // **TODO** Need to be regex so we can detect a naked error with no
        // message and a stack that starts with `'    at'`.
        static _START = {
            'properties': '{',
            'stack': 'stack:',
            'errors': 'cause:'
        }

        static _TRANSITION = {
            'message': [ 'properties', 'errors', 'stack' ],
            'properties': [ 'errors', 'stack' ],
            'errors': [ 'errors', 'stack' ],
            'stack': [],
            'object': []
        }

        static _INCLUDE = {
            'message': false,
            'properties': true,
            'errors': false,
            'stack': 'false'
        }

        _complete () {
            switch (this._mode) {
            case 'message': {
                    this._node.message = this._collector.end()
                    this._collector.length = 0
                }
                break
            case 'properties': {
                    this._node.properties = Interrupt.JSON.parse(this._collector.end())
                }
                break
            case 'stack': {
                    this._node.stack = unstacker.parse(this._collector.end())
                }
                break
            case 'errors': {
                    this._node.errors.push(this._collector.end())
                }
                break
            case 'object': {
                    this._node = Interrupt.JSON.parse(this._collector.end())
                }
                break
            }
        }

        _transition (source) {
            MODES: for (const mode of Interrupt.Parser._TRANSITION[this._mode]) {
                if (source.trimRight() === Interrupt.Parser._START[mode]) {
                    this._complete()
                    switch (this._mode = mode) {
                    case 'errors': {
                            this._collector = new Interrupt.Parser
                            this._collector._mode = 'cause'
                        }
                        break
                    default: {
                            this._collector = new Collector
                        }
                        break
                    }
                    return Interrupt.Parser._INCLUDE[this._mode]
                }
            }
            return true
        }

        _exception (line) {
            const $ = RE.exceptionStart.exec(line)
            if ($ != null) {
                const [ , space, className, separator, message ] = $
                this._depth = space.length
                this._collector = new Collector
                this._node = {
                    className: className,
                    message: null,
                    properties: {},
                    errors: [],
                    _errors: [],
                    stack: []
                }
                if (separator != null) {
                    this._collector.push(message)
                }
                this._mode = 'message'
                return true
            }
            return false
        }

        push(line) {
            switch (this._mode) {
            case 'exception': {
                    this._position = { line: 1, text: line }
                    const dedented = dedent(line, this._depth, this._position)
                    const $ = RE.exceptionStart.exec(line)
                    assert($ != null, 'PARSE_ERROR', this._position)
                    const [ , space, className, separator, message ] = $
                    this._depth = space.length
                    this._collector = new Collector
                    this._node = {
                        className: className,
                        message: null,
                        properties: {},
                        errors: [],
                        _errors: [],
                        stack: []
                    }
                    if (separator != null) {
                        this._collector.push(message)
                    }
                    this._mode = 'message'
                }
                break
            case 'cause': {
                    if (/\S+/.test(line) && ! this._exception(line)) {
                        console.log('OH, NO!')
                        this._collector = new Collector
                        this._collector.push(line)
                        this._mode = 'object'
                    }
                }
                break
            default: {
                    this._position.line++
                    this._position.text = line
                    const dedented = dedent(line, this._depth, this._position)
                    if (this._transition(dedented, 'properties', 'cause', 'stack')) {
                        this._collector.push(dedent(dedented, this._mode == 'message' ? 1 : 0, this._position))
                    }
                }
                break
            }
        }

        end () {
            this._complete()
            return this._node
        }
    }

    // We implement custom JSON serialization that supports circular references
    // because we don't want to raise an exception on bad JSON because JSON
    // serialization is used for printing out the properties on the error path.
    // We don't want to raise an exception on bad JSON and we don't want to
    // neglect to say as much as we can about the properties we've been given.
    static JSON = {
        // Stringify visits each object in the object to look for duplicate
        // objects and mark them for reference construction in the replacer. It
        // does not create a copy of the object because we want
        // `JSON.stringify()` is to resolve the `.toJSON()` conversions.
        stringify (object) {
            const seen = new Map
            const replacements = new Map
            function visit (path, value) {
                switch (typeof value) {
                case 'object': {
                        if (value != null) {
                            const reference = seen.get(value)
                            if (reference != null) {
                                replacements.set(value, '_reference')
                            } else {
                                seen.set(value, path)
                                if (Array.isArray(value)) {
                                    const array = []
                                    if (
                                        typeof value[0] == 'string' &&
                                        /^_reference|_array|_undefined$/.test(value[0])
                                    ) {
                                        replacements.set(value, [ '_array' ].concat(value))
                                    }
                                } else if (value instanceof Error && ! (value instanceof Interrupt && value === object)) {
                                    const error = { message: value.message }
                                    for (const key in value) {
                                        error[key] = value[key]
                                    }
                                    replacements.set(value, error)
                                } else {
                                    for (const property in value) {
                                        visit(path.concat(property), value[property])
                                    }
                                }
                            }
                        }
                    }
                default:
                    return value
                }
            }
            const referenced = visit([], object)
            return JSON.stringify(referenced, function (index, value) {
                if (typeof value === 'undefined') {
                    return [ '_undefined' ]
                }
                if (typeof value === 'function' || typeof value === 'symbol') {
                    return value.toString()
                }
                if (typeof value == 'object' && value != null) {
                    const replacement = replacements.get(value)
                    if (replacement != null) {
                        if (replacement === '_reference') {
                            const path = seen.get(value)
                            const origin = {
                                object: get(object, path.slice(0, path.length - 1)),
                                index: path[path.length - 1]
                            }
                            if (origin.object === this && origin.index === index) {
                                return value
                            }
                            return [ '_reference', path ]
                        }
                        return replacement
                    }
                }
                return value
            }, 4)
        },
        // Parse converts our escaped `Array` and `undefined` place holders and
        // builds an array of references in the reviver. It resolve the
        // references after parsing so that any referenced arrays are already
        // converted.
        parse (json) {
            const references = []
            const parsed = [ JSON.parse(json) ]
            function visit (object, index, value) {
                if (typeof value == 'object' && value != null) {
                    if (Array.isArray(value)) {
                        switch (value[0]) {
                        case '_reference':
                            references.push({ object, index, path: value[1] })
                            break
                        case '_undefined':
                            object[index] = void 0
                            break
                        case '_array':
                            value.shift()
                        default:
                            for (let i = 0, I = value.length; i < I; i++) {
                                visit(value, i, value[i])
                            }
                        }
                    } else {
                        for (const property in value) {
                            visit(value, property, value[property])
                        }
                    }
                }
            }
            visit(parsed, 0, parsed[0])
            for (const { object, index, path } of references) {
                object[index] = get(parsed[0], path)
            }
            return parsed[0]
        }
    }
    //

    // This constructor is only called by derived class and should not be called
    // by the user. An argument could be made that we accommodate the user that
    // hasn't read the documentation because they could be calling this in
    // production having never tested an exceptional branch of their code, but
    // they could just as easily have misspelled `Interrupt`. Basically, we're
    // not going to be as accommodating as all that.

    //
    constructor (Protected, Class, Prototype, vargs) {
        // We can't use `Interrupt.Error.assert` because auditing will make us
        // blow the stack.
        if (PROTECTED !== Protected) {
            throw new Interrupt.Error('INVALID_ACCESS')
        }
        // When called with no arguments we call our super constructor with no
        // arguments to eventually call `Error` with no argments to create an
        // empty error.
        const { options, prototype } = function () {
            const options = Class._options(vargs)
            const prototype = Prototype.codes[options.code] || { message: null, properties: {}, code: null }
            return {
                options: Class._options([{ properties: prototype.properties }], [ options ]),
                prototype: prototype
            }
        } ()

        const properties = {
            name: {
                value: Prototype.name,
                enumerable: false
            },
            errors: {
                value: options.errors,
                enumerable: false
            }
        }

        if (options.code) {
            properties.code = {
                value: options.code,
                enumerable: true
            }
            properties.symbol = {
                value: Prototype.codes[options.code].symbol,
                enumerable: false
            }
        }

        for (const property in options.properties) {
            if (!/^name|message|stack$/.test(property) && !(properties in properties)) {
                properties[property] = {
                    value: options.properties[property],
                    enumerable: coalesce(Prototype.enumerable[property], true)
                }
            }
        }

        const instance = { message: null, errors: options._errors, options }

        if (
            options.code == null &&
            options.format == null &&
            options.errors.length == 0 &&
            Object.keys(options.properties).length == 0
        ) {
            super()
        } else {
            super(context(options, prototype, instance))
        }

        Instances.set(this, instance)

        Object.defineProperties(this, properties)

        // FYI It is faster to use `Error.captureStackTrace` again than
        // it is to try to strip the stack frames created by `Error`
        // using a regular expression or string manipulation. You know
        // because you tried. Years later: Thanks for reminding me, I keep
        // coming back to experiment with it.

        //
        if (options.callee != null) {
            Error.captureStackTrace(this, options.callee)
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
        const SuperClass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt

        if (Interrupt.Error != null) {
            Interrupt.Error.assert(SuperClass === Interrupt || SuperClass.prototype instanceof Interrupt, 'INVALID_SUPER_CLASS', SuperClass.name)
        }

        const Class = class extends SuperClass {
            static Context = class {
                constructor (...vargs) {
                    const { options, prototype } = function () {
                        const options = Class._options(vargs)
                        const prototype = Prototype.codes[options.code] || { message: null, properties: null, code: null }
                        return {
                            options: prototype.properties ? Class._options([{ properties: prototype.properties }], [ options ]) : options,
                            prototype: prototype
                        }
                    } ()
                    const instance = { errors: [] }
                    this._dump = `${name}.Context: ${context(options, prototype, instance, false)}`
                    for (const property in options.properties) {
                        this[property] = options.properties[property]
                    }
                }

                toString () {
                    return this._dump
                }
            }

            constructor (...vargs) {
                if (vargs[0] === PROTECTED) {
                    super(...vargs)
                } else {
                    super(PROTECTED, Class, Prototype, vargs)
                }
            }

            static get codes () {
                return Object.keys(Prototype.codes)
            }

            static code (code) {
                return Codes[code]
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


            static assert (...vargs) {
                return _assert(Class.assert, {}, vargs)
            }

            static invoke (...vargs) {
                return _invoke(Class.invoke, {}, vargs)
            }

            static callback (...vargs) {
                return _callback(Class.callback, {}, vargs)
            }

            //

            static resolve (...vargs) {
                return _resolver(Class.resolve, {}, vargs)
            }
        }

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
                        code: Interrupt.Error.DEFERRED_CONSTRUCTOR_NOT_CALLED
                    })
                    return error
                }
                if (typeof error != 'object' || error == null || !(error instanceof Class)) {
                    const error = new Class
                    const instance = Instances.get(error)
                    instance.errors.push({
                        code: Interrupt.Error.DEFERRED_CONSTRUCTOR_INVALID_RETURN
                    })
                    return error
                }
                return error
            } else {
                return new Class(Class._options([{ callee: callees[0] }], [ options ], vargs, [{ errors }]))
            }
        }

        function _assert (callee, options, vargs) {
            if (typeof vargs[0] === 'object' && vargs[0].type === OPTIONS) {
                const merged = Class._options([ options ], vargs)
                return function assert (...vargs) {
                    _assert(assert, merged, vargs)
                }
            } else if (!vargs[0]) {
                vargs.shift()
                throw construct(options, vargs, [], callee, callee)
            } else if (typeof Interrupt.audit == 'function') {
                construct(options, vargs, [], callee, callee)
            }
        }

        function _invoke (callee, options, vargs) {
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
                return _invoke(invoker, merged, vargs)
            }
        }

        function _callback (callee, options, vargs) {
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
                return _callback(wrapper, merged, vargs)
            }
        }

        async function resolve (callee, f, options, vargs) {
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

        function _resolver (callee, options, vargs) {
            if (
                typeof vargs[0] == 'function' ||
                (
                    typeof vargs[0] == 'object' &&
                    vargs[0] != null &&
                    typeof vargs[0].then == 'function'
                )
            ) {
                return resolve(callee, vargs.shift(), options, vargs)
            }
            const merged = Class._options([ options ], vargs)
            return function resolver (...vargs) {
                return _resolver(resolver, merged, vargs)
            }
        }

        // We have an prototypical state of an exception that we do not want to
        // store in the class and we definitely do not want to expose it
        // publicly.
        const Prototype = {
            name: name,
            symbols: new Map,
            codes: {},
            enumerable: {}
        }

        const Codes = {}

        // Detect duplicate declarations.
        const duplicates = new Set

        function convert (arg) {
            switch (typeof arg) {
            case 'string': {
                    const codes = {}
                    codes[arg] = null
                    return codes
                }
            case 'object': {
                    if (arg == null) {
                        throw new Interrupt.Error('INVALID_ARGUMENT')
                    }
                    if (Array.isArray(arg)) {
                        return arg.reduce((codes, value) => {
                            if (typeof value != 'string') {
                                throw new Interrupt.Error('INVALID_ARGUMENT')
                            }
                            codes[value] = null
                            return codes
                        }, {})
                    } else {
                        return arg
                    }
                }
            case 'function':
                return convert(arg(Codes))
            default:
                throw new Interrupt.Error('INVALID_ARGUMENT')
            }
        }

        for (const arg of vargs) {
            const codes = convert(arg)
            for (const code in codes) {
                // Duplicate declaration detection.
                if (duplicates.has(code)) {
                    throw new Interrupt.Error('DUPLICATE_CODE', { code })
                }
                duplicates.add(code)

                // Use an existing code symbol from the super class if one exists,
                // otherwise create a new symbol.
                const existing = SuperClass[code]
                if (existing != null && typeof existing != 'symbol') {
                    throw new Interrupt.Error('INVALID_CODE')
                }
                const symbol = SuperClass[code] || Symbol(code)

                // Create a property to hold the symbol in the class.
                Object.defineProperty(Class, code, { get: function () { return symbol } })

                // Our internal tracking of symbols.
                Prototype.symbols.set(symbol, code)

                Codes[code] = { code: code }
                Object.defineProperty(Codes[code], 'symbol', { value: symbol, enumerable: false })

                // Convert the defintion to a code prototype.
                switch (typeof codes[code]) {
                case 'string':
                    Prototype.codes[code] = { code, message: codes[code], properties: {}, symbol }
                    break
                case 'object':
                    if (codes[code] == null) {
                        Prototype.codes[code] = { code, message: null, properties: {}, symbol }
                    } else {
                        Prototype.codes[code] = {
                            code: code,
                            message: coalesce(codes[code].message),
                            properties: codes[code],
                            symbol: symbol
                        }
                    }
                    break
                }
            }
        }

        Object.defineProperty(Class, 'name', { value: name })

        return Class
    }

    // Get just the message for the given Interrupt error.
    //
    // If the error is not an Interrupt error return the `message` property of
    // the error or `null` if the property is not defined.
    static message (error) {
        const instance = Instances.get(error)
        if (instance != null) {
            return instance.message
        }
        return coalesce(error.message)
    }

    static parse (stack) {
        const parser = new Interrupt.Parser
        for (const line of stack.split('\n')) {
            parser.push(line)
        }
        parser.end()
        return parser._node
    }

    static dedup (error, keyify = (_, file, line) => [ file, line ]) {
        const seen = {}
        let id = 0
        function treeify (parent, error) {
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
                    context: {}, // **TODO** Legacy, dubious.
                    error: error,
                    errors: null
                }
                node.errors = error.errors.map((cause, index) => {
                    return treeify(node, cause)
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
                context: {},
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
                    const contextualized = Interrupt.JSON.stringify(context)
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
            const instance = Instances.get(node.error)
            const properties = { ...instance.options.properties }
            if (repeated != 1) {
                properties.repeated = repeated
            }
            const stack = node.error.stack.replace(/[\s\S]*^stack:$/m, 'stack:')
            if (Object.keys(properties).length != 0) {
                const contextualized = Interrupt.JSON.stringify(properties)
                return `${node.error.name}: ${instance.message}\n\n${properties}\n\n${errors.join('')}\n\n${stack}`
            }
            return `${node.error.name}: ${instance.message}\n\n${errors.join('')}\n\n${stack}`
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

// A valid JavaScript identifier. Taken from [this
// gist](https://gist.github.com/mathiasbynens/6334847) and used as a string for
// inclusion into other regexen.
const identifier = require('./identifier.json')

const RE = {
    identifier: new RegExp(`^${identifier}$`),
    exceptionStart: new RegExp(`^(\\s*)(${identifier}(?:\.${identifier})*)(:)\\s([\\s\\S]*)`, 'm')
}

const unstacker = require('stacktrace-parser')

const Dedents = new Map

function dedent (line, depth, position) {
    if (depth == 0 || line.length == 0) {
        return line
    }
    const dedenter = Dedents.get(depth)
    if (dedenter == null) {
        Dedents.set(depth, new RegExp(`^ {${depth}}(.*)$`))
        return dedent(line, depth, position)
    }
    const $ = dedenter.exec(line)
    if ($ == null) {
        throw new Interrupt.Error('incorrect indent', position)
    }
    return $[1]
}

module.exports = Interrupt
