// # Interrupt

// Exceptions are nice. I like the concept. I've always done my best to employ
// them in JavaScript and Node.js but it isn't always easy.

// Interrupt is a module I created to address the problems with JavaScript's
// limited exception mechanism, solving the numerous problems I've encountered
// that I'm sure you've encountered as well. It is not an elegant solution, but
// it is a solution none the less.

// ## Advocacy

// Interrupt allows you to get exceptions that have a file name and line number
// from your program, instead of a stubby stack trace that points to the
// wilderness of the Node.js source, or no stack trace at all. It does this with
// some syntactical struggle,but without the expensive superfluous stack trace
// generation of the long stack trace modules.

// Interrupt allows you to nest exceptions so you can provide application
// context to system and library exceptions.

// Interrupt allows you to cite multiple nested exceptions as the cause of your
// contextual exception which is necessary if you're doing any sort of parallel
// asynchronous programming where multiple parallel paths can raise exceptions.

// Interrupt uses and abuses the `Error.stack` property provided by Google V8 to
// generate an elaborate report from `Error.stack` including the `Error` type,
// message, context properties, stack trace along with the error messages and
// stack traces of all the nested errors.

// Interrupt's elaborate `Error.stack` is machine readable so you could
// conceivably process these stack traces programmatically when gather them from
// production logs.

// Interrupt can report it's elaborate stack trace de-duped with a count of
// similar exceptions so that when great many parallel operations raise the same
// exception you don't have wade through the repetitive stack traces to see if
// there is anything unique about one of them.

// Interrupt endeavours to do all this with a minimum of extra code and code
// paths so you can format exception messages with `sprintf-js`, set context
// properties, specify nested expressions the constructor, often as a one-liner.

// ## Running the Readme

// This readme document is a unit test from the Interrupt source code. It uses
// the [Proof](https://github.com/bigeasy/proof) unit test framework. We'll be
// using the `okay` method from Proof to assert the points we make about
// Interrupt.

// Please run this test yourself.
//
// ```text
// git clone git@github.com:bigeasy/interrupt.git
// cd interrupt
// npm install --no-package-lock --no-save
// node --async-stack-traces test/readme.t.js
// ```
//
// The only way to see the elaborate stack trace output is to run this test at
// the command line, so please do so.
//
// Interrupt is targeted for Node.js 12 or greater. Note that we are running
// with `--async-stack-traces` enabled and to enjoy all the features discussed
// in this readme you need to be running Node.js 14.
//
// Out unit test begins here.

