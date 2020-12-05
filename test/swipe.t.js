// ## Using Codes Without Exceptions

// Say something about this because I'm doing it in interrupt.

// ## Swipe

// https://github.com/nodejs/node/issues/30944

// Here is where I put words that have no home yet, or stuff that I wrote out in
// the documentation as it occurred to me, but then saw that it had gotten
// long-winded or philosophical and requires pairing or a special section.

// Here too is where I work though unit tests for inclusion in the
// `readme.t.js`, while working on their documentation.

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

// One of the problems with exceptions is that they are not on the what some
// call the happy path. The happy path is the path through your code where
// everything is running smoothly, the path that you would hope gets followed
// most of the time. Because exceptions are not on the happy path they don't get
// much exercise and moreover, they don't get much testing.

// Unit testing exceptions can be a pain. You have to set up failure conditions
// that are rare. You might have failure consitions that depend on operating
// system misconfigurations that a unit test running as a non-root user
// shouldn't be able to establish.

// Just run test coverage on any code base and see how many of the catch blocks
// are untested.

// Interrupt tries to address these challenges by auditing the happy path or
// else by asserting that an error code path is correct for all types of errors
// when you traverse it one type of error.

// Interrupt tries to be accommodating on error path and exacting on the happy
// path. It has a lot of assertions on functions that are executed during normal
// operation and a lot of fallbacks on the functions that are executed during
// exception handling.

// These facilities are for wrapping and rethrowing excpetions and now you can
// see why this is important to use. It would be a foolish for Interrupt to try
// to provide a replacement for the catch block however.

// Context versus formatted messages: now that you have a context object dumped
// into your stack trace, you can forgo a lot of message formatting. Just
// because a facility is available, doesn't mean you're supposed to use it. If
// you can't open a file your message can be "unable to open file," you can put
// the file in the context object and it will be right underneath, labeled, and
// you don't have to worry about the error message becoming too long to read.

// You can reserve message formatting for parameters you know will be reasonable
// such as "property must be a %(expected)s got %(actual)s", typeof expected,
// typeof actual.

// Arriving in Node.js 15, but the current shim doesn't work correctly for
// reasons I don't care to investigate. This was a nice to have and it doesn't
// really matter if an `Interrupt` is an `AggregateError`. I'd have to be
// convinced from someone who adopted Interrupt, not as an advocacy effort.

// Because construction is deferred, we defer construction to after the
// resolution of callback. Because the deferred construction takes place in an
// anymomous function provided by the user, the call stack of the invocation the
// deferred constructer passes through the application code, right at the line
// where the originating function was invoked. The resulting exception for the
// callback will originate at the same file and line where the originating
// function was called.

// **TODO** Document `Interrupt.Error` as an example of how to document an
// external error.

// **TODO** Already serializing `undefined` as `[ '_undefined' ]` has caught
// dead code in an Interrupt sneak (`ln -s`) preview.

// **TODO** Importing codes seems like it would silently fail.

