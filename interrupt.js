const util = require('util')
const assert = require('assert')
const coalesce = require('extant')
const departure = require('departure')

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

function _causes (vargs) {
    if (vargs[0] instanceof Error) {
        return [ vargs.shift() ]
    } else if (Array.isArray(vargs[0])) {
        return vargs.shift()
    }
    return []
}

function _message (messages, varg, merge) {
    if (Array.isArray(varg)) {
        const message = messages[varg[0]]
        if (message != null) {
            merge.code = varg[0]
            varg[0] = message
        }
        return varg
    }
    const message = messages[varg]
    if (message != null) {
        merge.code = varg
        return [ message ]
    }
    return [ varg ]
}

function _vargs (messages, vargs, callee) {
    const merge = {}
    return [
        util.format.apply(util, _message(messages, vargs.shift(), merge)),
        _causes(vargs),
        { ...merge, ...coalesce(vargs.shift(), {}) },
        coalesce(vargs.shift(), {}),
        coalesce(callee, vargs.shift())
    ]
}

class Interrupt extends Error {
    constructor (messages, name, vargs) {
        if (vargs.length == 0) {
            super()
            Object.defineProperty(this, "name", {
                value: this.constructor.name,
                enumerable: false
            })
            return
        }
        const [
            message, causes, context, properties, callee
        ] = _vargs(messages, vargs, null)
        let dump = message
        const contexts = []
        const _causes = []
        const keys = Object.keys(context).length
        if (keys != 0 || causes.length) {
            dump += '\n'

            if (keys != 0) {
                dump += '\n' + stringify(context) + '\n'
            }

            for (let i = 0, I = causes.length; i < I; i++) {
                const cause = Array.isArray(causes[i]) ? causes[i] : [ causes[i] ]
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
                _causes.push(cause[0])
                // TODO Note that nullishness makes this useful and `||`
                // doesn't always do it.
                contexts.push(coalesce(cause[1]))
            }
        } else {
            dump += '\n'
        }

        dump += '\nstack:\n'
        super(dump)

        Object.defineProperty(this, "name", {
            value: this.constructor.name,
            enumerable: false
        })

        // FYI It is faster to use `Error.captureStackTrace` again than
        // it is to try to strip the stack frames created by `Error`
        // using a regular expression or string manipulation. You know
        // because you tried.

        if (callee != null) {
            Error.captureStackTrace(this, callee)
        }

        const assign = Object.assign({
            label: message, causes: _causes, contexts
        }, context, properties)
        for (const property in assign) {
            assert(property != 'name')
            Object.defineProperty(this, property, { value: assign[property] })
        }
    }

    static create (name, ...vargs) {
        const prefix = typeof vargs[0] == 'string' ? vargs.shift() : name.toUpperCase()
        const messages = vargs.length > 0 && typeof vargs[0] == 'object' ? vargs.shift() : {}
        const superclass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt
        assert(superclass == Interrupt || superclass.prototype instanceof Interrupt)
        const interrupt = class extends superclass {
            constructor (...vargs) {
                if (superclass == Interrupt) {
                    super(messages, name, vargs)
                } else {
                    super(...vargs)
                }
            }

            static assert (condition, ...vargs) {
                if (!condition) {
                    vargs.unshift(null)
                    vargs.push(interrupt.assert)
                    throw new (Function.prototype.bind.apply(interrupt, vargs))
                }
            }
        }
        Object.defineProperty(interrupt, "name", { value: name })
        return interrupt
    }
}

module.exports = Interrupt
