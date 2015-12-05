var Supersede = require('supersede')
var assert = require('assert')
var slice = [].slice
var typeIdentifiers = {}

function rescue (error) {
    var vargs = slice.call(arguments)
    return function (error) {
        if (!(error.path && error.typeIdentifier && typeIdentifiers[error.path] == error.typeIdentifier)) {
            throw error
        }
        var cases = [], when, arg
        var map = new Supersede, state = 'begin'
        while (arg = vargs.shift()) {
            if (Array.isArray(arg)) {
                vargs.unshift.apply(vargs, arg)
            } else {
                switch (state) {
                case 'begin':
                    assert.ok(typeof arg == 'string')
                    when = { path: ('.' + arg).split('.') }
                    state = 'when'
                    break
                case 'when':
                    if (arg instanceof RegExp) {
                        when.regex = arg
                        state = 'regex'
                        break
                    } else {
                        when.regex = /^/
                    }
                case 'regex':
                    assert.ok(typeof arg == 'function')
                    when.f = arg
                    cases.push(when)
                    state = 'begin'
                    break
                }
            }
        }
        for (var i = 0, I = cases.length; i < I; i++) {
            when = cases[i]
            map.set(when.path, when)
        }
        var path = ('.' + error.path + '.' + error.message).split('.')
        var when = map.get(path)
        if (when == null || !when.regex.test(error.errno || error.message)) {
            throw error
        }
        return when.f(error)
    }
}

exports.rescue = rescue
exports.createInterrupter = function (path) {
    var typeIdentifier = typeIdentifiers[path] = {}
    function interrupt (error) {
        // see: http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
        var vargs = slice.call(arguments, 1)
        error.path = path
        error.typeIdentifier = typeIdentifier
        vargs.forEach(function (values) {
            for (var key in values) {
                error[key] = values[key]
            }
        })
        return error
    }
    interrupt.rescue = rescue
    return interrupt
}
