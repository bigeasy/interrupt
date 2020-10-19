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

// In JavaScript, Error defined as some arbitrary object with an `Error` type
// and a `message` property. It is, in itself, not very useful.

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
// The `superclass

//
const FooError = Interrupt.create('FooError', {
    'FOO_NOT_READY': 'not ready to process your request',
    'FOO_NOT_FOUND': 'unable to find a value for key; key %s'
})
//

// We've created created a `FooError` which is a decendent of `Interrupt`.
//
// **TODO** This doesn't actually work because we are not exporting `Interrupt`
// just an object constructor function. We should export `Interrupt` and tell
// the user not to call it directly.

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
