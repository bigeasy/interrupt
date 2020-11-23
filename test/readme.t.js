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

// Interrupt generates elaborate stack trace messages that include formatted
// messages, contextual data and the stack traces of nested exceptions. You can
// view examples of these stack traces by running this program.

// It does this using the `stack` property which is specific to Node.js and
// Interrupt is therefore Node.js specific. If there is interest in using
// Interrupt outside of Node.js, let me know where and I'll have a look at what
// it would take to adapt it to a new JavaScript environment.

// ```
// node readme
// ```

// In JavaScript, Error defined as some arbitrary object with an `Error` type
// and a `message` property. It is, in itself, not very useful. Node.js makes it
// more informative by adding a stack trace. With the stack trace you get an
// idea of where in your code the exception occurred.

// Not always though, because sometimes the errors occur in the Node.js event
// loop while handling sockets and files. To help out when strack traces are
// short and stubby, Interrupt lets you add formatted messages and context
// information, usually with a simple one liner.

// This readme document is a unit test from the Interrupt source code. It uses
// the [Proof](https://github.com/bigeasy/proof) unit test framework. We'll be
// using its `okay` method to assert points we make about `Interrupt`.

// Please run this test yourself.
//
// ```text
// git clone git@github.com:bigeasy/interrupt.git
// cd interrupt
// npm install --no-package-lock --no-save
// node test/readme.t.js
// ```
//
// The only way to see the elaborate stack trace output is to run this test at
// the command line, so please do so.
//
// Out unit test begins here

//
require('proof')(11, okay => {
    // To use Interrupt install it from NPM using the following.
    //
    // ```
    // npm install interrupt
    // ```
    //
    // Then you can begin to use it in your code as follows.
    //
    // ```
    // const Interrupt = require('interrupt')
    // ```
    //
    // But here, because we're in our project directory, we include the root
    // project.

    //
    const Interrupt = require('..')
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
        FOO_NOT_READY: 'not ready to process your request',
        FOO_INVALID_JSON: 'unable to parse JSON string',
        FOO_INVALID_ARGMUMENT: 'invalid argument value',
        FOO_NOT_FOUND: 'unable to find a value for key; key %s'
    })
    //

    // We've created created a `FooError` which is a decendent of `Interrupt`.

    //
    okay(FooError.prototype instanceof Interrupt, 'Interrupt class created')

    // The generated `FooError` class has a `messages` property that will list
    // the messages by error code.

    //
    console.log('--- generated Interrupt codes and messages ---')
    for (const code in FooError.messages) {
        console.log('%s => %s', code, FooError.messages[code])
    }

    //

    // We'll jump right in and show you the basic features with a quick example.
    // You're really going to want to run this from the command line to see the
    // stack trace output.

    //
    console.log('--- throwing an Interrupt derived Error ---')
    {
        // _A parse function that can raise an exception. We catch the JSON
        // expection and wrap it an exception that provides more context._
        function parse (string) {
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new FooError('FOO_INVALID_JSON', error, { string })
            }
        }
        try {
            // _Parse some garbage._
            parse('!#@%')
        } catch (error) {
            // _Here is all the information gathered in the `Interrupt`._
            okay(error instanceof Interrupt, 'error is an Interrupt')
            okay(error instanceof Error, 'an Interrupt is an Error')
            okay(error.code, 'FOO_INVALID_JSON', 'the code is key into the message map')
            okay(error.string, '!#@%', 'contextual property set')
            okay(error.causes.length, 1, 'we have nested causes')
            okay(error.causes[0] instanceof SyntaxError, 'the nested cause is a JSON error')
            // _You can see the stack trace from the command line._
            console.log(error.stack)
        }
    }
    //

    //

    // **TODO**: No more catching by type claims. Point people at `rescue` for
    // that, since that is where that happens.
    //
    // Here is a real to do list for the documentation.
    //
    //  * Formatted messages. (Really do want to use sprintf.)
    //  * Object properties.
    //  * Unserialized properties (just set them.)
    //  * Named parameters.

    //
    {
    }

    //

    //
    // **TODO** What follows is from a first swipe. Much better to introduce the
    // basics in the first example as was done above. The following was before
    // convertion to a unit test.
    //
    // Now we can raise exceptions of type `FooError`.

    //
    console.log('\n--- throw a FooError ---\n')
    try {
        throw new FooError('FOO_NOT_READY')
    } catch (error) {
        okay(error.code == 'FOO_NOT_READY', 'not ready')
        console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

        console.log(error.stack)
    }

    //
    // There is also a basic assert function you can use, one that tests a
    // single value for truthiness. We do not provide the full compliment of
    // assertion helpers from the Node.js `assert` module, just basic `assert`.
    // If you want to compare something just use an operator.

    //
    try {
        // A silly comparison.
        FooError.assert(FooError === 1, 'FOO_INVALID_ARGMUMENT')
    } catch (error) {
        okay(error.code, 'FOO_INVALID_ARGMUMENT', 'invalid argument')
        console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

        console.log(error.stack)
    }

    //
    // We can add context to our exceptions by calling the contructor with an object
    // that contains JSON serializable context properties.

    //
    try {
        // Some silly context values.
        throw new FooError('FOO_INVALID_ARGMUMENT', { arg: 'value', count: 3 })
    } catch (error) {
        okay(error.code, 'FOO_INVALID_ARGMUMENT', 'invalid argument')
        console.log('Caught error of type %s with code %s. Stack trace follows.\n', error.name, error.code)

        console.log(error.stack)
    }

    //
    // Context values also work with `assert`.

    //
    try {
        // Silly things combined.
        FooError.assert(FooError == 1, 'FOO_INVALID_ARGMUMENT', { arg: 'value', count: 3 })
    } catch (error) {
        okay(error.code == 'FOO_INVALID_ARGMUMENT', 'invalid')
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
})
