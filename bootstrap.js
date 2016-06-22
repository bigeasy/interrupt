var slice = [].slice
var util = require('util')

exports.createInterrupterCreator = function (_Error) {
    return function (path) {
        var ejector = function (options) {
            var name = options.name
            var context = options.context || {}
            var properties = options.properties || {}
            var callee = options.callee || ejector
            var vargs = slice.call(arguments)
            var depth = options.depth || null
            var keys = Object.keys(context).length
            var body = ''
            var dump = ''
            var stack = ''
            if (keys != 0 || options.cause) {
                body = '\n'
                if (keys != 0) {
                    dump = '\n' + util.inspect(context, { depth: depth }) + '\n'
                }
                if (options.cause != null) {
                    dump += '\ncause: ' + options.cause.stack + '\n\nstack:'
                }
            }
            var message = path + '#' + name + body + dump
            var error = new Error(message)
            for (var key in context) {
                error[key] = context[key]
            }
            for (var key in properties) {
                error[key] = properties[key]
            }
            if (options.cause) {
                error.cause = options.cause
            }
            error.interrupt = path + '#' + name
            if (_Error.captureStackTrace) {
                _Error.captureStackTrace(error, options.callee || ejector)
            }
            return error
        }
        var assert = ejector.assert = function (condition, options) {
            if (!condition) {
                var copy = {}
                for (var key in options) {
                    copy[key] = options[key]
                }
                copy.callee = assert
                throw ejector(options)
            }
        }
        return ejector
    }
}
