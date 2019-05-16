describe('interrupt', () => {
    const assert = require('assert')
    const Interrupt = require('..')
    const Test = { Error: Interrupt.create('Test.Error') }
    it('can set the constructor name', () => {
        assert.equal(Test.Error.name, 'Test.Error', 'name')
    })
    it('can create error with no constructor arguments', () => {
        try {
            throw new Test.Error
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error$/m.test(error.stack), 'stack header')
            assert.equal(error.message, '', 'message')
        }
    })
    it('can create a message-only error', () => {
        try {
            throw new Test.Error('message')
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
        }
    })
    it('can set context and properties', () => {
        try {
            throw new Test.Error('message', {
                context: 1
            }, {
                property: 1
            })
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert(/"context"/.test(error.stack), 'stack context')
            assert(!/"property"/.test(error.stack), 'no stack properties')
            assert.equal(error.context, 1, 'context set')
            assert.equal(error.property, 1, 'property set')
        }
    })
    it('can set a single cause', () => {
        try {
            throw new Test.Error('message', new Error('error'))
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert(!/"context"/.test(error.stack), 'no stack context')
            assert(!/"property"/.test(error.stack), 'no stack properties')
            assert.equal(error.causes[0].message, 'error', 'has a cause')
        }
    })
    it('can set a multiple causes', () => {
        try {
            throw new Test.Error('message', [ new Error('error'), new Error('thrown') ])
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert(!/"context"/.test(error.stack), 'no stack context')
            assert(!/"property"/.test(error.stack), 'no stack properties')
            assert.deepStrictEqual(error.causes.map(error => error.message), [
                'error', 'thrown'
            ], 'has many causes')
        }
    })
    it('can report a cause in context', () => {
        try {
            const error = new Error('unlikely message')
            error.code = 'ENOENT'
            throw new Test.Error('message', { error: error })
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert.equal(error.error.message, 'unlikely message', 'error context property')
            assert(/unlikely message/.test(error.stack), 'error serialized ')
            assert(/ENOENT/.test(error.stack), 'additional error property serialized ')
        }
    })
    it('can report a non-error in context', () => {
        try {
            throw new Test.Error('message', [ 'unlikely string' ])
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert.equal(error.causes[0], 'unlikely string', 'string error cause')
            assert(/unlikely string/.test(error.stack), 'string error serialized ')
        }
    })
    it('can report error specific context', () => {
        try {
            throw new Test.Error('message', [[ new Error('error'), { context: 'unlikely string' } ]])
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
            assert.deepStrictEqual(error.contexts, [{
                context: 'unlikely string'
            }], 'error context')
            assert(/unlikely string/.test(error.stack), 'error context serialized ')
        }
    })
    it('can assert', () => {
        Test.Error.assert(true, 'message')
    })
    it('can assert fail', () => {
        try {
            Test.Error.assert(false, 'message')
        } catch (error) {
            console.log(error.stack)
            assert(error instanceof Test.Error)
            assert(error instanceof Interrupt.Error)
            assert(error instanceof Error)
            assert(/^Test\.Error: message$/m.test(error.stack), 'stack header')
            assert(/^message$/m.test(error.message), 'message')
        }
    })
})
