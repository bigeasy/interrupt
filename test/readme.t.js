// # Interrupt

// Exceptions are nice. I like the concept. I've always done my best to employ
// them in JavaScript and Node.js but it isn't always easy.

// Interrupt is a module I created to address the problems with JavaScript's
// limited exception mechansim, solving the numerous problems I've encountered
// that I'm sure you've encountered as well. It is not an elegant solution, but
// it is a solution none the less.

// ## Adovcacy

// Interrupt allows you to get exceptions that have a file name and line number
// from your program, instead of an exception stubby stack trace that points to
// the wilderness of the Node.js source, or no stack trace at all. It does this
// with some struggle, but without the expensive superfluous stack trace
// generation of the long stack trace modules.

// Interrupt allows you to nest exceptions so you can provide application
// context to system and library exceptions.

// Interrupt allows you to cite multiple nested exceptions as the cause of your
// contextual exception which is necessary if you're doing any sort of parallel
// asynchronous programming where multiple parallel paths can raise excpetions.

// Interrupt uses and abuses the `Error.stack` property to geneate an elaborate
// report including the type, message, context properties and stack trace of the
// error and all of the nested errors with their stack traces.

// Interrupt's elaborate `Error.stack` is machine readable so you could
// conceivably process these stack traces programmatically when you've gathered
// them up in the logs.

// Interrupt can report it's elaborate stack trace de-duped with a count of
// similar exceptions so that is a great many parallel operations raise the same
// exception you don't have wade through the repetitive stack traces to see if
// there is anything unique about one of them.

// Interrupt endeavours to do all this with a minimum of extra code and code
// paths so you can format exception messages with `sprintf-js`, set context
// properties, specify nested expressions and prune the stack trace all with the
// constructor, posssibly as a one-liner.

// ## The Basic Problem

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
//
// The only way to see the elaborate stack trace output is to run this test at
// the command line, so please do so.
// ```
// Interrupt itself is targeted for Node.js 12 or greater. Note that we are
// running with `--async-stack-traces` enabled and to enjoy all the features
// discussed in this readme you need to be running Node.js 14.
//
// Out unit test begins here.

