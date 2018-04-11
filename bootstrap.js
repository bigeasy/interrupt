var slice = [].slice
var util = require('util')
var JSON5 = require('json5')

function Interrupt (message, Error, callee) {
    this.message = message
    // FYI It is faster to use `Error.captureStackTrace` than it is to try to
    // strip the stack frames using a regular expression or string manipulation.
    Error.captureStackTrace(this, callee)
}
util.inherits(Interrupt, Error)

function vargs (vargs, callee) {
    var name = vargs.shift(), cause, context, options = {}
    if (vargs[0] instanceof Error) {
        options.cause = vargs.shift()
        options.causes = [ options.cause ]
    } else if (Array.isArray(vargs[0])) {
        options.causes = vargs.shift()
        options.cause = options.causes[0]
    } else {
        if (vargs[0] == null) {
            vargs.shift()
        }
        options.causes = []
    }
    context = vargs.shift() || {}
    for (var key in vargs[0]) {
        options[key] = vargs[0][key]
    }
    return {
        name: name,
        context: context,
        options: options,
        callee: options.callee || callee
    }
}

function interrupt (args, qualifier, _Error) {
    var properties = args.options.properties || {}
    var keys = Object.keys(args.context).length
    var body = ''
    var dump = ''
    var cause = ''
    var qualified = qualifier + '#' + args.name
    if (keys != 0 || args.options.causes.length != 0) {
        body = '\n'
        if (keys != 0) {
            dump = '\n' + JSON5.stringify(args.context, function (key, value) {
                if (value instanceof Error) {
                    var object = { message: value.message, stack: value.stack }
                    for (var key in value) {
                        object[key] = value[key]
                    }
                    return object
                }
                return value
            }, 4) + '\n'
        }

        for (var i = 0, I = args.options.causes.length; i < I; i++) {
            var cause = args.options.causes[i]
            cause = (cause instanceof Error) ? cause.stack : cause.toString()
            cause = cause.replace(/^/gm, '    ')
            dump += '\ncause:\n\n' + cause + '\n'
        }
    } else {
        dump += '\n'
    }

    dump += '\nstack:\n'

    var message = qualified + body + dump
    var error = new Interrupt(message, _Error, args.callee)
    for (var key in args.context) {
        error[key] = args.context[key]
    }
    for (var key in args.options.properties) {
        error[key] = args.options.properties[key]
    }
    error.causes = args.options.causes
    if (args.options.cause) {
        error.cause = args.options.cause
    }
    error.qualifier = qualifier
    error.qualified = qualified
    error.name = args.name
    return error
}

exports.createInterrupterCreator = function (Error) {
    if (typeof Error.captureStackTrace != 'function') {
        Error = { captureStackTrace: function () {} }
    }
    return function (qualifier) {
        function ejector (name, cause, context, options) {
            return interrupt(vargs(slice.call(arguments), ejector), qualifier, Error)
        }
        ejector.assert = function (condition) {
            if (!condition) {
                throw interrupt(vargs(slice.call(arguments, 1), ejector.assert), qualifier, Error)
            }
        }
        return ejector
    }
}
