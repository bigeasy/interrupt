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
// node --async-stack-traces test/readme.t.js
// ```
// Note that we are running with `--async-stack-traces` enabled and to enjoy all
// the features discussed in this readme you need to be running Node.js 14.
//
// The only way to see the elaborate stack trace output is to run this test at
// the command line, so please do so.
//
// Out unit test begins here

//
require('proof')(16, async okay => {
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

    // ## Class Member Errors
    //
    // When creating an error class using Interrupt, if you want to avoid name
    // collisions with the numerous errors that are already in the global
    // namespace, you can assign it as a static member to a class in your module
    // and give it a dot qualified name.
    //
    console.log('--- qualified Error class names ---\n')
    {
        function Syntax () {
        }

        Syntax.prototype.validate = function (string) {
            Syntax.Error.assert(string != null, 'SYNTAX_IS_NULL')
            return ~string.indexOf('hippopotomus')
        }

        Syntax.Error = Interrupt.create('Syntax.Error', {
            SYNTAX_IS_NULL: 'the syntax validation method received a null argument'
        })

        try {
            const syntax = new Syntax
            console.log(`Syntax is valid? ${syntax.validate(null)}`)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.name, 'Syntax.Error', 'name allowed to have dot qualifiers')
        }
    }
    //

    // These days I'm targeting Node.js 12 or greater, which has a `static`
    // keyword that makes declaration easier.

    //
    console.log('--- qualified Error class names in ES6 classes ---\n')
    {
        class Syntax {
            static Error = Interrupt.create('Syntax.Error', {
                SYNTAX_IS_NULL: 'the syntax validate method received a null argument'
            })

            validate (string) {
                Syntax.Error.assert(string != null, 'SYNTAX_IS_NULL')
                return ~string.indexOf('hippopotomus')
            }
        }

        try {
            const syntax = new Syntax
            console.log(`Syntax is valid? ${syntax.validate(null)}`)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.name, 'Syntax.Error', 'name allowed to have dot qualifiers in ES6 classes')
        }
    }
    //

    // Often times you invoke system functions that produce stubby contextless
    // errors like `EBADFD` stack trace at all. This is an [known issue in
    // Node.js](https://github.com/nodejs/node/issues/30944).

    //
    console.log('\n--- file system call with no stack information ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename) {
                    return await fs.readFile(filename)
            }
        }

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
        }
    }

    // If you see this error in your production error logs, how are you supposed
    // to know where in your code it orginates?

    // Well, you can wrap the file system call in an application exception.
    // That's what we're here for.

    //
    console.log('\n--- a try/catch block around a single file system call ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename) {
                try {
                    return await fs.readFile(filename)
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_READ_FILE', filename ], error)
                }
            }
        }

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_READ_FILE')
        }
    }
    //

    // However, now you have a catch block you need to unit test. I am fond of
    // unit test coverage and really don't trust uncovered catch blocks. I don't
    // want to start running untested code just when things are starting to go
    // sideways.

    // If you're doing work with the file system you're going to want to wrap a
    // lot of calls in this fashion, but you're going to generate a lot of these
    // catch blocks and then you have to figure out some way to generate errors.
    // This is particularly difficult with file handles, if you open, read and
    // close in a single function, you can test a failure to open by deleting
    // the file, but how do you test close?

    //
    console.log('\n--- a try/catch block for each of four file system calls ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_OPEN_FILE: 'unable to open file %s',
                UNABLE_TO_READ_FILE: 'unable to read file %s',
                UNABLE_TO_STAT_FILE: 'unable to stat file %s',
                UNABLE_TO_CLOSE_FILE: 'unable to close file %s'
            })

            async read (filename) {
                // _It is not difficult to test this catch block._
                let handle
                try {
                    handle = await fs.open(filename, 'r')
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_OPEN_FILE', filename ], error)
                }
                // _But how would you test this one? What sort of file
                // permission trickery do you have to set up in your unit test
                // to create a file you can open but you cannot stat? Do you
                // have to run your tests as root to to do it?_
                let stat
                try {
                    stat = await handle.stat()
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_STAT_FILE', filename ], error)
                }
                const buffer = Buffer.alloc(stat.size)
                // _How about a file you've been allowed to open for reading
                // that you're not actually allowed to read?_
                try {
                    await handle.read(buffer, 0, buffer.length, 0)
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_READ_FILE', filename ], error)
                }
                // _How about a file you've been allowed to open for reading
                // that you've stat'd and read that you're not allowed to
                // close?_
                try {
                    await handle.close()
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_CLOSE_FILE', filename ], error)
                }
                return buffer
            }
        }

        const reader = new Reader

        const source = await reader.read(__filename)
        okay(/hippopotomus/.test(source), 'found hippopotomus in source')

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_OPEN_FILE', 'detailed catch blocks')
        }
    }
    //

    // Of course, dear reader you're now screaming at your screen. Why not wrap
    // all four operations in a single catch block?

    //
    console.log('\n--- a monolithic try/catch block for four file system calls ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename) {
                try {
                    const handle = await fs.open(filename, 'r')
                    const stat = await handle.stat()
                    const buffer = Buffer.alloc(stat.size)
                    await handle.read(buffer, 0, buffer.length, 0)
                    await handle.close()
                    return buffer
                } catch (error) {
                    throw new Reader.Error([ 'UNABLE_TO_READ_FILE', filename ], error)
                }
            }
        }

        const reader = new Reader

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_READ_FILE', 'monolithic catch block')
        }

        const source = await reader.read(__filename)
        okay(/hippopotomus/.test(source), 'found hippopotomus in source')
    }
    //

    // Well, dear reader, yes, that's how exceptions are _supposed_ to work, and
    // in other languages like Java where stack traces are maintained you'd know
    // exactly which file system operation failed, but this is JavaScript. In
    // this simple example you'll know the error came from the try block and you
    // can determine which call failed from the error message thanks to the
    // context provided by the single catch block, but in a more complicated
    // try block you have to read through the code to try it, and in ever more
    // complicatd code there maybe mutliple opens, reads, stats, and closes to
    // chose from. If you're trying to match a single stack trace obtained from
    // one of a hundred machines in production with the file system function
    // call that generated it, a line number sure is nice.

    // And for that we have `Interrupt.resolve` which resolves a `Promise` and
    // wraps the exception if it rejects.

    // **TODO** Somewhere I should just write a blog post about my coding style,
    // not to bless the world with my genius (◔_◔) but to just point out that
    // the stuff I write is `async`/`await`, code coverage matters, whatever
    // else...

    //
    console.log('\n--- a monolithic try/catch block for four file system calls ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_OPEN_FILE: 'unable to open file %s',
                UNABLE_TO_READ_FILE: 'unable to read file %s',
                UNABLE_TO_STAT_FILE: 'unable to stat file %s',
                UNABLE_TO_CLOSE_FILE: 'unable to close file %s'
            })

            async read (filename) {
                const handle = await Reader.Error.resolve(fs.open(filename, 'r'), [ 'UNABLE_TO_OPEN_FILE', filename ])
                const stat = await Reader.Error.resolve(handle.stat(), [ 'UNABLE_TO_STAT_FILE', filename ])
                const buffer = Buffer.alloc(stat.size)
                await Reader.Error.resolve(handle.read(buffer, 0, buffer.length, 0), [ 'UNABLE_TO_READ_FILE', filename ])
                await Reader.Error.resolve(handle.close(), [ 'UNABLE_TO_CLOSE_FILE', filename ])
                return buffer
            }
        }

        const reader = new Reader

        const source = await reader.read(__filename)
        okay(/hippopotomus/.test(source), 'found hippopotomus in source')

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_OPEN_FILE', 'detailed catch blocks')
        }
    }
    //

    // Unfortunately, the above will only work on Node.js 14 and above and only
    // with `--async-stack-traces` enabled. In time `async` stack traces will be
    // the default and until then you have options.

    // This is however, rather verbose, so Interrupt provides a way to create a
    // resolver function you can use in a function to encapsulate common
    // properties.

    //
    {
        /* and that example would go here, and `sprintf` is decided */
    }
    //

    // Now we dance.

    //
    {
        const path = require('path')
        const fs = require('fs')

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_OPEN_FILE: 'unable to open file %s',
                UNABLE_TO_READ_FILE: 'unable to read file %s',
                UNABLE_TO_STAT_FILE: 'unable to stat file %s',
                UNABLE_TO_CLOSE_FILE: 'unable to close file %s'
            })

            async read (filename, callback) {
                fs.readFile(filename, (error, body) => {
                    if (error) {
                        callback(new Reader.Error([ 'UNABLE_TO_READ_FILE', filename ], error))
                    } else {
                        callback(null, body)
                    }
                })
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
        })
    }

    {
        const path = require('path')
        const fs = require('fs')

        function encase (message, callback) {
            return function (...vargs) {
                if (vargs[0] != null) {
                    callback(new Reader.Error(message, vargs[0]))
                } else {
                    callback.apply(null, vargs)
                }
            }
        }

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename, callback) {
                fs.readFile(filename, encase([ 'UNABLE_TO_READ_FILE', filename ], callback))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
        })
    }

    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        function encase (message, callback) {
            return function (...vargs) {
                function constructor (message) {
                    // **TODO** Document stack adjustment above all this.
                    return new Reader.Error(message, vargs[0], constructor)
                }
                if (vargs[0] != null) {
                    callback(message(constructor))
                } else {
                    callback.apply(null, vargs)
                }
            }
        }

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename, callback) {
                fs.readFile(filename, encase($ => $([ 'UNABLE_TO_READ_FILE', filename ]), callback))
            }
        }

        const reader = new Reader
        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })

    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %s'
            })

            async read (filename, callback) {
                fs.readFile(filename, Reader.Error.callback($ => $([ 'UNABLE_TO_READ_FILE', filename ]), callback))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
    return


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
