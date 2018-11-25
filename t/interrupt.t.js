require('proof')(15, prove)

function prove (okay) {
    var Interrupt = require('..').createInterrupter('bigeasy.example')
    try {
        var error = new Error('x')
        error.code = 'ENOENT'
        throw new Interrupt('bar', {
            url: 'http://127.0.0.1:8080/foo',
            statusCode: 404,
            error: error, // Test JSON5 serialization of error ojbects.
            headers: {
                sent: {
                    'content-type': 'text/plain',
                    'content-length': '10'
                },
                received: {
                    'content-type': 'text/plain',
                    'content-length': '10'
                }
            }
        }, {
            value: 1
        })
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#bar$/m.test(e.message), 'message')
        okay(e.qualified, 'bigeasy.example#bar', 'interrupt')
        okay(e.statusCode, 404, 'context set')
        okay(e.value, 1, 'properties set')
    }
    try {
        try {
            throw new Error('foo')
        } catch (e) {
            throw new Interrupt('bar', { cause: e })
        }
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#bar$/m.test(e.message), 'no context')
        okay(e.causes[0].message, 'foo', 'cause')
        // TODO Assert cause.
    }
    try {
        try {
            throw new Error('foo')
        } catch (foo) {
            try {
                try {
                    throw new Error('bar')
                } catch (bar) {
                    throw new Interrupt('baz', { cause: bar, value: 2 })
                }
            } catch (baz) {
                console.log(baz.stack)
                throw new Interrupt('quux', { causes: [[ foo ], [ baz, { value: 1 } ], [ 1 ]] })
            }
        }
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#quux$/m.test(e.message), 'nested mulitple causes')
        okay(e.contexts[1].value, 1, 'cause context')
        okay(e.causes[1].causes[0].message, 'bar', 'nested')
        okay(e.causes[2], 1, 'nested and not an `Error`')
        // TODO Assert cause.
    }
    try {
        throw new Interrupt('bar', { depth: 2, key: 'value' })
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#bar$/m.test(e.message), 'no cause')
    }
    try {
        throw new Interrupt('bar')
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#bar$/m.test(e.message), 'nothing but message')
    }

    Interrupt.assert(true, 'assert')
    try {
        Interrupt.assert(false, 'assert')
    } catch (e) {
        console.log(e.stack)
        okay(/^bigeasy.example#assert$/m.test(e.message), 'assert failed')
    }

    Interrupt = require('../bootstrap').createInterrupterCreator(function () {})('bigeasy.example')

    try {
        throw new Interrupt('foo', { causes: [[ new Interrupt('bar', { value: 1 } ), { value: 1 } ]] })
    } catch (e) {
        console.log(e.message)
        okay(e.stack == null, 'no capture stack trace')
        okay(/^bigeasy.example#foo$/m.test(e.message), 'no captureStackTrace')
    }
}
