const coalesce = require('extant')

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

function _vargs (vargs, callee) {
    return [
        vargs.shift(),
        _causes(vargs),
        coalesce(vargs.shift(), {}),
        coalesce(vargs.shift(), {}),
        coalesce(callee, vargs.shift())
    ]
}

class Interrupt extends Error {}

exports.create = function (name) {
    const interrupt = class extends Interrupt {
        constructor (...vargs) {
            if (vargs.length == 0) {
                super()
                this.name = name
                return
            }
            const [
                message, causes, context, properties, callee
            ] = _vargs(vargs, null)
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
            this.label = message

            // FYI It is faster to use `Error.captureStackTrace` again than
            // it is to try to strip the stack frames created by `Error`
            // using a regular expression or string manipulation. You know
            // because you tried.

            if (callee != null) {
                Error.captureStackTrace(this, callee)
            }

            this.name = name

            Object.assign(this, context, properties)

            this.causes = _causes
            this.contexts = contexts
        }

        static assert (condition, ...vargs) {
            if (!condition) {
                const bound = [ null ]
                bound.push.apply(bound, _vargs(vargs, interrupt.assert))
                throw new (Function.prototype.bind.apply(interrupt, bound))
            }
        }
    }
    Object.defineProperty(interrupt, "name", { value: name })
    return interrupt
}

exports.Error = Interrupt
