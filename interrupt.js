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

const Prototypes = new WeakMap

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
function context (options, instance, stack = true) {
    // Attempt to use the options message as a `sprintf` format. Use the message
    // as is if `sprintf` fails.
    let message = instance.message = options.message
    try {
        message = instance.message = sprintf(options.message, options)
    } catch (error) {
        instance.errors.push({
            code: Interrupt.Error.SPRINTF_ERROR,
            format: options.format,
            properties: options.properties,
            error: error
        })
    }
    // The enumerable properties, if any, of the object using our special JSON.
    if (Object.keys(instance.displayed).length != 0) {
        message += '\n\n' + Interrupt.JSON.stringify(instance.displayed)
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

    // A header for the stack trace unless the stack trace has been suppressed.
    if (stack && (options.$stack == null || options.$stack != 0)) {
        message += '\n\nstack:\n'
    }

    return message
}

// A utility to merge two or more objects preserving their descriptor traits.
function combine (...vargs) {
    const properties = {}
    for (const object of vargs) {
        for (const property of Object.getOwnPropertyNames(object)) {
            properties[property] = Object.getOwnPropertyDescriptor(object, property)
        }
    }
    return Object.defineProperties({}, properties)
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
        throw new Interrupt.Error(Interrupt.Error.options.apply(Interrupt.Error, [{ $callee: assert }].concat(vargs)))
    }
}

// The Interrupt class extends `Error` using class ES6 extension.