//
require('proof')(23, async okay => {
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
    // `Interrupt.create(className[, superclass ][, messages ])`
    //
    // Creates a new error class derrived from Interrupt.
    //
    //  * `className` &mdash; The class name of the new error class.
    //  * `superclass` &mdash; Optional superclass from which the new class is
    //  derrived. The given class **must** be a descendent of `Interrupt`. If
    //  not provided the superclass will be derived from `Interrupt` directly.
    //  * `messages` &mdash; Optional map of error codes for `util.format()` error
    //  messages.

    //
    const ParseError = Interrupt.create('FooError', {
        INVALID_JSON: 'unable to parse JSON string',
        NULL_ARGMUMENT: 'the %(arg)s argument must not be null',
        WRONG_TYPE: 'the argument must be a string, got %(type)s'
    })
    //

    // We've created created a `ParseError` which is a decendent of `Interrupt`.

    //
    okay(ParseError.prototype instanceof Interrupt, 'Interrupt class created')
    //

    // `Interrupt` is the base class of all `Interrupt` exceptions, but it is
    // not meant to be used directly. You must define a derived class using the
    // `Interrupt.create()` method. An attempt to create a `new Interrupt()`
    // will raise an exception. This will be a plain `Error` and not an
    // `Interrupt` derived exception.

    //
    console.log('\n--- exception raised when calling `new Interrupt()` directly ---\n')
    {
        try {
            new Interrupt()
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'ERR_ASSERTION', 'do not call Interrupt constructor rerectly')
        }
    }
    //

    // The generated `ParseError` class has a `messages` property that will list
    // the messages by error code.

    //
    console.log('\n--- generated error codes and message formats ---\n')
    for (const code in ParseError.messages) {
        console.log('%s => %s', code, ParseError.messages[code])
    }
    console.log('')
    //

    // We'll jump right in and show you the basic features with a quick example.
    // You're really going to want to run this from the command line to see the
    // stack trace output.

    //
    console.log('\n--- throwing an Interrupt derived Error ---\n')
    {
        // _A parse function that can raise an exception. We catch the JSON
        // expection and wrap it an exception that provides more context._
        function parse (string) {
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('INVALID_JSON', error, { string })
            }
        }
        try {
            // _Parse some garbage._
            parse('!#@%')
        } catch (error) {
            // _You can see the stack trace from the command line._
            console.log(error.stack)
            console.log('')
            // _Here is all the information gathered in the `Interrupt`._
            okay(error instanceof Interrupt, 'error is an Interrupt')
            okay(error instanceof Error, 'an Interrupt is an Error')
            okay(error.code, 'INVALID_JSON', 'the code is key into the message map')
            okay(error.string, '!#@%', 'contextual property set')
            okay(error.errors.length, 1, 'we have nested errors')
            okay(error.errors[0] instanceof SyntaxError, 'the nested cause is a JSON error')
        }
    }
    //


    // We'll get started from some examples using `JSON.parse` which throws a
    // `SyntaxError` exception when the JSON cannot be parsed.

    // All of the examples in this code are _contrived_, however, and in
    // practice, I'm never this zealous with my use of Interrupt. I wouldn't
    // bother to wrap `SyntaxError`.

    // ## Errors by Code

    // Interrupt encourages you to create a set of error codes for your module.
    // I do this in lieu of creating an elaborate exception heirarchy preferring
    // the Node.js method of setting a `code` property on the `Error` instance.

    // We need to use a code because Interrupt hijacks the `message`, adding
    // context and nested error stack traces so that they will appear in
    // `error.stack`.

    // That's bad, I know, but codes are nice because they are easier to use in
    // programming. Using codes to determine error type allows you to change the
    // wording of a message without breaking any code that tests the message to
    // determine the error type.

    //
    console.log('\n--- message from error code ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        function parse (string) {
            if (string == null) {
                throw new ParseError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('INVALID_JSON')
            }
        }

        try {
            parse(null)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'NULL_ARGUMENT', 'error code is set')
        }
    }
    //

    // You can still test against the message using a regular expression. The
    // message will appear alone on the first line of the `message` property.

    //
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        function parse (string) {
            if (string == null) {
                throw new ParseError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('INVALID_JSON')
            }
        }

        try {
            parse(null)
        } catch (error) {
            // _Note that the `m` suffix makes this a multi-line matching regex._
            okay(/^the JSON string to parse must not be null$/m.test(error.message), 'message is first line of message property')
        }
    }
    //

    // I prefer codes, though. You can add codes as needed. They are easy to
    // document. Without documentation, just reading the code, you have a single
    // place where you get a catalog of everything that can go wrong with your
    // module.

    // You can also catch errors by type using a switch statement instead of the
    // `if`/`else` and `instnaceof` ladder.

    //
    console.log('\n--- catching exceptions by type and code ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            TOO_MUCH_JSON: 'the JSON string to parse is too long',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        function parse (string) {
            if (string == null) {
                throw new ParseError('NULL_ARGUMENT')
            }
            if (typeof string != 'string') {
                throw new ParseError('WRONG_TYPE')
            }
            if (string.length > 4096) {
                throw new ParseError('TOO_MUCH_JSON')
            }
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('INVALID_JSON')
            }
        }

        // **TODO** Add symbols.
        function safeParse (json) {
            try {
                parse(json)
            } catch (error) {
                switch (`${error.name}:${error.code}`) {
                case 'ParseError:INVALID_JSON':
                case 'ParseError:TOO_MUCH_JSON':
                    // _User gave us some bad json, unexceptional so return null._
                    return null
                }
                // _Called `parse` incorrectly, programmer error so panic._
                throw error
            }
        }

        try {
            safeParse(null)
        } catch (error) {
            console.log(error.stack)
            console.log('')
        }
        okay(safeParse('invalid json'), null, 'user gave us some bad JSON')

        const INVALID_JSON = Symbol('INVALID_JSON')
        const code = INVALID_JSON

        console.log(INVALID_JSON.toString())
    }
    //

    // If you provide a code parameter that was not defined when you called
    // `Interrupt.create()` the string value is used as a message.

    //
    console.log('\n--- create interrupt with missing code ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string'
        })

        function parse (string) {
            if (string == null) {
                throw new ParseError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('INVALID_JSON')
            }
        }

        try {
            parse(null)
        } catch (error) {
            // _Note that the `m` suffix makes this a multi-line matching regex._
            console.log(error.stack)
            console.log('')
            okay(/^NULL_ARGUMENT$/m.test(error.message), 'no code found, use first argument as message')
        }
    }
    //

    // This means you can just use Interrupt directly without code if you so
    // choose, but I really like codes.

    //
    console.log('\n--- using Interrupt without codes ---\n')
    {
        const ParseError = Interrupt.create('ParseError')

        function parse (string) {
            if (string == null) {
                throw new ParseError('the JSON string to parse must not be null')
            }
            try {
                return JSON.parse(string)
            } catch (error) {
                throw new ParseError('unable to parse JSON string')
            }
        }

        try {
            parse(null)
        } catch (error) {
            // _Note that the `m` suffix makes this a multi-line matching regex._
            console.log(error.stack)
            console.log('')
            okay(/^the JSON string to parse must not be null$/m.test(error.message), 'specify message as first argument instead of code')
        }
    }
    //

    // Sometimes a one-liner gets too hard to read. Breaking up the declaration
    // across multiple lines helps, and while you're at it, you may as well give
    // a name to what you're trying to do.

    // All of the above parameters can be specified with an `options` object as
    // the first parameter to the constructor.

    //
    console.log('\n--- construct an Interrupt with named parameters ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string'
        })

        function parse (json) {
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError({
                    code: 'INVALID_JSON',
                    errors: [ error ],
                    context: { json },
                    callee: parse
                })
            }
        }

        try {
            parse('!')
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'INVALID_JSON', 'code set')
        }
    }
    //

    // At times you might want to construct exceptions programmatically, merging
    // context that is common to a scope with specific context for a particular
    // exception. You can create an options object that is common to a scope.

    // You can then call the exception constructor with the `options` object
    // followed by any positional parameters. The positional parameters will be
    // merged into the `options` object before constructing the object.

    // We said that you can't override the `code` property of an exception with
    // a `code` property in the `context` object, but you can override the
    // `code` property of the `options` object with a positional `code` property
    // in the constructor.

    //
    {
        // **TODO** Example.
    }
    //

    // Construction has no assertions. If you create `new Interrupt` with
    // incorrect parameters the constructor will do it's best to create
    // something from what you give it. Exception code is often skipped in the
    // the unit tests. We don't want to throw assertions because you put the
    // arguments in the wrong order. We want to report the application exception
    // and if it is missing context or the formatted message contains a dangling
    // participle that ought to be apparent in stack trace message.

    //

    // If you specify a message for which there is no error code, it is used as
    // the `message` property and the `code` property is not set.

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

    // For example, imagine we have a `Synax` class in our module. We'd like to
    // have `SyntaxError` specific to our module but `SyntaxError` a
    // `SynaxError` already exists in the global namespace. We can create
    // instead create a `Syntax.Error`, an error that has a dot qualfiied name
    // and is a static member of our `Syntax` class.

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

    // **TODO** Didn't I write about this at length? Is it in the swipe?

    // Often times you invoke system functions that produce stubby contextless
    // errors like `EBADFD` stack trace at all. This is an [known issue in
    // Node.js](https://github.com/nodejs/node/issues/30944).

    //
    console.log('\n--- file system call with no stack information ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
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
    //

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
                UNABLE_TO_READ_FILE: 'unable to read file: %(filename)s'
            })

            async read (filename) {
                try {
                    return await fs.readFile(filename)
                } catch (error) {
                    throw new Reader.Error('UNABLE_TO_READ_FILE', error, { filename })
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
                UNABLE_TO_OPEN_FILE: 'unable to open file %(filename)s',
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s',
                UNABLE_TO_STAT_FILE: 'unable to stat file %(filename)s',
                UNABLE_TO_CLOSE_FILE: 'unable to close file %(filename)s'
            })

            async read (filename) {
                // _It is not difficult to test this catch block._
                let handle
                try {
                    handle = await fs.open(filename, 'r')
                } catch (error) {
                    throw new Reader.Error('UNABLE_TO_OPEN_FILE', error, { filename })
                }
                // _But how would you test this one? What sort of file
                // permission trickery do you have to set up in your unit test
                // to create a file you can open but you cannot stat? Do you
                // have to run your tests as root to to do it?_
                let stat
                try {
                    stat = await handle.stat()
                } catch (error) {
                    throw new Reader.Error('UNABLE_TO_STAT_FILE', error, { filename })
                }
                const buffer = Buffer.alloc(stat.size)
                // _How about a file you've been allowed to open for reading
                // that you're not actually allowed to read?_
                try {
                    await handle.read(buffer, 0, buffer.length, 0)
                } catch (error) {
                    throw new Reader.Error('UNABLE_TO_READ_FILE', error, { filename })
                }
                // _How about a file you've been allowed to open for reading
                // that you've stat'd and read that you're not allowed to
                // close?_
                try {
                    await handle.close()
                } catch (error) {
                    throw new Reader.Error('UNABLE_TO_CLOSE_FILE', error, { filename })
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
    // all four operations in a single catch block? That's what exceptions are
    // for! That's how exceptions work!

    //
    console.log('\n--- a monolithic try/catch block for four file system calls ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s'
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
                    throw new Reader.Error('UNABLE_TO_READ_FILE', error, { filename })
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
                UNABLE_TO_OPEN_FILE: 'unable to open file %(filename)s',
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s',
                UNABLE_TO_STAT_FILE: 'unable to stat file %(filename)s',
                UNABLE_TO_CLOSE_FILE: 'unable to close file %(filename)s'
            })

            async read (filename) {
                const handle = await Reader.Error.resolve(fs.open(filename, 'r'), 'UNABLE_TO_OPEN_FILE', { filename })
                const stat = await Reader.Error.resolve(handle.stat(), 'UNABLE_TO_STAT_FILE', { filename })
                const buffer = Buffer.alloc(stat.size)
                await Reader.Error.resolve(handle.read(buffer, 0, buffer.length, 0), 'UNABLE_TO_READ_FILE', { filename })
                await Reader.Error.resolve(handle.close(), 'UNABLE_TO_CLOSE_FILE', { filename })
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
    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        class Reader {
            // **TODO** `sprintf` is rasing exceptions '%{' makes it angry,
            // catch any exception it might throw and just use the string.
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s'
            })

            async read (filename, callback) {
                fs.readFile(filename, (error, body) => {
                    if (error) {
                        callback(new Reader.Error('UNABLE_TO_READ_FILE', error, { filename }))
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
                console.log('')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })

    await new Promise(resolve => {
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
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s'
            })

            async read (filename, callback) {
                fs.readFile(filename, encase('UNABLE_TO_READ_FILE', callback, { filename }))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
                console.log('')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })

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
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s'
            })

            async read (filename, callback) {
                fs.readFile(filename, encase($ => $('UNABLE_TO_READ_FILE', { filename }), callback))
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
                UNABLE_TO_READ_FILE: 'unable to read file %(filename)s'
            })

            async read (filename, callback) {
                fs.readFile(filename, Reader.Error.callback($ => $('UNABLE_TO_READ_FILE', { filename }), callback))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
                console.log('')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
})

// ## Swipe


// I've always been able to program try/catch in Node.js regardless of whether a
// function is synchronous or asynchronous because I've always programmed with
// `cadence` which has a nice implementation of asynchronous `try`/`catch`.

// In JavaScript, `Error` defined as some arbitrary object with an `Error` type
// and a `message` property. It is, in itself, not very useful. Google's V8
// Engine, the JavaScript engine behind Node.js, makes it more informative by
// adding a stack trace. With the stack trace you get an idea of where in your
// code the exception occurred.

// But, often times that stack trace is of limited value. Node.js programming,
// and most all JavaScript programming is asynchronous. Your program is called
// back from an event loop. If you get an error in a Node.js core library from a
// callback, the stack trace will trace from the core library down to the point
// of the event loop call, with no reference to the file and line in your
// program that make the function call for the associated callback.

// This is a problem with error-first callback programming, Node.js events
// programming and `Promises` code before Node.js 14, and continues to be
// a problem after async stack traces where enabled in Node.js 14.

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

// Not always though, because sometimes the errors occur in the Node.js event
// loop while handling sockets and files. To help out when strack traces are
// short and stubby, Interrupt lets you add formatted messages and context
// information, usually with a simple one liner.
