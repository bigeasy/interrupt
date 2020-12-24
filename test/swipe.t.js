// ## Using Codes Without Exceptions

// Say something about this because I'm doing it in interrupt.

// ## Swipe

// https://github.com/nodejs/node/pull/34103#issuecomment-652002364

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
require('proof')(6, async okay => {
    const semblance = require('semblance')
    const Interrupt = require('..')
    // ## Stack Pokers

    // Because stack traces do not survive across macrotask queues, you have to
    // write a lot

    // You can use Interrupt to catch and wrap errors in order to have a nested
    // collection of stack traces to trace errors across macrotask invocations.

    // This can get tedious quickly, however, adding a lot of code, requiring
    // you to come up with a lot of error names. The true cause of an error
    // might get burred in a deep nesting making your stack traces hard to read.

    // Instead of wrapping error in exceptions, you can add bread crumbs to your
    // stack trace. When the error is constructed it will will include in its
    // stack trace the important stops along the way that brought the program to
    // its unfortunate state. For this we use trace functions.

    // Poker functions where introduced as deferred construction, but the same
    // concept can serve an additional purpose.

    // **TODO** Why not insist on using UserClass.create() instead of `new`? I
    // suppose because you will always have to regenerate the stack in that
    // case.

    // **TODO** Okay, stuck. We could perpetuate the poke by appending options
    // to the end of the variadic argument return, and that is sneaky, and
    // brittle, but probably gets an example written.

    // **TODO** Becomes difficult to maintain for resolve, though. But at least
    // this would get us started on an implementation.

    //
    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_DIRECTORY: 'unable to read directory: %(dirname)s',
                UNABLE_TO_READ_FILE: 'unable to read file: %(filename)s'
            })

            read (dirname, trace, callback) {
                trace.top = true
                fs.readdir(dirname, Reader.Error.callback({ $trace: trace }, 'UNABLE_TO_READ_DIRECTORY', $ => $(), (error, dir, options) => {
                    if (error) {
                        callback(error)
                    } else {
                        function readFile () {
                            if (dir.length == 0) {
                                callback(null, files)
                            } else {
                                const filename = path.join(dirname, dir.shift())
                                fs.readFile(filename, 'utf8', Reader.Error.callback(options, 'UNABLE_TO_READ_FILE', { filename }, $ => $(), (error, body) => {
                                    if (error) {
                                        callback(error)
                                    } else {
                                        files.push({ filename, body })
                                        readFile()
                                    }
                                }))
                            }
                        }
                        readFile()
                    }
                }))
            }

            readdir (...vargs) {
                const callback = vargs.pop()
                const dirname = vargs.shift()
                const trace = Reader.Error.options({ $trace: vargs[0] })
            }

        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing'), $ => $(), (error, body) => {
            console.log('----- returned ----')
            if (error) {
                console.log(`${error.stack}\n`)
                okay(error.code, 'UNABLE_TO_READ_DIRECTORY', 'curried callback wrapper code set')
                okay(error.errors[0].code, 'ENOENT', 'curried callback nested error set')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            reader.read(path.join(__dirname, 'tmp', 'eisdir'), $ => $(), (error, body) => {
                if (error) {
                    console.log(`${error.stack}\n`)
                    okay(error.code, 'UNABLE_TO_READ_FILE', 'curried callback wrapper code set')
                    okay(error.errors[0].code, 'EISDIR', 'curried callback nested error set')
                } else {
                    console.log(/hippopotomus/.test(body.toString()))
                }
                resolve()
            })
        })
    })

    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARSE_ERROR: 'unable to parse JSON'
        })

        console.log(ConfigError.create({}, [ 'PARSE_ERROR' ]).stack)
        console.log(ConfigError.create({}, [ 'PARSE_ERROR', $ => $() ]).stack)
        console.log(Interrupt.parse(ConfigError.create({}, [ 'PARSE_ERROR', $ => $() ]).stack))
    }

    {
        const util = require('util')

        const ConfigError = Interrupt.create('ConfigError', {
            PARSE_ERROR: 'unable to parse JSON'
        })

        const e = ConfigError.create({}, [ 'PARSE_ERROR' ])
        Interrupt.parse(e.stack)
        const parser = new Interrupt.Parser(true)
        e.dumped = true
        e.reallyDumpy = 'dump dump'
        e.superDump = [ 1, 2, 3, 4, 5 ]
        const stack = util.inspect(e)
        for (const line of stack.split('\n')) {
            parser.push(line)
            if (parser.parsed.length != 0) {
                console.log(parser.parsed.shift())
            }
        }
    }

    //
    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARSE_ERROR: 'unable to parse JSON'
        })

        try {
            throw new ConfigError(null)
        } catch (error) {
            console.log(`${error.stack}\n`)
            console.log(Interrupt.errors(error))
            okay(Interrupt.parse(error.stack).$errors, [{ code: 'NULL_ARGUMENT' }], 'parsed construction errors')
        }
    }

    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARSE_ERROR: `
                unable to parse JSON

                multi-line message
            `
        })

        try {
            throw new ConfigError('PARSE_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.parse(error.stack).message, 'unable to parse JSON\n\nmulti-line message', 'parse multi-line messaged')
        }
    }
    //

    // **TODO** This is new. Just realized that `AssertionError` injects the
    // code into the stack using `name`, forces the stack to generate, then sets
    // `name` again. This is pretty wicked. As wicked as anythign I do in
    // Interrupt and good to mention in the `readme.t.js`.

    //
    {
        const assert = require('assert')

        try {
            assert(false, 'wrong')
        } catch (error) {
            const parsed = Interrupt.parse(Interrupt.stringify(error))
            okay(semblance(parsed, {
                className: 'AssertionError',
                message: 'wrong',
                properties: {
                    generatedMessage: false,
                    code: 'ERR_ASSERTION',
                    actual: false,
                    expected: true,
                    operator: '=='
                },
                errors: { length: 0 },
                $trace: { length: 0 },
                $errors: { length: 0 },
                stack: []
            }), 'stringify AssertionError')
        }
    }
    return
    // **TODO** Revisiting deferred construction.

    // We can reserve a single argument function for trace functions and use a
    // no argument function as a deferred constructor. Whatever is returned is
    // used as an argument.
    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARSE_ERROR: 'unable to parse JSON'
        })

        try {
            throw new ConfigError(() => 'CONFIG_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
        }
    }

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                }
            })
        }

        // **TODO** `Context` object is offically outgoing.
        // **TODO** Plain error object not serializing!
        console.log(new Config.Error('IO_ERROR', [ new Config.Error(1, 'IO_ERROR', new Error('hello'), { hello: 'world' }) ]))
        okay('done')
    }
    //

    // ## Error Heirarchies

    // Welcome to the check the box section of the documentation. I don't use
    // error heirarchies in my own code, and other that Interrupt itself, I've
    // never designed an exception for a module anticipating reuse.

    // You might want to do something with it, so here's some pretty good
    // support for inheirtance. But, without a doubt...

    // I've never looked at a module dependency and said, "boy I can't wait to
    // throw the exceptions this module throws from my own code, but I'm going
    // to want to make a few changes first." Nothing about Interrupt is intended
    // to change that.

    // These are mechanisms for exception class heirarchies that are defined
    // within a module, not a mechanism for creating exception classes for a
    // module that dependent module are supposed to extend.

    // If you go against this admonishment to good effect, please let me know.

    // Hard to say, really. No one derives their exceptions from other peoples
    // exceptions. There's a new `AggregateError` coming out at the time of
    // writing, but I can't derive `Interrupt` from it. I can, it works, and I
    // can fallback to `Error` if it is not present, but the existing polyfill
    // doesn't work. So, `Interrupt` is derived from `Error`.

    // No one derives their exceptions from other people's exceptions. It is
    // hard to imagine extending an exception without intimate knowledge of how
    // that module works, a desire to extend it. It is in that spirit that
    // `Interrupt` supports all this behind-the-scenes, undocumented
    // inheirtance, knowing that there are behind-the-scenes, undocument
    // collaborations between the modules on NPM, within an organization, and
    // you are given the set of existing codes and templates at `create` time to
    // perform assertions.
})