//
class Interrupt extends Error {
    // Private static initializer. We are committed to Node.js 12 or greater.
    static #initializer = (function () {
        Prototypes.set(Interrupt, {
            is: new Map, Super: { Codes: {}, Aliases: {} }
        })
    } ())

    // **TODO** Maybe a set of common symbols mapped to the existing Node.js
    // error types? No, the ability to specify a symbol, but it must be unique,
    // and we can put those types in `Interrupt.Error`.

    // The `Interrupt.Error` class is itself an interrupt defined error.
    static Error = Interrupt.create('Interrupt.Error', {
        // **TODO** Rename.
        INVALID_CODE: 'code is already a property of the superclass',
        UNKNOWN_CODE: 'unknown code',
        INVALID_CODE_TYPE: 'invalid code type',
        INVALID_ACCESS: 'constructor is not a public interface',
        PARSE_ERROR: null,
        SPRINTF_ERROR: null,
        NULL_ARGUMENT: 'null argument given to exception constructor',
        INVALID_PROPERTY_NAME: 'invalid property name',
        INVALID_PROPERTY_TYPE: 'invalid property type',
        INVALID_PROPERTY_NAME: 'invalid property name',
        DEFERRED_CONSTRUCTOR_INVALID_RETURN: null,
        DEFERRED_CONSTRUCTOR_NOT_CALLED: null
    }, function ({ Codes }) {
        return {
            SUPER_PROTOTYPE_MISSING: {
                code: Codes.INVALID_CODE.symbol,
                message: 'attempt to define alias of non-existant code or alias'
            },
            SYMBOLS_NOT_ALLOWED: {
                code: Codes.INVALID_CODE.symbol,
                message: 'code alias definitions cannot define a `symbol` property'
            }
        }
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

    static Code (object) {
        return Object.defineProperties({}, {
            code: { value: object.code, enumerable: true },
            symbol: { value: object.symbol, enumerable: false }
        })
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
        assert(PROTECTED === Protected, 'INVALID_ACCESS')
        // When called with no arguments we call our super constructor with no
        // arguments to eventually call `Error` with no argments to create an
        // empty error.
        const args = Class.options.apply(Class, vargs)
        const prototypes = [ Prototype.prototypes[args.code] || { code: null } ]
        const code = prototypes[0].code
        if (prototypes[0].code != null && prototypes[0].code != args.code) {
            let superPrototype = prototypes[0], superCode
            do {
                superCode = superPrototype.code
                superPrototype = Prototype.prototypes[superCode]
                prototypes.unshift(superPrototype)
            } while (superPrototype.code != superCode)
        }
        prototypes.push(args, { code: prototypes[prototypes.length - 1].code })
        const options = Class.options.apply(Class, prototypes)

        const properties = {
            name: {
                // **TODO** Class.name?
                value: Prototype.name,
                enumerable: false,
                writable: false
            },
            errors: {
                value: options.errors,
                enumerable: false,
                writable: false
            }
        }

        if (options.code) {
            properties.code = {
                value: options.code,
                enumerable: true,
                writable: false
            }
            properties.symbol = {
                value: Prototype.prototypes[options.code].symbol,
                enumerable: false,
                writable: false
            }
        }

        for (const property of Object.getOwnPropertyNames(options)) {
            if (property[0] != '_' && property[0] != '$' && !/^(?:name|message|stack|symbol)$/.test(property) && !(property in properties)) {
                properties[property] = Object.getOwnPropertyDescriptor(options, property)
            }
        }

        const instance = { message: null, errors: options.$errors, options, displayed: {} }

        for (const property in properties) {
            if (properties[property].enumerable) {
                instance.displayed[property] = properties[property].value
            }
        }

        const stackTraceLimit = Error.stackTraceLimit
        if (options.$stack != null) {
            Error.stackTraceLimit = options.$stack
        }

        // **TODO** Display internal errors.
        if (
            options.code == null &&
            options.message == null &&
            options.errors.length == 0 &&
            Object.keys(options).filter(name => !/^\$|^#|^errors$/.test(name)).length == 0
        ) {
            super()
        } else {
            super(context(options, instance))
        }

        Instances.set(this, instance)

        const invisible = {}
        for (const property in properties) {
            invisible[property] = { ...properties[property], enumerable: false }
        }

        invisible.properties = {
            value: Object.defineProperties({}, properties),
            enumerable: false,
            writable: false,
            configurable: false
        }

        Object.defineProperties(this, invisible)

        // FYI It is faster to use `Error.captureStackTrace` again than
        // it is to try to strip the stack frames created by `Error`
        // using a regular expression or string manipulation. You know
        // because you tried. Years later: Thanks for reminding me, I keep
        // coming back to experiment with it.

        //
        if (options.$callee != null) {
            Error.captureStackTrace(this, options.$callee)
        }

        Error.stackTraceLimit = stackTraceLimit
    }

    // Our `toString` representation mirrors that of Node.js. We remove the
    // context and headings from the `message` used to generate `stack`.
    toString () {
        const instance = Instances.get(this)
        if (instance.message == null) {
            return this.name
        }
        return `${this.name}: ${instance.message}`
    }

    static get OPTIONS () {
        return OPTIONS
    }

    static get CURRY () {
        return { $type: OPTIONS }
    }

    static get auditing () {
        return typeof this.audit == 'function'
    }

    // **TODO** Wouldn't it be nice to have some sort of way to specify
    // properties by code? Like which subsystem or a severity?

    //
    static create (name, ...vargs) {
        const SuperClass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt

        if (Interrupt.Error != null) {
            assert(SuperClass === Interrupt || SuperClass.prototype instanceof Interrupt, 'INVALID_SUPER_CLASS', SuperClass.name)
        }

        const Class = class extends SuperClass {
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
                return Prototype.codes[code]
            }

            static options (...vargs) {
                function attr (value) {
                    return { value: value, enumerable: true, writable: true, configurable: true }
                }
                const options = {
                    $type: attr(OPTIONS),
                    $errors: attr([]),
                    errors: attr([]),
                    $pokers: attr([]),
                    $stack: attr(null),
                    $callee: attr(null)
                }
                while (vargs.length != 0) {
                    const argument = vargs.shift()
                    switch (typeof argument) {
                    case 'string': {
                            // **TODO** Keep expecting us to use the first code that is set, but
                            // we don't do that, do we?
                            if (Prototype.prototypes[argument] != null) {
                                options.code = attr(argument)
                            } else {
                                options.message = attr(argument)
                            }
                        }
                        break
                    case 'symbol': {
                            // **TODO** Wondering about code overrides, should they be allowed?
                            // Or do we accept the first code that is set?
                            const code = Prototype.symbols.get(argument)
                            if (code != null) {
                                options.code = attr(code)
                            }
                        }
                        break
                    case 'number': {
                            if ((Number.isInteger(argument) || argument == Infinity) && argument >= 0) {
                                options.$stack = attr(argument)
                            } else {
                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE')))
                            }
                        }
                        break
                    case 'object': {
                            if (argument == null) {
                                // **TODO** code = { text, symbol } // name? label? identifier? id? string?
                                options.$errors.push(combine(Interrupt.Error.codes('NULL_ARGUMENT')))
                            } else if (argument instanceof Error) {
                                options.errors.value.push(argument)
                            } else if (Array.isArray(argument)) {
                                options.errors.value.push.apply(options.errors.value, argument)
                            } else {
                                for (const property of Object.getOwnPropertyNames(argument)) {
                                    switch (property) {
                                    case '$type': {
                                            if (argument[property] !== OPTIONS) {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case '$vargs': {
                                            if (argument[property] == null) {
                                            } else if (Array.isArray(argument[property])) {
                                                vargs.unshift.apply(vargs, argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case '$pokers': {
                                            if (argument[property] == null) {
                                            } else if (typeof argument[property] == 'function') {
                                                options.$pokers.value.push(argument[property])
                                            } else if (
                                                Array.isArray(argument[property]) &&
                                                argument[property].every(element => typeof element == 'function')
                                            ) {
                                                options[property].value.push.apply(options[property].value, argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case '$errors': {
                                            if (
                                                Array.isArray(argument[property]) &&
                                                argument[property].every(error => {
                                                    return Interrupt.Error[error.code] === error.symbol
                                                })
                                            ) {
                                                options.$errors.value.push.apply(options.$errors.value, argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case '$stack': {
                                            const stack = argument[property]
                                            if (stack == null) {
                                            } else if ((Number.isInteger(stack) || stack == Infinity) && stack >= 0) {
                                                options.$stack = attr(stack)
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case 'stack':
                                    case 'name': {
                                            options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_NAME'), { property }))
                                        }
                                        break
                                    case 'errors': {
                                            if (Array.isArray(argument[property])) {
                                                options.errors.value.push.apply(options.errors.value, argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case 'message': {
                                            if (argument[property] == null) {
                                            } else if (typeof argument[property] === 'string') {
                                                options.message = attr(argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case 'code': {
                                            // **TODO** Convert `symbol` to `string`.
                                            if (argument[property] == null) {
                                            } else if (typeof argument[property] === 'string') {
                                                if (Prototype.prototypes[argument[property]]) {
                                                    options.code = attr(argument[property])
                                                } else {
                                                    options.$errors.value.push(combine(Interrupt.Error.codes('UNKNOWN_CODE'), {
                                                        property: property,
                                                        value: argument[property]
                                                    }))
                                                }
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.code('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case 'symbol': {
                                            if (argument[property] == null) {
                                            } else if (typeof argument[property] == 'symbol') {
                                                const code = Prototype.symbols.get(argument[property])
                                                if (code != null) {
                                                    options.code = attr(code)
                                                } else {
                                                    options.$errors.value.push(combine(Interrupt.Error.codes('UNKNOWN_CODE'), {
                                                        property: property,
                                                        value: argument[property]
                                                    }))
                                                }
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    case '$callee': {
                                            if (argument[property] == null) {
                                            } else if (typeof argument[property] == 'function') {
                                                options[property] = attr(argument[property])
                                            } else {
                                                options.$errors.value.push(combine(Interrupt.Error.codes('INVALID_PROPERTY_TYPE'), { property }))
                                            }
                                        }
                                        break
                                    default: {
                                            if (!RE.identifier.test(property)) {
                                                options.$errors.value.push(combine(Interrupt.Error.code('INVALID_PROPERTY_NAME'), { property }))
                                            } else {
                                                options[property] = Object.getOwnPropertyDescriptor(argument, property)
                                            }
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
                return Object.defineProperties({}, options)
            }

            static create (options, vargs, ...callees) {
                return construct(options, vargs, callees[0], callees[1])
            }

            static audit (options, vargs, ...callees) {
                if (typeof Interrupt.audit == 'function') {
                    construct(options, vargs, callees[0], callees[1])
                }
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

            static resolve (...vargs) {
                return _resolver(Class.resolve, {}, vargs)
            }
        }

        function _construct (options, vargs, callees) {
            debugger
            const prelimary = vargs.length > 0 && typeof vargs[vargs.length - 1] == 'function'
                ? Class.options(options, { $vargs: vargs }, { $pokers: vargs.pop() })
                : Class.options(options, { $vargs: vargs })
            if (prelimary.$pokers.length != 0) {
                let error = null
                const $ = function () { error = new Class(merged) }
                const merged = Class.options({ $callee: $ }, prelimary)
                const pokers = merged.$pokers.slice()
                let previous = $
                while (pokers.length != 0) {
                    previous = function (caller, callee) {
                        return caller.bind(null, callee)
                    } (pokers.shift(), previous)
                }
                previous()
                if (error == null) {
                    const error = new Class(merged)
                    const instance = Instances.get(error)
                    instance.errors.push({
                        code: Interrupt.Error.DEFERRED_CONSTRUCTOR_NOT_CALLED
                    })
                    return error
                }
                return error
            } else {
                return new Class(Class.options({ $callee: callees[0] }, prelimary))
            }
        }

        function construct (options, vargs, ...callees) {
            const error = _construct(options, vargs, callees)
            if (Interrupt.auditing) {
                Interrupt.audit(error, Instances.get(error).errors)
            }
            return error
        }

        function _assert (callee, options, vargs) {
            if (typeof vargs[0] === 'object' && vargs[0] != null && vargs[0].$type === OPTIONS) {
                const curried = Class.options(options, { $vargs: vargs })
                return function assert (...vargs) {
                    return _assert(assert, curried, vargs)
                }
            } else if (!vargs[0]) {
                vargs.shift()
                throw construct(options, vargs, callee, callee)
            } else if (Interrupt.auditing) {
                construct(options, vargs, callee, callee)
            }
        }

        function _invoke (callee, options, vargs) {
            if (typeof vargs[0] == 'function') {
                const f = vargs.shift()
                try {
                    const result = f()
                    if (Interrupt.auditing) {
                        construct(Class.options(options, { errors: [ AUDIT ] }), vargs, callee, callee)
                    }
                    return result
                } catch (error) {
                    throw construct(Class.options(options, { errors: [ error ] }), vargs, callee, callee)
                }
            }
            const curried = Class.options(options, { $vargs: vargs })
            return function invoker (...vargs) {
                return _invoke(invoker, curried, vargs)
            }
        }

        // **TOODO** You cannot curry a poker function.
        function _callback (callee, options, vargs) {
            if (typeof vargs[vargs.length - 1] == 'function') {
                const callback = vargs.pop()
                return function (...response) {
                    if (response[0] == null) {
                        if (Interrupt.auditing) {
                            construct(Class.options(options, { errors: [ AUDIT ] }), vargs)
                        }
                        const poker = typeof vargs[vargs.length - 1] == 'function' ? vargs.pop() : null
                        const merged = Class.options(options, { $vargs: vargs }, { $pokers: poker })
                        callback.apply(null, response.concat({ $pokers: merged.$pokers }))
                    } else {
                        callback(construct(Class.options(options, { errors: [ response[0] ] }), vargs))
                    }
                }
            }
            const merged = Class.options(options, { $vargs: vargs })
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
                // **TODO** No, I don't want to do this merge every time. Yes, just
                // go ahead and have the test condition here.
                if (Interrupt.auditing) {
                    construct(Class.options(options, { errors: [ AUDIT ] }), vargs, callee)
                }
                return result
            } catch (error) {
                throw construct(Class.options(options, { errors: [ error ] }), vargs, callee)
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
            const merged = Class.options(options, { $vargs: vargs })
            return function resolver (...vargs) {
                return _resolver(resolver, merged, vargs)
            }
        }

        Object.defineProperty(Class, 'name', { value: name })

        // We have an prototypical state of an exception that we do not want to
        // store in the class and we definitely do not want to expose it
        // publicly.

        // Running out of names, must tidy.
        const SuperPrototype = Prototypes.get(SuperClass)
        const Prototype = {
            name: name,
            is: new Map,
            symbols: new Map,
            codes: {},
            prototypes: {},
            Super: { Codes: {}, Aliases: {} }
        }
        Prototypes.set(Class, Prototype)

        // Detect duplicate declarations.
        const duplicates = new Set

        while (vargs.length != 0) {
            const codes = vargs.shift()
            switch (typeof codes) {
            // Define a code with no default properties.
            case 'string': {
                    const object = {}
                    object[codes] = null
                    vargs.unshift(object)
                    continue
                }
            // Invoke a function that will return further code definitions.
            case 'function': {
                    vargs.unshift(codes({ Codes: Prototype.Super.Codes, Super: SuperPrototype.Super }))
                    continue
                }
            // If an array, unshift the definitions onto our argument list,
            // otherwise fall through to object processing.
            case 'object': {
                    assert(codes != null, 'INVALID_ARGUMENT')
                    if (Array.isArray(codes)) {
                        vargs.unshift.apply(vargs, codes)
                        continue
                    }
                    if (SuperPrototype.is.has(codes)) {
                        const object = {}
                        object[codes.code] = SuperPrototype.prototypes[codes.code]
                        vargs.unshift(object)
                        continue
                    }
                    for (const code in codes) {
                        // Duplicate declaration detection. **TODO** Better error.
                        assert(!duplicates.has(code), 'DUPLICATE_CODE', { code })
                        duplicates.add(code)

                        // Use an existing code symbol from the super class if one exists,
                        // otherwise create a new symbol.

                        const object = function () {
                            switch (typeof codes[code]) {
                            case 'symbol': {
                                    // **TODO** This is new, what about it?
                                    return { code, symbol: codes[code] }
                                }
                            case 'string': {
                                    return { message: codes[code] }
                                }
                            case 'object': {
                                    if (codes[code] == null) {
                                        return {}
                                    }
                                    return codes[code]
                                }
                            default:
                                throw new Error
                            }
                        } ()

                        // Goes here.
                        const prototype = function () {
                            // **TODO** Kind of broken. What if the user uses a key other than
                            // the existing code? Turn `is` into map and use the existing code,
                            // I guess.
                            if (SuperPrototype.is.has(object)) {
                                return object
                            }
                            if (object == null) {
                                return { code }
                            }
                            switch (typeof coalesce(object.code)) {
                            case 'symbol': {
                                    // Create an alias of the specified `code`. When creating an alias,
                                    // specifying a `symbol` is not allowed.
                                    const code = Prototype.symbols.get(object.code)
                                    assert(code != null, 'INVALID_CODE')
                                    return combine(object, { code: code })
                                }
                            case 'string': {
                                    // If the code in the object matches the used as the key, that's
                                    // exactly the form we use for the prototype, otherwise we're
                                    // creating an alias.
                                    if (object.code == code) {
                                        return object
                                    }
                                    assert(Prototype.prototypes[object.code] != null, 'INVALID_CODE')
                                    return object
                                }
                            case 'object': {
                                    // No alias, set the code to key from the set of aliases.
                                    if (object.code == null) {
                                        return combine(object, { code })
                                    }
                                    // Define an alias extending on the given code or alias.
                                    const superSuperCode = SuperPrototype.is.get(object.code)
                                    if (superSuperCode != null) {
                                        if (superSuperCode === object.code.code) {
                                            assert(superSuperCode == code, 'INVALID_CODE')
                                            return combine(object.code, object, { code: code })
                                        } else {
                                            return combine(object.code, object, { code: code, symbol: null })
                                        }
                                    }
                                    const superCode = Prototype.is.get(object.code)
                                    assert(superCode != null, 'INVALID_CODE')
                                    // Must be an alias.
                                    return combine(object.code, object, { symbol: null, code: object.code.code })
                                }
                            default:
                                throw new Error('INVALID_CODE')
                            }
                        } ()

                        if (prototype.message == null) {
                            prototype.message = prototype.code
                        }
                        if (prototype.code == code) {
                            if (prototype.symbol == null) {
                                prototype.symbol = Symbol(code)
                            }
                            // Create a property to hold the symbol in the class.
                            Object.defineProperty(Class, code, { value: prototype.symbol })

                            // Our internal tracking of symbols.
                            Prototype.symbols.set(prototype.symbol, code)

                            Prototype.codes[code] = Object.defineProperties({}, {
                                code: { value: code, enumerable: true },
                                symbol: { value: prototype.symbol }
                            })

                            Prototype.Super.Codes[code] = prototype
                        } else {
                            assert(Prototype.prototypes[prototype.code], 'SUPER_PROTOTYPE_MISSING', {
                                definition: { superCode: prototype.code, code: code }
                            })
                            assert(prototype.symbol == null, 'SYMBOLS_NOT_ALLOWED', {
                                definition: { symbol: String(prototype.symbol), superCode: prototype.code, code: code }
                            })
                            Prototype.Super.Aliases[code] = prototype
                        }
                        Prototype.prototypes[code] = prototype
                        Prototype.is.set(prototype, code)
                    }
                }
                break
            default:
                throw new Interrupt.Error('INVALID_ARGUMENT')
            }
        }

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
    assert($ != null, 'PARSE_ERROR', position)
    return $[1]
}

module.exports = Interrupt
