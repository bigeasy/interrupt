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
require('proof')(16, async okay => {
    const Interrupt = require('..')
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

    // If you want to import symbols into your generated error class, you can
    // specify a `Symbol` using the `symbol` property. The given `Symbol` will
    // be used to generate the symbol constant on the class.

    //
    console.log(`\n--- use existing codes ---\n`)
    {
        const Constants = {
            IO_ERROR: Symbol('IO_ERROR'),
            INVALID_ARGUMENT: Symbol('INVALID_ARGUMENT'),
            YET_ANOTHER_SYMBOL: Symbol('YET_ANOTHER_SYMBOL')
        }

        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: { symbol: Constants.IO_ERROR },
                INVALID_ARGUMENT: {
                    symbol: Constants.INVALID_ARGUMENT,
                    message: 'invalid argument for: %(_name)s'
                },
                NULL_ARGUMENT: {
                    symbol: Constants.YET_ANOTHER_SYMBOL,
                    message: 'argument must not be null: %(_name)s'
                }
            })
        }

        try {
            throw new Config.Error('IO_ERROR')
        } catch (error) {
            console.log(error.stack)
            okay(error.symbol, Config.Error.IO_ERROR, 'use symbol')
            okay(error.code, 'IO_ERROR', 'use symbol name as code')
            okay(Interrupt.message(error), 'IO_ERROR', 'use symbol name as message')
        }
    }
    //

    // To inherit a code from the parent... (Do simple.)

    // To inherit a codes and aliases from the parent you must use a code
    // function. The code function is given an object with a `Codes` property
    // and a `Super` property that contains an object. The `Super` contains a
    // `Codes` property containing the codes of super class indexed by the code
    // name and an `Alaises` property containing the aliases of the super class
    // indexed by code name.

    //
    console.log('\n--- inherit a code ---\n')
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: 'i/o error'
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return Super.Codes.IO_ERROR
            })
        }

        okay(Config.Error.IO_ERROR === Derived.Error.IO_ERROR, 'symbols inherited')

        try {
            throw new Derived.Error('IO_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'i/o error', 'inherit message format')
            okay(error.code, 'IO_ERROR', 'inherit code name')
            okay(error.symbol, Config.Error.IO_ERROR, 'inherit code symbol')
        }
    }
    //

    // You can import all the codes at once by returning the codes object.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse'
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return Super.Codes
            })
        }

        okay(Derived.Error.codes.sort(), [ 'IO_ERROR', 'PARSE_ERROR' ], 'all codes inherited')
        okay((
            Config.Error.IO_ERROR === Derived.Error.IO_ERROR &&
            Config.Error.PARSE_ERROR === Derived.Error.PARSE_ERROR
        ), 'symbols inherited')

        try {
            throw new Derived.Error('IO_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'i/o error', 'inherit message format')
            okay(error.code, 'IO_ERROR', 'inherit code name')
            okay(error.symbol, Config.Error.IO_ERROR, 'inherit code symbol')
            okay(error.recoverable,  'inherit default property')
        }
    }
    //

    // If you want to inherit a code and extend it you use the Super's code
    // object as the `code` property of a defintion. The properties of the
    // parent's code will be merged with your definition preserving the property
    // settings `enumerable`, `writable` and `configurable`.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse'
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return {
                    IO_ERROR: {
                        code: Super.Codes.IO_ERROR,
                        recoverable: false,
                        type: 'directory'
                    }
                }
            })
        }

        okay(Config.Error.IO_ERROR === Derived.Error.IO_ERROR, 'symbols inherited')

        try {
            throw new Derived.Error('IO_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'i/o error', 'inherit message format')
            okay(error.code, 'IO_ERROR', 'inherit code name')
            okay(error.symbol, Config.Error.IO_ERROR, 'inherit code symbol')
            okay(error.recoverable, false, 'override default property')
            okay(error.type, 'directory',  'add default property')
        }
    }
    return
    //

    // ## Error Heirarchies

    // **TODO** Took this from a commit message.

    // Don't imagine that people are going to create error classes from other
    // modules, but if they do, they should be careful not to use existing
    // templates since they are not public. Seems like maybe they should not be
    // inherited, though. The user can always define a set of common templates
    // in a module somewhere, as a builder function and import it to different
    // modules in their code, so I'm liable to back out of this inheritance.

    // Come to think of it, the messages are not public either. If you where to
    // inherit the messages associated with codes you'd end up having to
    // document the message formats. It really does make more sense to have a
    // builder function and to specify your own symbols.

    // Currently you could use someone else's `Error` class, like `TypeError`,
    // but you can't use their formatting.

    // **TODO** And we'd document that decision like this.

    // Although you inherit the codes of the parent, you cannot inherit the
    // message templates. (Okay, I'm still not sure about this. Why not? If
    // someone derives from your class you have to redefine all the templates?
    // Its because of those aliases, they really are not public.)

    // Seems like we could have `codes` return `code`, `symbol` and
    // `properties`, where `properties` is a copy of the set of properties set
    // on the exception for the code and it even has the enumerable property
    // set, or maybe it is a map like the one you'd pass to
    // `Object.defineProperties()`.

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

    // And yet, we already have these functions. We do inherit a code from the
    // parent if it is mentioned. We can inherit the code too if you reference
    // it? There's some magic for you.

    // Alternatively, it could be the case that we do not do this (it really
    // doens't cost anything so that's not an argument) and you could share with
    // code generator functions.

    // Maybe we include an options object, we don't inherit unless there is a
    // flag? Since we have underbars on properties could we use that?

    // You can still error heirarcies with Interrupt. Error codes that are
    // redefined in derived classes use the same symbol but you can override the
    // error message.

    // **TODO** Default properties are merged. If they are defined in the
    // derived class they are overwritten.

    // **TODO** There is no room for it now, but what if you wanted to specify
    // code with one string and message with another? Seems like this might be a
    // solution for it though, simply state that you'd be using the derived
    // classes to create string tables. Ultimately, you could create an
    // `Interrupt.Messages` class and `Reader.Messages.raise()` or
    // `Reader.Messages.create()`. Could be a helper function too. Getting
    // really close to internationalization.

    // **TODO** Actually, code overrides, so you could have a whole set of
    // message only codes, a string table, and then use an actual code after it,
    // and if you like, you could underbar them so that they are private.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        // Getting closer, but we should probably punt this for now, since I'd
        // rather skip ahead to something I'm actually going to use.

        // But, say the builder function gets called with an object containing
        // all the codes and templates defined in the super class, which if you
        // know about them, you can use them, and if you don't you can learn
        // about them, either way.

        // And `codes` remains the same, but maybe it also includes an `alias`
        // boolean.

        // I really do not want to allow you to merge or override, I do not want
        // duplicates.

        // We don't flatten the properties anymore more, but keep a flattened
        // copy for use at construction. You refer to the referenced code by
        // symbol, and it ought to be by symbol only, oh, no because you can't
        // create repeated templates in one fell swoop.

        // We still have underbars to make these things private. Could use the
        // `#` too. Could use the `#` for `sprintf`.

        // Really need to punt. Don't want to spent three weeks on this project
        // before I've tested all these facilities.

        // Need to redocument because we don't do anything implicitly anymore.

        //
        const ConfigError = Interrupt.create('IOError', {
            PARSE_ERROR: 'unable to parse JSON'
        }, 'IO_ERROR')

        const DirectoryError = Interrupt.create('DirectoryError', ConfigError, new Map([[
            ConfigError.IO_ERROR, 'unable to read dir'
        ]]))

        // **TODO** Make argument an object, destructure.
        const FileError = Interrupt.create('FileError', ConfigError, function ({ codes, inherited }) {
            return new Map([[ inherited.IO_ERROR.code.symbol, 'unable to read file' ]])
        })

        okay(
            ConfigError.IO_ERROR == FileError.IO_ERROR &&
            ConfigError.IO_ERROR == DirectoryError.IO_ERROR &&
            FileError.IO_ERROR == DirectoryError.IO_ERROR
        , 'symbols are the same')

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new DirectoryError('IO_ERROR')
            }
            const files = []
            for (const file of dir) {
                let body
                try {
                    body = fs.readFile(path.join(dir, file), 'utf8')
                } catch (error) {
                    throw new FileError('IO_ERROR')
                }
                try {
                    configs.push(JSON.parse(body))
                } catch (error) {
                    throw new ConfigError('PARSE_ERROR')
                }
            }
        }

        try {
            const dirname = path.join(__dirname, 'tmp', 'eisdir')
            await loadConfigs(dirname)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'IO_ERROR', 'code set')
            okay(Interrupt.message(error), 'unable to read file', 'use default message for code')
        }

        try {
            const dirname = path.join(__dirname, 'tmp', 'missing')
            await loadConfigs(dirname)
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.code, 'IO_ERROR', 'code set')
            okay(Interrupt.message(error), 'unable to read dir', 'override default message for code')
            okay(error instanceof DirectoryError, 'object is of derived class type')
            okay(error instanceof ConfigError, 'object is of derived super class type')
            okay(error instanceof Interrupt, 'object is an Interrupt')
        }
    }
    //

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
