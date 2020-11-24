require('proof')(29, okay => {
    const Interrupt = require('..')
    const Test = { Error: Interrupt.create('Test.Error') }
    {
        okay(Test.Error.name, 'Test.Error', 'constructor name')
    }
    {
        try {
            throw new Test.Error
        } catch (error) {
            console.log(error.stack)
            okay(error.name, 'Test.Error', 'error name')
            okay(error instanceof Test.Error, 'is derived error')
            okay(error instanceof Interrupt, 'is interrupt error')
            okay(error instanceof Error, 'is error')
            okay(/^Test\.Error$/m.test(error.stack), 'no message stack header')
            okay(error.message, '', 'no message')
        }
    }
    {
        try {
            throw new Test.Error('message')
        } catch (error) {
            console.log(error.stack)
            okay(/^Test\.Error: message$/m.test(error.stack), 'message only stack header')
            okay(/^message$/m.test(error.message), 'message only message')
        }
    }
    {
        try {
            throw new Test.Error('message', new Error('error'))
        } catch (error) {
            console.log(error.stack)
            okay(error.causes[0].message, 'error', 'has a cause')
        }
    }
    {
        try {
            throw new Test.Error('message', [ new Error('error'), new Error('thrown') ])
        } catch (error) {
            console.log(error.stack)
            okay(error.causes.map(error => error.message), [
                'error', 'thrown'
            ], 'has many causes')
        }
    }
    {
        try {
            const error = new Error('unlikely message')
            error.code = 'ENOENT'
            throw new Test.Error('message', { error: error })
        } catch (error) {
            console.log(error.stack)
            okay(error.error.message, 'unlikely message', 'context error property')
            okay(/unlikely message/.test(error.stack), 'context error serialized ')
            okay(/ENOENT/.test(error.stack), 'additional error property serialized ')
        }
    }
    {
        try {
            throw new Test.Error('message', [ 'unlikely string' ])
        } catch (error) {
            console.log(error.stack)
            okay(error.causes[0], 'unlikely string', 'string error cause')
            okay(/unlikely string/.test(error.stack), 'string error serialized ')
        }
    }
    {
        try {
            throw new Test.Error('message', [[ new Error('error'), { context: 'unlikely string' } ]])
        } catch (error) {
            console.log(error.stack)
            okay(error.contexts, [{
                context: 'unlikely string'
            }], 'error context')
            okay(/unlikely string/.test(error.stack), 'error context serialized ')
        }
    }
    {
        Test.Error.assert(true, 'message')
    }
    {
        try {
            Test.Error.assert(false, 'message')
        } catch (error) {
            console.log(error.stack)
            okay(/^Test\.Error: message$/m.test(error.stack), 'assert stack header')
            okay(/^message$/m.test(error.message), 'assert message')
        }
    }
    {
        Test.SubError = Interrupt.create('Test.SubError', Test.Error)
        try {
            throw new Test.SubError('message')
        } catch (error) {
            console.log(error.stack)
            okay(error instanceof Test.SubError, 'is new class')
            okay(error instanceof Test.Error, 'is subclass')
            okay(error.name, 'Test.SubError', 'has correct name')
        }
    }
    {
        const test = []
        try {
            Interrupt.create('Test.BadError', Error)
        } catch (error) {
            test.push(error.name)
        }
        okay(test, [ 'AssertionError' ], 'incorrect superclass type')
    }
    {
        try {
            throw new Test.Error('formatted %(yes)s', { yes: 'yes' })
        } catch (error) {
            okay(/^formatted yes$/m.test(error.message), 'format message')
        }
    }
    {
        const Test = {
            Coded: Interrupt.create('Test.Coded', {
                unformatted: 'unformatted message',
                formatted: 'formatted message %(yes)s'
            })
        }
        try {
            throw new Test.Coded('unformatted')
        } catch (error) {
            okay(/^unformatted message$/m.test(error.message), 'unformatted message')
            okay(error.code, 'unformatted', 'unformatted message code')
            console.log(error.stack)
        }
        try {
            throw new Test.Coded('formatted', { yes: 'yes' })
        } catch (error) {
            okay(/^formatted message yes$/m.test(error.message), 'formatted message')
            okay(error.code, 'formatted', 'formatted message code')
            console.log(error.stack)
        }
    }
    {
        const Test = {
            Error: Interrupt.create('Test.Error', {
                one: 'one',
                two: 'two',
                root: 'root'
            })
        }
        const hello = new Error('hello')
        const world = new Error('world')
        const one = new Test.Error('one', [ hello, hello, hello ], { id: 1, x: 4 })
        const two = new Test.Error('one', [ world, world ], { id: 1, x: 5 })
        const three = new Test.Error('one', [ hello, world ], { id: 1, x: 6 })
        const four = new Test.Error('two', [ hello, world ], { id: 1, x: 7 })
        const interrupt = new Test.Error('three')
        const error = new Test.Error('root', [
            one, one, two, two, three, four, new Test.Error,
            interrupt, interrupt,
            new Test.Error('no context', new Error), 1
        ], { id: 2, x: 8 })
        console.log(error.stack)
        console.log(Interrupt.dedup(error))
        console.log(Interrupt.dedup(error, error => {
            return [ error.name, error.code || error.message, error.id || null ]
        }))
        console.log(Interrupt.dedup(new Error))
    }
})
