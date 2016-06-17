require('proof')(1, prove)

function prove () {
    var interrupt = require('../redux').createInterrupter('bigeasy.example')
    try {
        try {
            throw new Error('foo')
        } catch (e) {
            throw interrupt('bar', {
                url: 'http://127.0.0.1:8080/foo',
                statusCode: 404,
                headers: {
                    sent: {
                        'content-type': 'text/plain',
                        'content-length': '10'
                    },
                    received: {
                        'content-type': 'text/plain',
                        'content-length': '10'
                    }
                },
                cause: e
            })
        }
    } catch (e) {
        console.log(e.stack)
    }

    function nested () {
        try {
            try {
                throw new Error('foo')
            } catch (e) {
                throw interrupt('bar', {
                    url: 'http://127.0.0.1:8080/foo',
                    statusCode: 404,
                    headers: {
                        sent: {
                            'content-type': 'text/plain',
                            'content-length': '10'
                        },
                        received: {
                            'content-type': 'text/plain',
                            'content-length': '10'
                        }
                    },
                    cause: e
                })
            }
        } catch (x) {
            console.log(x.stack)
        }
    }

    nested()
}