//
require('proof')(5, async okay => {
    const Interrupt = require('..')

    // ## Thoughts on inhertiance.
    {
        // Declare a bunch of codes.

        //
        class Config {
            static Error = Interrupt.create('Config.Error', [
                'IO_ERROR',
                [ 'PARSE_ERROR', 'INVALID_ARGUMENT' ],
                function () {
                    return 'RANGE_ERROR'
                },
                {
                    'NULL_ARGUMENT': `argument must not be null: %(_name)s`
                }
            ])
        }
        //

        // Inherit codes as is. Simply inherit them. With default properties.

        //
        class Descend {
            static Error = Interrupt.create('Descend.Error', Config.Error, Config.Error.code('PARSE_ERROR').symbol, function ({ codes, inherited }) {
                return [ inherited.NULL_ARGUMENT.code.symbol ]
            })
        }

        okay(Descend.Error.IO_ERROR != null && Descend.Error.IO_ERROR === Config.Error.IO_ERROR, 'inherited code')
        okay(Descend.Error.NULL_ARGUMENT != null && Descend.Error.NULL_ARGUMENT === Config.Error.NULL_ARGUMENT, 'inherited another code')
        //

        try {
            throw new Descend.Error('NULL_ARGUMENT', { _name: 'count' })
        } catch (error) {
            console.log(`${error.stack}\n`)
        }
    }
    //

    // You can define symbols elsewhere and import them into the defintion of
    // your expcetion.

    // To do so you use a `Map` where the key is the symbol and the definition
    // either the message or the default properties for the code. The code name
    // will be extracted from the `toString()` value of the `Symbol`. This is
    // fine because the `toString()` value is defined in the specification, so
    // we can get it out across platforms with a regular expression. If you want
    // to override the name used to create the `Symbol` you can specify a new
    // name as the `code` property of a default properties object.

    //
    console.log(`\n--- use existing codes ---\n`)
    {
        const Constants = {
            IO_ERROR: Symbol('IO_ERROR'),
            INVALID_ARGUMENT: Symbol('INVALID_ARGUMENT'),
            YET_ANOTHER_SYMBOL: Symbol('YET_ANOTHER_SYMBOL')
        }

        class Config {
            static Error = Interrupt.create('Config.Error', new Map([
                [ Constants.IO_ERROR, null ],
                [ Constants.INVALID_ARGUMENT, 'invalid argument for: %(_name)s' ],
                [
                    Constants.YET_ANOTHER_SYMBOL,
                    {
                        code: 'NULL_ARGUMENT',
                        message: 'argument must not be null: %(_name)s'
                    }
                ]
            ]))
        }

        try {
            throw new Config.Error('IO_ERROR')
        } catch (error) {
            okay(error.symbol, Config.Error.IO_ERROR, 'use symbol')
            okay(error.code, 'IO_ERROR', 'use symbol name as code')
            okay(Interrupt.message(error), 'IO_ERROR', 'use symbol name as message')
        }
    }
    //

    // To inherit a code from the parent... (Do simple.)

    //
    {
    }

    // To inherit a code but redefine it's properties specify the symbol and any
    // properties you wish to override. Your properties will be merged with the
    // inherited properties. (But, what if you want to completely reset? Expose
    // `combine` and instruct)

    // Starting to doubt whether this needs to be so complicated, or rather
    // whether it needs to have all this syntax bashing. It's a definition. It
    // is mostly fluid, but do we need to have all these syntax rules for
    // inheritance?

    // I appreciate the syntax bashing for being able to one-liner throws, but
    // I'm not loving it for declarations, even if I don't want to encourage
    // error heirarchies, I don't want to make them so punishing that people
    // open GitHub Issues to ask me how to use a feature I don't use myself.

    // Well, just using `extend` is not a method chained interface really. I can
    // live with it. Gets me through this bit, I think.

    //
    return
    {
        // **TODO** Do not flatten, recurse at time of construction.
        // **TODO** Upcase Codes.
        // **TODO** Bring inheritance into Swipe.
        // **TODO** Determine the Super and Template types.
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'io error',
                    recoverable: false,
                    type: 'file'
                },
                TYPED_IO_ERROR: {
                    code: 'IO_ERROR',
                    type: 'file'
                },
                FATAL_IO_ERROR: {
                    code: 'TYPED_IO_ERROR',
                    recoverable: false
                },
                RECOVERABLE_IO_ERROR: {
                    code: 'TYPED_IO_ERROR',
                    recoverable: true
                }
            })
        }

        // I mean, I could just say that these Super objects are not supposed to
        // be dumped at all.
        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error,
            function ({ Super: { Codes, Templates } }) {
                // If you want to import all the codes.
                const codes = Object.keys(Super.Codes).map(code => Super.Codes[code])
                // If you want to import all the codes and templates, just return them.
                return [ Super ]
                // Same as the above.
                return [ Codes, Templates ]
                // More likely, import all the codes, update some of the
                // templates. Okay, problem because we're trying to be strict
                // here and say that you must declare things in order, but I'm
                // already imagining having the dependencies differed so that we
                // could redefined `TYPED_IO_ERROR` and have type be
                // `'directory'` everywhere.
                //
                // No, the order is maintained.
                return [ Codes, { ...Templates,
                    TYPED_IO_ERROR: {
                        code: Super.Templates.TYPED_IO_ERROR,
                        type: 'directory'
                    }
                }]
                /*
                return {
                    // Import Code.
                    IO_ERROR: Super.Codes.IO_ERROR,
                    // Import parent tempalte as is.
                    RECOVERABLE_IO_ERROR: Super.Templates.RECOVERABLE_IO_ERROR,
                    // Redefine a parent template property (there is no way to pair them down.)
                    RECOVERABLE_IO_ERROR: {
                        code: Super.Templates.RECOVERABLE_IO_ERROR, // Will automatically import parent Codes.IO_ERROR.
                        type: 'directory'
                    }
                }
                */
            })

            /*

            function ({ Codes, Super }) {
                const inherit = 'IO_ERROR'.split(/\s+/).map(code => Super[code])
                return [
                    Super.IO_ERROR, // Inherit as is.
                    {
                        // Does it get easier if everything is in the object, code and all, everything except the symbol?
                        DERIVED_IO_ERROR: {
                            code: Super.IO_ERROR,
                            reoverable: true
                        }
                    }
                    Super.IO_ERROR.extend({ recoverable: false }),
                    Super.IO_ERROR.extend(Object.defineProperties({}, {
                        recoverable: { value: false, enumerable: false }
                    })),
                    {
                        IO_ERROR: {
                            code: Super.IO_ERROR,
                            message: 'i/o error',
                            recoverable: false
                        }
                    }
                ]
                return [{
                    IO_ERROR: Interrupt.merge(Super.IO_ERROR, { message: 'i/o error' })
                }, Super.IO_ERROR ]
            })
            */
        }
    }

    // To inherit a code from the parent you simply as a symbol-based code
    // delclaration with a new set of default properties. The new properties
    // will be overwritten.

    //
})
