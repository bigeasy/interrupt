var util = require('util')

var coalesce = require('extant')

var JSON5 = require('json5')

function stringify (object) {
    return JSON5.stringify(object, function (key, value) {
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


exports.createInterrupterCreator = function (Error) {
    var captureStackTrace = typeof Error.captureStackTrace == 'function'
    function Interrupt (qualifier, label, context, properties, callee) {
        context || (context = { causes: [] })
        properties || (properties = {})
        var causes = context.causes
        var contexts = []
        if (!Array.isArray(causes)) {
            if (context.cause) {
                causes = [[ context.cause ]]
            } else {
                causes = []
            }
        }
        context.cause = (void(0))
        context.causes = (void(0))
        var keys = Object.keys(context).length - 2
        var body = ''
        var dump = ''
        var cause = ''
        var qualified = qualifier + '#' + label
        var _causes = []
        if (keys != 0 || causes.length) {
            body = '\n'
            if (keys != 0) {
                dump = '\n' + stringify(context) + '\n'
            }

            for (var i = 0, I = causes.length; i < I; i++) {
                var cause = causes[i].slice()
                var cText = (cause[0] instanceof Error) ? coalesce(cause[0].stack, cause[0].message) : cause[0].toString()
                cText = cText.replace(/^/gm, '    ')
                if (cause[1] == null) {
                    dump += '\ncause:\n\n' + cText + '\n'
                } else {
                    var contextualized = stringify(cause[1]).replace(/^/gm, '    ')
                    dump += '\ncause:\n\n' + contextualized + '\n\n' + cText + '\n'
                }
                _causes.push(cause[0])
                // TODO Note that nullishness makes this useful and `||`
                // doesn't always do it.
                contexts.push(coalesce(cause[1]))
            }
        } else {
            dump += '\n'
        }

        if (captureStackTrace) {
            dump += '\nstack:\n'
            Error.captureStackTrace(this, coalesce(callee, Interrupt))
        }

        this.message = qualified + body + dump
        this.name = 'Interrupt'

        // FYI It is faster to use `Error.captureStackTrace` again than it is to
        // try to strip the stack frames created by `Error` using a regular
        // expression or string manipulation.
        // captureStackTrace(this, coalesce(callee, Interrupt))

        for (var key in context) {
            this[key] = context[key]
        }

        for (var key in properties) {
            this[key] = properties[key]
        }

        this.causes = _causes
        this.contexts = contexts

        this.qualifier = qualifier
        this.qualified = qualified
        this.label = label
    }
    util.inherits(Interrupt, Error)
    return function (qualifier) {
        var Qualified = Interrupt.bind(null, qualifier)
        Qualified.assert = function (condition, label, context, properties, callee) {
            if (!condition) {
                throw new Interrupt(qualifier, label, condition, properties, coalesce(callee, Qualified.assert))
            }
        }
        return Qualified
    }
}
