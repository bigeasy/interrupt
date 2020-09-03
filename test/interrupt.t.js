require('proof')(30, okay => {
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
            okay(error instanceof Interrupt.Error, 'is interrupt error')
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
            throw new Test.Error('message', {
                context: 1
            }, {
                property: 1
            })
        } catch (error) {
            console.log(error.stack)
            okay(/^Test\.Error: message$/m.test(error.stack), 'context stack header')
            okay(/^message$/m.test(error.message), 'context message')
            okay(/"context"/.test(error.stack), 'stack context')
            okay(!/"property"/.test(error.stack), 'no stack properties')
            okay(error.context, 1, 'context set')
            okay(error.property, 1, 'property set')
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
})