//
require('proof')(50, async okay => {
    // To use Interrupt install it from NPM using the following.
    //
    // ```text
    // npm install interrupt
    // ```
    //
    // Then you can begin to use it in your code as follows.
    //
    // ```javascript
    // const Interrupt = require('interrupt')
    // ```
    //
    // But here, because we're in our project directory, we require Interrupt by
    // requiring the root of the project.

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
    // **TODO** Only export `codes` and have them map to symbols. Do not bother
    // exporting the messages, they are format strings in any case.

    //
    const ParseError = Interrupt.create('FooError', {
        INVALID_JSON: 'unable to parse JSON string',
        NULL_ARGMUMENT: 'the %(arg)s argument must not be null',
        WRONG_TYPE: 'the argument must be a string, got %(type)s'
    })
    //

    // We've created created a `ParseError` which is a descendent of `Interrupt`.

    //
    okay(ParseError.prototype instanceof Interrupt, 'Generated class is an Interrupt')
    //

    // `Interrupt` is a descendent of `Error`.

    //
    okay(ParseError.prototype instanceof Error, 'Generated class is an Error')
    //

    // `Interrupt` is the base class of all `Interrupt` exceptions, but it is
    // not meant to be used directly. You must define a derived class using the
    // `Interrupt.create()` method. An attempt to create a `new Interrupt()`
    // will raise an exception. This will be a plain `Error` and not an
    // `Interrupt` derived exception.

    // **TODO** Show what happens when you call `new Interrupt()`.

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

    // **TODO** Maybe we skip this. Or make it simpler.

    //
    console.log('\n--- throwing an Interrupt derived Error ---\n')
    {
        // _A parse function that can raise an exception. We catch the JSON
        // exception and wrap it an exception that provides more context._
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

    // ## Interrupt Codes

    //
    {
        const ParseError = Interrupt.create('ParseError', {
            NULL_ARGUMENT: 'the JSON string to parse must not be null',
            INVALID_JSON: 'unable to parse JSON string'
        })
    }
    //

    //

    // We'll get started from some examples using `JSON.parse` which throws a
    // `SyntaxError` exception when the JSON cannot be parsed.

    // All of the examples in this code are _contrived_, however, and in
    // practice, I'm never quite this zealous with my use of Interrupt. I
    // probably wouldn't bother to wrap a `SyntaxError`.

    // ## Errors by Code

    // Errors in JavaScript have very little context information. The only
    // property defined by the spec is `message`. (The `stack` property is a
    // Google V8 extension.)

    // The `message` is supposed to be human readable and because of this it
    // doesn't serve well as a programmatic indication of error type. A
    // developer many innocently reword a message for clarity and break code
    // that uses that old wording as test in a conditional statement.

    console.log('\n--- message only Errors ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        async function loadJSONConfiguration (filename) {
            let json
            try {
                json = await fs.readFile(filename, '')
            } catch (error) {
                const e = new Error('file unreadable: ' + filename)
                e.cause = error
                throw e
            }
            let config
            try {
                config = JSON.parse(json)
            } catch (error) {
                const e = new Error('unable to parse configuration')
                e.cause = error
                throw e
            }
            if (config == null || typeof config != 'object' || Array.isArray(object)) {
                throw new Error('JSON must be an object')
            }
            if (config.size == null) {
                throw new Error('memory is a require configuration parameter')
            }
            if (config.size == null) {
                throw new Error('memory configuration parameter must be a number')
            }
            return config
        }

        let config
        try {
            config = await loadJSONConfiguration(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            if (/file unreadable/.test(error.message) && error.cause.code == 'ENOENT') {
                // _If the file doesn't exist, use a default configuration._
                config = { size: 5 }
            } else {
                // _Otherwise report config file errors._
                throw error
            }
        }

        okay(config, { size: 5 }, 'used a default configuration (example)')
    }
    //

    // In the contrived example above we had to use a regular expression on the
    // human readable message to recover from a file I/O error. If someone where
    // to reword the message to "unable to read file:" that code would break.

    // One way to add programmatic error type information is to create multiple
    // error types. This is what they taught you to do when you first learned
    // about exceptions, create an exception taxonomy.

    //
    console.log('\n--- an Error heirarchy ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        class ConfigError extends Error {}
        class ConfigIOError extends ConfigError {}
        class ConfigParseError extends ConfigError {}
        class ConfigFormatError extends ConfigError {}
        class ConfigParamError extends ConfigError {}
        class ConfigMissingParamError extends ConfigParamError {}
        class ConfigInvalidParamError extends ConfigParamError {}

        async function loadJSONConfiguration (filename) {
            let json
            try {
                json = await fs.readFile(filename, '')
            } catch (error) {
                const e = new ConfigIOError('file unreadable: ' + filename)
                e.cause = error
                throw e
            }
            let config
            try {
                config = JSON.parse(json)
            } catch (error) {
                const e = new ConfigParseError('unable to parse configuration')
                e.cause = error
                throw e
            }
            if (config == null || typeof config != 'object' || Array.isArray(object)) {
                throw new ConfigFormatError('JSON must be an object')
            }
            if (config.size == null) {
                throw new ConfigParamMissingError('memory is a require configuration parameter')
            }
            if (config.size == null) {
                throw new ConfigParamTypeError('memory configuration parameter must be a number')
            }
            return config
        }

        let config
        try {
            config = await loadJSONConfiguration(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            if ((error instanceof ConfigIOError) && error.cause.code == 'ENOENT') {
                // _If the file doesn't exist, use a default configuration._
                config = { size: 5 }
            } else {
                // _Otherwise report config file errors._
                throw error
            }
        }

        okay(config, { size: 5 }, 'used a default configuration (example)')
    }
    //

    // This is not unreasonable. It's a way to go. Now you can document each of
    // the exception types and users can respond to them using an `if/`else`
    // ladder and `instanceof`.

    // However, using entire classes for what is essentially a flag is a kind of
    // heavyweight approach. The user now has to import your exceptions into
    // their namespace to use them as test conditions.

    // ```javascript
    // const { ConfigParseError, ConfigIOError, loadJSONConfiguration } = require('./config')
    // ```

    // Node.js itself doesn't extend the error class heirarchy by much.  In
    // fact, in our code we further test the cause of the I/O error by checking
    // a `code` property to see if it is a `ENOENT`, the POSIX code for a
    // missing file.

    // The default Node.js modules have declared precious few additional
    // exception types. They all use a `code` property, usually on a base
    // `Error` object, to indicate type of error.

    // Interrupt prefers to use codes as well.

    //
    console.log('\n--- errors using Interrupt ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            IO_ERROR: 'unable to read file: %(filename)s',
            PARSE_ERROR: 'unable to parse configuration: %(filename)s',
            FORMAT_ERROR: 'invalid configuration format: %(filename)s',
            PARAM_MISSING_ERROR: 'missing parameter: %(param)s, in file: %(filename)s',
            PARAM_INVALID_ERROR: 'parameter type invalid: %(param)s, got %(actual)s, expected: %(expected)s, in file: %(filename)s'
        })

        async function loadJSONConfiguration (filename) {
            let json
            try {
                json = await fs.readFile(filename, '')
            } catch (error) {
                throw new ConfigError('IO_ERROR', error, { filename })
            }
            let config
            try {
                config = JSON.parse(json)
            } catch (error) {
                throw new ConfigError('PARSE_ERROR', error, { filename })
            }
            if (config == null || typeof config != 'object' || Array.isArray(object)) {
                throw new ConfigError('FORMAT_ERROR', { filename })
            }
            if (config.size == null) {
                throw new ConfigError('PARAM_MISSING_ERROR', { filename, param: 'size'  })
            }
            if (typeof config.size == 'number') {
                throw new ConfigError('PARAM_TYPE_ERROR', {
                    filename, param: 'size', actual: typeof cofnig.size, expected: typeof 0
                })
            }
            return config
        }

        let config
        try {
            config = await loadJSONConfiguration(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            if (error.code == 'IO_ERROR'  && error.errors[0].code == 'ENOENT') {
                // _If the file doesn't exist, use a default configuration._
                config = { size: 5 }
            } else {
                // _Otherwise report config file errors._
                throw error
            }
        }

        okay(config, { size: 5 }, 'used a default configuration (example)')
    }
    //

    // Interrupt encourages you to create a set of error codes for your module.
    // I do this in lieu of creating an exception heirarchy preferring the
    // Node.js method of setting a `code` property on the `Error` instance.

    // Furthermore, Interrupt discourages the use of the `message` property
    // programmatically. In fact, Interrupt hijacks the `message`, adding
    // context and nested error stack traces so that they will appear in
    // `error.stack`.

    // Hijacking sounds bad, I know, but codes are nice because they are easier
    // to use in programming. Using codes to determine error type allows you to
    // change the wording of a message without breaking any code that tests the
    // message to determine the error type.

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

    // The `code` property is commonly used in Node.js however. All of the
    // errors eminating from the standard Node.js modules have a `code` property
    // and each `code` property has associated documentation. If you use codes
    // your module can adhere to this practice.

    // I prefer codes, though. You can add codes as needed. They are easy to
    // document. Without documentation, just reading the code, you have a single
    // place where you get a catalog of everything that can go wrong with your
    // module.

    // You can also specify the error code using a symbol.

    // The generated exception class has a property named for every code you
    // defined in your call to `Interrupt.create()`. The property has the code
    // name and the value is a `Symbol`. The `Symbol` is unique for the code.

    // When you create an exception it sets a non-enumerable `symbol` property
    // on the exception instance. This is set in addition to the code.

    // The symbol property is not printed in the context portion of the stack
    // trace message. It is already represented there by the `code` string.

    //
    console.log('\n--- inspecting the code Symbol of an Interrupt ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        okay(typeof ParseError.INVALID_JSON, 'symbol', 'symbol for INVALID_JSON defined')

        function parse (string) {
            if (string == null) {
                throw new ParseError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError('INVALID_JSON')
            }
        }

        try {
            parse('!')
        } catch (error) {
            okay(error.symbol === ParseError.INVALID_JSON, 'symbol is set')
        }
    }
    //

    // You can also specify the code by Symbol. Instead of passing the string
    // name of the code you pass in the Symbol for the code.

    //
    console.log('\n--- throwing an Interrupt by code Symbol ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        okay(typeof ParseError.INVALID_JSON, 'symbol', 'symbol for INVALID_JSON defined')

        function parse (string) {
            if (string == null) {
                throw new ParseError(ParseError.NULL_ARGUMENT)
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError(ParseError.INVALID_JSON)
            }
        }

        try {
            parse('!')
        } catch (error) {
            okay(error.symbol === ParseError.INVALID_JSON, 'symbol is set')
        }
    }
    //

    // Because Symbols are unique we can reuse a single exception class and
    // distiguish the type unambiously by Symbol.

    //
    console.log('\n--- catching exceptions by type and code ---\n')
    {
        const CSVError = Interrupt.create('ParseError', {
            NULL_ARGUMENT: 'the CSV string to parse must not be null'
        })

        const JSONError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: 'the JSON string to parse must not be null'
        })

        function csvParse (csv) {
            if (csv == null) {
                throw new CSVError('NULL_ARGUMENT')
            }
            return csv.split(/\s*,\s*/)
        }

        function jsonParse (json) {
            if (json == null) {
                throw new JSONError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new JSONError('INVALID_JSON')
            }
        }

        function parse (json) {
            let object
            try {
                object = jsonParse(json)
                object.csv = csvParse(object.csv)
                return object
            } catch (error) {
                switch (error.symbol) {
                case JSONError.NULL_ARGUMENT:
                    return { csv: [] }
                case CSVError.NULL_ARGUMENT:
                    object.csv = []
                    return object
                default:
                    throw error
                }
            }
        }

        okay(parse(null), { csv: [] }, 'convert null to empty object')
        okay(parse('{}'), { csv: [] }, 'convert missing CSV to empty array')
        okay(parse('{"csv":"a,b"}'), { csv: [ 'a', 'b' ] }, 'missing neither JSON nor CSV')

        try {
            parse('!')
        } catch (error) {
            console.log(error.stack)
            okay(error.symbol === JSONError.INVALID_JSON, 'invalid JSON error rethrown')
        }
    }
    //

    // In the contrived example above our CSV parser raises exceptions using a
    // Symbol to specify the code, the JSON parser uses strings to specify the
    // code. It doesn't matter the `symbol` property is set either way. In our
    // catch block we use a switch statement to distinguish between a
    // CSV `NULL_ARGUMENT` code and a JSON `NULL_ARGMENT` code.

    // Without the `symbol` property we'd have to compare both the `code`
    // property and test the `instanceof` the `error` to see if was a `CSVError`
    // or a `JSONError`.

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
            okay(error.code == null, 'no code is set')
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

    // Any string argument that is not in the set of codes for an exception is
    // used as the message. You can use this to override the default message.

    //
    /* TODO Override code message.
    {
        const ConfigError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('FILE_READ_ERROR', 'unable to read dir')
            }
            const files = []
            for (const file of dir) {
                let body
                try {
                    body = fs.readFile(path.join(dir, file), 'utf8')
                } catch (error) {
                    throw new ConfigError('FILE_READ_ERROR')
                }
                try {
                    configs.push(JSON.parse(body))
                } catch (error) {
                    throw new ConfigError('FILE_PARSE_ERROR')
                }
            }
        }
    }
    */
    //

    // ## Error Context

    // You can add context information to an Interrupt derived exception by
    // specifying an object whose properties will set on the constructed
    // exception.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function read (filename) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'FILE_READ_ERROR', 'code set')
            okay(error.filename, filename, 'filename property set')
        }
    }
    //

    // ## Formatted Messages

    // Messages are formatted using `sprintf-fs` which has a named parameter
    // syntax so we can use our context object as our `sprintf` parameters.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file: %(filename)s'
        })

        async function read (filename) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'FILE_READ_ERROR', 'code set')
            okay(error.filename, filename, 'filename property set')
        }
    }
    //

    // If a parameter is missing, `sprintf` will fail and the format will be
    // used as is.

    // To use a parameter in the format you **must** put it in the context
    // object and it will become a property of the exception. If you really want
    // to use a parameter but not have it become a property of the exception
    // prefix add an underbar to both the property in the context object and the
    // `sprintf` format.

    //
    /* **TODO** `sprintf` only parameters
    {
        const ReaderError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file: %(filename)s'
        })

        async function read (filename) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                throw new ReadError('READ_ERROR', { filename })
            }
        }

        try {
            await read(path.join(__dirname, 'missing'))
        } catch (error) {
            conosle.log(error.stack)
            console.log('')
            okay(error.code, 'READ_ERROR', 'code set')
            okay(error.filename, filename, 'filename property set')
        }
    }
    */
    //

    // ## Nested Exceptions

    // When you want to throw an exception based on a exception you caught you
    // can pass that exception's error into the constructor. The `errors`
    // property of the exception will contain the cause. Any argument that is an
    // object that is `instance Error` will be added to the `errors`.

    // If you pass in more than one error they will both be added to the errors
    // array. (**TODO** An example with a primary attempt and a fallback and
    // they both fail.)

    // Any `Array` argument to the constructor is treated as an array of nested
    // errors and added to the error array.

    // You can mix adding both arrays and errors directly.

    // Any type can be thrown from JavaScript. If can't be certain that the
    // error you caught is `instanceof Error`, simply wrap it in an array.

    // **TODO** Example of any type of error.

    // ## Callee

    // Sometime you want the stack trace to exclude the upper most stack frames.
    // This is useful when creating assertion functions where the top of the
    // stack trace should be the point where the assertion was called, not the
    // point where the assertion function created the exception.

    // To specify a callee you pass in an options object as the first argument
    // to the constructor.

    // **TODO** The code or message format is always required, but somtimes it
    // is not desired. If you want to specify that you do not want to use a code
    // nor a message pass in null. This is useful when you are overriding
    // properties

    // ## Named Arguments

    // Sometimes a one-liner gets too hard to read. Breaking up the declaration
    // across multiple lines helps, and while you're at it, you may as well give
    // a name to what you're trying to do.

    // ## Constructor Argument Order

    // We have an ambiguity in the way we call our constructor. We have both an
    // options object and a properties object. If you want to use an options
    // object but then override it with custom properties you have to ...

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

    // ## Assertions

    // If you're using Interrupt in your code would probably like to raise
    // assertions that are derived from `Interrupt` instead of using `assert`
    // and raising errors that are of type `AssertionError`.

    // Interrupt adds a simple boolean assertion function as a static class
    // member of the generated `Interrupt` derived exception class. You can use
    // this in lieu of the Node.js `assert` module. The exceptions you raise
    // will be consistent, the same type, with a code specific to your
    // application instead of `ERR_ASSERTION` and you can add context to your
    // assertions.

    //
    console.log('\n--- Interrupt assertions ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            NULL_ARGUMENT: 'the JSON string to parse must not be null',
            INVALID_TYPE: 'JSON must be a string, received: %(type)s',
            TOO_MUCH_JSON: 'JSON string must be less than %(MAX_LENGTH)s characters received: %(length)s',
            INVALID_JSON: 'unable to parse JSON string'
        })

        const MAX_LENGTH = 1024

        function parse (json) {
            ParseError.assert(json != null, 'NULL_ARGUMENT')
            ParseError.assert(typeof json == 'string', 'INVALID_TYPE', { type: typeof json })
            ParseError.assert(json.length < MAX_LENGTH, 'TOO_MUCH_JSON', { MAX_LENGTH, length: json.length })
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError('INVALID_JSON', error, { json })
            }
        }

        try {
            parse(1)
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.symbol, ParseError.INVALID_TYPE, 'symbol set')
            okay(error.code, 'INVALID_TYPE', 'code set')
            okay(error.type, 'number', 'type context set')
        }
    }
    //

    // Thie first argument to `.assert()` is a condition that must be truthy.
    // After the condition argument the assertion accepts all the of the same
    // arguments that the exception constructor accepts.

    // If the only argument after the assertion is a function it is interpreted
    // as a `callee`. It is used as an exception constructor function.

    // Sometimes context information requires some calculation so building the
    // context argument takes effort, effort that we throw away immediately if
    // the assertion doesn't fail.

    // This exception constructor function of which we speak can defer that
    // calculation. It will only be run if the condition fails.

    // We can rewrite our contrived example eliminating our contrived
    // calculations.

    //
    console.log('\n--- Interrupt assertions with deferred calculation ---\n')
    {
        const ParseError = Interrupt.create('ParseError', {
            NULL_ARGUMENT: 'the JSON string to parse must not be null',
            INVALID_TYPE: 'JSON must be a string, received: %(type)s',
            TOO_MUCH_JSON: 'JSON string must be less than %(MAX_LENGTH)s characters received: %(length)s',
            INVALID_JSON: 'unable to parse JSON string'
        })

        const MAX_LENGTH = 1024

        function parse (json) {
            ParseError.assert(json != null, 'NULL_ARGUMENT')
            ParseError.assert(typeof json == 'string', $ => $('INVALID_TYPE', { type: typeof json }))
            ParseError.assert(json.length < MAX_LENGTH, $ => $('TOO_MUCH_JSON', {
                MAX_LENGTH: MAX_LENGTH,
                length: json.length,
                difference: json.length - MAX_LENGTH
            }))
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError('INVALID_JSON', error, { json })
            }
        }

        try {
            parse(JSON.stringify('x'.repeat(1023)))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.symbol, ParseError.TOO_MUCH_JSON, 'symbol set')
            okay(error.code, 'TOO_MUCH_JSON', 'code set')
            okay(error.difference, 1, 'type context set')
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
                const handle = await Reader.Error.resolve2(fs.open(filename, 'r'), $ => $('UNABLE_TO_OPEN_FILE', { filename }))
                const stat = await Reader.Error.resolve2(handle.stat(), 'UNABLE_TO_STAT_FILE', { filename })
                const buffer = Buffer.alloc(stat.size)
                await Reader.Error.resolve2(handle.read(buffer, 0, buffer.length, 0), 'UNABLE_TO_READ_FILE', { filename })
                await Reader.Error.resolve2(handle.close(), 'UNABLE_TO_CLOSE_FILE', { filename })
                return buffer
            }
        }

        const reader = new Reader

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_OPEN_FILE', 'detailed catch blocks')
        }

        const source = await reader.read(__filename)
        okay(/hippopotomus/.test(source), 'found hippopotomus in source')
    }
    //

    // These function invocations will always be verbose, but they don't have to
    // be repetitive. If you use some of the same parameters in each call, you
    // can curry the function. If the first argument is an options object, code
    // string, code symbol or format message and not a function or `Promise`
    // then `reslove()` will return a function that operates exactly like
    // `resolve()` that will construct an exception with those arguments merged
    // with the arguments of the specific invocation.

    // **TODO** Tour of `options` and `voptions`.

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
                const resolver = Reader.Error.resolve2({}, { filename })
                const handle = await resolver(fs.open(filename, 'r'), $ => $('UNABLE_TO_OPEN_FILE'))
                const stat = await resolver(handle.stat(), $ => $('UNABLE_TO_STAT_FILE'))
                const buffer = Buffer.alloc(stat.size)
                await resolver(handle.read(buffer, 0, buffer.length, 0), $ => $('UNABLE_TO_READ_FILE'))
                await resolver(handle.close(), $ => $('UNABLE_TO_CLOSE_FILE'))
                return buffer
            }
        }

        const reader = new Reader

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(error.stack)
            console.log('')
            okay(error.code, 'UNABLE_TO_OPEN_FILE', 'detailed catch blocks')
        }

        const source = await reader.read(__filename)
        okay(/hippopotomus/.test(source), 'found hippopotomus in source')
    }
    //

    // Since Node.js 14 there stack traces are traced across `Promise`
    // resolutions (the microtask queue) but are still lost when entering the
    // Node.js event loop (the macrostask queue.) If your application is
    // targeted for Node.js 14 and above then you do not have to use the
    // deferred constructor to receive a stack trace that includes the
    // application file and line.

    // **TODO** No, talk about Node.js 12 versus 14 with the existing examples,
    // do not repeat them or refer back to them.

    //
    {
        /* and that example would go here, and `sprintf` is decided */
    }
    //

    // Error-first callback style programming continues to lose stack traces
    // even in the latest versions of Node.js. The call stack originates from
    // the Node.js event loop and usually terminates in the Node.js core
    // libraries or some dependent module. If you wrap the exception you will
    // get a stack that will at least include your callback so with wrapping you
    // can usually figure out the asynchronous call resulted in the error.

    // You can use one of the many long stack trace modules on NPM to get a full
    // stack trace but these are monkey patched modules that break frequently.
    // They also generate a stack trace for each asynchronous call in order to
    // preserve the call stack. This is an expensive operation and these modules
    // discourage their own use in production. **TODO** Out of order.

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
    //

    // Wrapping exceptions in this mannor can create a lot of additional
    // anonymous callbacks that exist only to wrap the callback. These become
    // difficult to unit test with complete coverage. We can create a helper
    // function that can perform the wrapping, unit test the wrapper separately,
    // eliminating these little branches throughout our code.

    //
    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        function wrap (callback, message, properties) {
            return function (...vargs) {
                if (vargs[0] != null) {
                    callback(new Reader.Error(message, vargs[0], properties))
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
                fs.readFile(filename, wrap(callback, 'UNABLE_TO_READ_FILE', { filename }))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
                console.log('')
                okay(error.code, 'UNABLE_TO_READ_FILE', 'code set')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
    //

    // But now the originating application file and line number are missing from
    // our stack trace. Our stack trace will pass through our wrapper function,
    // not through the function that called the wrap function. That call has
    // already returned. In order to poke back into the function that called the
    // wrapper function we use an error constructor callback. It will poke back
    // inot the function that called the wrapper function, ususally at the file
    // and line (but not the character position) where the wrapper was called.

    //
    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        function encase (callback, message, properties) {
            return function (...vargs) {
                function constructor (message) {
                    return new Reader.Error({ callee: constructor }, message, vargs[0], properties)
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
                fs.readFile(filename, encase(callback, $ => $('UNABLE_TO_READ_FILE', { filename })))
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
    //

    // This is how we get an useful stack trace without using long stack traces
    // modules. It is useful because it contains a file and line number from our
    // application that directly references where the asynchronous call
    // originated.

    //
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
                okay(error.code, 'UNABLE_TO_READ_FILE', 'code set')
                okay(error.errors[0].code, 'ENOENT', 'nested code set')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
    //

    // The stack trace is useful but incomplete, it is not a full stack trace.
    // If we repeat the wrapper process for each asynchronous call, however, it
    // gets to be more complete, but not contiguous.

    //
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

            async load (filename, callback) {
                this.read(filename, Reader.Error.callback($ => $('UNABLE_TO_READ_FILE', { filename }), (error, body) => {
                    if (error) {
                        callback(error)
                    } else {
                        callback(JSON.parse(body.toString()))
                    }
                }))
            }
        }

        const reader = new Reader

        reader.load(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(error.stack)
                console.log('')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
    //
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
