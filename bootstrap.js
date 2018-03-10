var slice = [].slice
var util = require('util')

function vargs (vargs, callee) {
    var name = vargs.shift(), cause, context, options = {}
    if (vargs[0] instanceof Error) {
        console.log('foo!!!!')
        options.cause = vargs.shift()
        options.causes = [ options.cause ]
    } else if (Array.isArray(vargs[0])) {
        options.causes = vargs.shift()
        options.cause = options.causes[0]
    } else {
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

function interrupt (args, path, _Error) {
    var properties = args.options.properties || {}
    var keys = Object.keys(args.context).length
    var body = ''
    var dump = ''
    var cause = ''
    var qualifier = path + '#' + args.name
    if (keys != 0 || args.options.causes.length != 0) {
        body = '\n'
        if (keys != 0) {
            dump = '\n' + util.inspect(args.context, { depth: args.options.depth || Infinity }) + '\n'
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

    var message = qualifier + body + dump
    var error = new Error(message)
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
    error.interrupt = path + '#' + args.name
    // FYI It is faster to use `Error.captureStackTrace` than it is to try to
    // strip the stack frames using a regular expression or string manipulation.
    if (_Error.captureStackTrace) {
        _Error.captureStackTrace(error, args.callee)
    }
    return error
}

exports.createInterrupterCreator = function (_Error) {
    return function (path) {
        function ejector (name, cause, context, options) {
            return interrupt(vargs(slice.call(arguments), ejector), path, _Error)
        }
        ejector.assert = function (condition) {
            if (!condition) {
                throw interrupt(vargs(slice.call(arguments, 1), ejector.assert), path, _Error)
            }
        }
        return ejector
    }
}
