// # Interrupt

// Exceptions are useful. I like the concept. I've always been able to program
// try/catch in Node.js regardless of whether a function is synchronous or
// asynchronous because I've always programmed with `cadence` which has a nice
// implementation of asynchronous `try`/`catch`.

// Interrupt as an `Error` generator allows me to gather up errors from many
// different waiting asynchronous calls and report them in a bouquet of failures
// on the command line and in my server logs. Interrupt supports nested
// exceptions, context for exceptions and complete error reports on fatal error
// exit.

// It does this using the `stack` property which is specific to Node.js and
// Interrupt is therefore Node.js specific. If there is interest in using
// Interrupt outside of Node.js, let me know where and I'll have a look at what
// it would take to adapt it to a new JavaScript environment.

// Interrupt generates elaborate stack trace messages that include formatted
// messages, contextual data and the stack traces of nested exceptions. You can
// view examples of these stack traces by running this program.
//
// ```
// node readme
// ```

// In JavaScript, Error defined as some arbitrary object with an `Error` type
// and a `message` property. It is, in itself, not very useful. Node.js makes it
// more informative by adding a stack trace. With the stack trace you get an
// idea of where in your code the exception occurred.

// Not always though, because sometimes the errors occur in the Node.js event
// loop while handling sockets and files.

// To use Interrupt install it from NPM using the following.
//
// ```
// npm install interrupt
// ```
//
// Then you can begin to use it in your code as follows.

//
const Interrupt = require('.')
//

// We'll use `assert` to illustrate some of our points in this document.

//
const assert = require('assert')
//

// Now that you have `Interrupt` in your code you can define an Error class to
// use in your application with `Interrupt.create()`.
//
// `Interrupt.create(className, [ superclass ], [ prefix ], [ messages ])`
// &mdash; creates a new error class derrived from Interrupt.
//
//  * `className` &mdash; The class name of the new error class.
//  * `superclass` &mdash; Optional superclass from which the new class is
//  derrived. The given superclass **must** be a descendent of `Interrupt`. If
//  not provided the superclass will be derived from `Interrupt` directly.
//  * `messages` &mdash; Optional map of error codes for `util.format()` error
//  messages.
//
// **TODO** Maybe use `sprintf` and then we can use named arguments from the
// context.

//
const FooError = Interrupt.create('FooError', {
    'FOO_NOT_READY': 'not ready to process your request',
    'FOO_INVALID_ARGMUMENT': 'invalid argument value',
    'FOO_NOT_FOUND': 'unable to find a value for key; key %s'
})
//

// We've created created a `FooError` which is a decendent of `Interrupt`.

//
assert(FooError.prototype instanceof Interrupt)
//
// The generated `FooError` class has a `messages` property that will list the
// messages by error code.

//
console.log('--- FooError codes and messages ---\n')

for (const code in FooError.messages) {
    console.log('%s => %s', code, FooError.messages[code])
}

{
    function parse (string) {
        try {
            return JSON.parse(string)
        } catch (error) {
            throw new FooError('FOO_NOT_READY', error)
        }
    }
    try {
        parse('[')
    } catch (error) {
        console.log(error.stack)
    }
}

//
// Now we can raise exceptions of type `FooError`.

//
console.log('\n--- Throw a FooError ---\n')

try {
    throw new FooError('FOO_NOT_READY')
} catch (error) {
    assert(error.code == 'FOO_NOT_READY')
    console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

    console.log(error.stack)
}

//
// There is also a basic assert function you can use, one that tests a single
// value for truthiness. We do not provide the full compliment of assertion
// helpers from the Node.js `assert` module, just basic `assert`. If you want to
// compare something just use an operator.

//
try {
    // A silly comparison.
    FooError.assert(FooError === 1, 'FOO_INVALID_ARGMUMENT')
} catch (error) {
    assert(error.code == 'FOO_INVALID_ARGMUMENT')
    console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

    console.log(error.stack)
}

//
// We can add context to our exceptions by calling the contructor with an object
// that contains JSON serializable context properties.

//
try {
    // Some silly context values.
    throw new FooError('FOO_INVALID_ARGMUMENT', { name: 'value', count: 3 })
} catch (error) {
    assert(error.code == 'FOO_INVALID_ARGMUMENT')
    console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

    console.log(error.stack)
}

//
// Context values also work with `assert`.

//
try {
    // Silly things combined.
    FooError.asert(FooError == 1, 'FOO_INVALID_ARGMUMENT', { name: 'value', count: 3 })
} catch (error) {
    assert(error.code == 'FOO_INVALID_ARGMUMENT')
    console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

    console.log(error.stack)
}

//
// **TODO** Maybe start with nested e

return
(async function () {
    console.log('CALLLED')
    async function open (file, flag, encoding) {
        try {
            return await fs.readFile(file, { flag, encoding })
        } catch (error) {
            throw new FooError('FOO_FILE_IO', error)
        }
    }
    try {
        await open('foo.txt', 'r', 'utf8')
    } catch (error) {
        assert(error.code == 'FOO_FILE_IO')
        console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)
        console.log(error.stack)
    }
}) ()
