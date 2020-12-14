// # Interrupt

// **TODO** Currently making a pass to fix the English, also organize the
// sections so that they build on each. Will follow with pass to ensure that all
// the unit tests (calls to `okay`) have meaningful descriptions. Look for a
// **TODO** that indicates where you left off on the first pass.

// Exceptions are nice. I like the concept. I've always done my best to employ
// them in JavaScript and Node.js but it isn't always easy.

// Interrupt is a module I created to address the problems with JavaScript's
// limited exception mechanism, solving the numerous challenges I've encountered
// that I'm sure you've encountered as well. It is not an elegant solution, but
// it is a solution none the less.

// ## Advocacy

// Interrupt allows you to get exceptions that have a file name and line number
// from your program, instead of a stubby stack trace that points to the
// wilderness of the Node.js source, or [no stack trace at
// all](https://github.com/nodejs/node/issues/30944). It does this with some
// syntactical struggle, but without the expensive superfluous stack trace
// generation of the long stack trace modules.

// Interrupt allows you to nest exceptions so you can provide application
// context to system and library exceptions.

// Interrupt allows you to cite multiple nested exceptions as the cause of your
// contextual exception which is necessary if you're doing any sort of parallel
// asynchronous programming where multiple parallel paths can raise exceptions.

// Interrupt uses and abuses the `Error.stack` property provided by Google V8 to
// generate an elaborate report from `Error.stack` including the `Error` type,
// message, context properties, and stack trace along with the error messages
// and stack traces of all the nested errors.

// Interrupt's elaborate `Error.stack` is machine readable so you could
// conceivably process these stack traces programmatically after gathering them
// from production logs.

// Interrupt can report it's elaborate stack trace de-duped with a count of
// similar exceptions so that when great many parallel operations raise the same
// exception you don't have wade through the repetitive stack traces to see if
// there is anything unique about one of them.

// Interrupt endeavours to do all this with a minimum of extra code and code
// paths so you can format exception messages with `sprintf-js`, set properties,
// specify nested expressions the constructor, often as a one-liner. **TODO**
// Basically advocating one-liners, poorly worded.

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
require('proof')(200, async okay => {
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

    // In some our examples we're going to pretent to load a config file. Here
    // we create a temporary directory with some good configs and some bad
    // configs.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const tmp = path.join(__dirname, 'tmp')

        await fs.rmdir(tmp, { recursive: true })
        await fs.mkdir(path.join(tmp, 'eisdir', 'config.json'), { recursive: true })
        await fs.mkdir(path.join(tmp, 'enoent'))
        await fs.mkdir(path.join(tmp, 'good'))
        await fs.mkdir(path.join(tmp, 'bad'))
        await fs.mkdir(path.join(tmp, 'create'))

        await fs.writeFile(path.join(tmp, 'good', 'config.json'), JSON.stringify({
            settings: {
                volume: 0
            }
        }))

        await fs.writeFile(path.join(tmp, 'bad', 'config.json'), '!')
    }
    //

    // All of the examples in this code are _contrived_, and in practice, I'm
    // never quite this zealous with my use of exceptions or Interrupt.

    // ## Happy Path vs Error Path

    // Throughout we'll be referring to the happy path and the error path.

    // The happy path is the path of code execution where everything goes as
    // expected. It is the code path that gets the most exercise, the path that
    // receives the most robust testing.

    // The error path is the path of code excution that is followed when things
    // go sideways. One would hope that the error path is not often executed
    // during normal operation. One would expect the error path to be followed
    // as a result unforseen circumstances that might not have been considered
    // during development. Sadly, the error path usually does not receive a lot
    // of testing. One should tread lightly on the error path.

    // Interrupt endevours to be exacting on the happy path and accommodating on
    // error path. It has a lot of assertions on functions that are executed
    // during normal operation and a lot of fallbacks on the functions that are
    // executed during exception handling.

    // When we speak of the error path in this documenation, we are urging
    // caution and justifing our accommodations. When we speak of the happy path
    // in this documentation we are urging rigor and justifying our assertions.

    // ## Errors by Code

    // Errors in JavaScript have very little context information. The only
    // properties defined by the spec are `name` and `message`.

    // **TODO** As of this writing, Interrupt is targeted for Node.js and Google
    // V8 only, but can probably be ported to other JavaScript engines if
    // someone would like to recommend a cross-browser development setup. I'm
    // open to porting if someone is interested.

    // The `message` is supposed to be human readable and because of this it
    // doesn't serve well as a programmatic indication of error type.

    //
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
            console.log(`${error.stack}\n`)
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

    // In the example above we had to use a regular expression on the human
    // readable message to recover from a file I/O error. We cannot use an
    // equality test because the message contains the file name which is
    // variable. It is not reassuring to see these fuzzy conditions on the error
    // path. Someone could break our code by rewording their error message.

    // One way to add rigorous error type information is to create multiple
    // error types. This is what they taught you to do when you first learned
    // about exceptions; create an exception taxonomy.

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
            console.log(`${error.stack}\n`)
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

    // Other languages have the ability to catch an exception by type. This
    // ability to catch by type is where the idea for an exception class for
    // each type of error comes from.

    // JavaScript does not have this ability. Once the exception is caught it
    // must be filtered through an `if`/`else` ladder with `instanceof` to
    // determine the type of exception. Using entire classes for what is
    // essentially a flag is a heavyweight approach. The user now has to import
    // the module's exceptions into the namespace of their application to use
    // them as test conditions. Not only do we have to add this `if`/`else`
    // ladder, we have to our `require` statements start to look like this.

    // ```javascript
    // const {
    //     ConfigParseError,
    //     ConfigIOError,
    //     loadJSONConfiguration
    // } = require('./config')
    // ```

    // This is so foreign to JavaScript, to use type information directly,
    // instead of using ploymorphism. Kinda feels like we're moving the
    // internals of a dependency into our module to check a flag.

    // Node.js itself doesn't extend the error class heirarchy by much.  In
    // fact, in our code we further test the cause of the I/O error by checking
    // a `code` property to see if it is a `ENOENT`, the POSIX code for a
    // missing file.

    // The Node.js libraries use a base `Error` class (with the exception of the
    // `assert` module) and simply set a `code` on the error object. All of the
    // errors eminating from the standard Node.js modules have a `code` property
    // and each `code` property has associated documentation.

    // If you use codes your module can adhere to this practice.

    //
    console.log('\n--- errors using codes ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        async function loadJSONConfiguration (filename) {
            let json
            try {
                json = await fs.readFile(filename, '')
            } catch (error) {
                const e = new Error('file unreadable: ' + filename)
                e.code = 'IO_ERROR'
                e.cause = error
                throw e
            }
            let config
            try {
                config = JSON.parse(json)
            } catch (error) {
                const e = new Error('unable to parse configuration')
                e.code = 'PARSE_ERROR'
                throw e
            }
            if (config == null || typeof config != 'object' || Array.isArray(object)) {
                const e = new Error('JSON must be an object')
                e.code = 'FORMAT_ERROR'
                throw e
            }
            if (config.size == null) {
                const e = new Error('required parameter missing: memory')
                e.code = 'CONFIG_PARAM_MISSING'
                throw e
            }
            if (typeof config.size == 'number') {
                const e = new Error('required parameter wrong type: memory')
                e.code = 'CONFIG_PARAM_INVALID_TYPE'
                throw e
            }
            return config
        }

        let config
        try {
            config = await loadJSONConfiguration(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(`${error.stack}\n`)
            if (error.code == 'IO_ERROR'  && error.cause.code == 'ENOENT') {
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

    // Interrupt prefers to use codes as well. Interrupt encourages you to
    // create a set of error codes for your module.

    // You can still create an Error object heirarchy using Interrupt, but once
    // you have a set of codes you start to see how they're easier to work with.

    // You declare your codes when you create your Interrupt derived class. You
    // can obtain a list of declared codes using the static `codes` property.

    // In the example below we declare a `ConfigError` class with an object
    // that maps the error codes to an error message. We can get a list of the
    // codes defined using the `codes` property of the generated class.

    //
    {
        okay(Interrupt.prototype instanceof Error, '`Interrupt` is an `Error`')

        const ConfigError = Interrupt.create('ConfigError', {
            IO_ERROR: 'unable to read config file',
            PARSE_ERROR: 'unable to parse config file'
        })

        const codes = ConfigError.codes
        okay(codes.sort(), [ 'IO_ERROR', 'PARSE_ERROR' ], 'set of generated error codes')

        okay(typeof ConfigError.IO_ERROR, 'symbol', 'constants that map a generated error code name to a code symbol')
        okay(typeof ConfigError.PARSE_ERROR, 'symbol', 'one for each error code')

        okay(ConfigError.prototype instanceof Interrupt, 'generated error is an `Interrupt`')

        okay(ConfigError.prototype instanceof Error, 'generated error is therefore also an `Error`')
    }
    //

    // Furthermore, Interrupt discourages the use of the `message` property
    // programmatically. In fact, Interrupt hijacks the `message` in order to
    // add the enumerable properties and nested error stack traces to the
    // `message` so that they will appear in `error.stack`.

    // Hijacking sounds bad, I know, but jamming all the report information into
    // the `message` means it will appear in `stack`. Becuase it always appears
    // in `stack` any facility that dumps `stack` will get the entire report
    // without any special knowledge of Interrupt.

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
            console.log(`${error.stack}\n`)
            okay(error.code, 'NULL_ARGUMENT', 'error code is set')
        }
    }
    //

    // Error messages are really for debugging, aren't they? They're not really
    // for displaying error messages to an end user. If we really wanted a
    // facility to display messages to the user, certianly we'd want one that
    // supports internationalization. We'd want string tables and we'd want to
    // solicit translations from open source contributors. We wouldn't want all
    // that complexity built into the error path of our application at every
    // level of the call stack.

    // Okay, that's a bit much, but I always dump `error.stack` and rarely dump
    // `error.message`, and we have a way to get just the message if that's all
    // you need.

    // If you want to get the just the message for display purposes you can use
    // the static `Interrupt.message()` method.

    //
    console.log('\n--- obtain just the message from an Interrupt error ---\n')
    {
        const invalid_argument = 'the JSON string to parse must not be null'

        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string',
            NULL_ARGUMENT: invalid_argument
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
            console.log(`${Interrupt.message(error)}\n`)
            okay(new ParseError('INVALID_JSON').message != invalid_argument, 'error message has added context information')
            okay(Interrupt.message(error), invalid_argument, 'get error message')
        }
    }
    //

    // The `Interrupt.message()` method is safe to use with any `Error`.

    //
    {
        const invalid_argument = 'the JSON string to parse must not be null'

        const ParseError = Interrupt.create('ParseError', {
            INVALID_ARGUMENT: invalid_argument
        })

        const interrupt = new ParseError('INVALID_ARGUMENT')

        okay(interrupt.message != invalid_argument, 'message has added context')
        okay(Interrupt.message(interrupt), invalid_argument, 'get raw plain error message')

        const error = new Error(invalid_argument)

        okay(error.message, invalid_argument, 'error is as expected')
        okay(Interrupt.message(error), invalid_argument, 'message getter works with plain `Error`s')
    }
    //

    // Additionally, You can still test against the `message` property using a
    // regular expression. A single line message will appear alone on the first
    // line of the `message` property. You can match the entirety of the first
    // line with a multi-line regular expression.

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
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'NULL_ARGUMENT', 'no code found, use first argument as message')
            okay(!('code' in error), 'no code is set')
        }
    }
    //

    // This means you can just use an Interrupt derived error directly without
    // code if you so choose, but I really like codes.

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
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'the JSON string to parse must not be null', 'specify message as first argument instead of code')
            okay(!('code' in error), 'no code is set')
        }
    }
    //

    // You can pass in a code followed by message to override the default
    // message for the code. This is useful when you use a generic code like
    // `INVALID_ARGUMENT` but you want to details about the specific error.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            IO_ERROR: 'unable to read file',
            PARSE_ERROR: 'unable to parse file'
        })

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('IO_ERROR', 'unable to read dir')
            }
            const files = []
            for (const file of dir) {
                let body
                try {
                    body = fs.readFile(path.join(dir, file), 'utf8')
                } catch (error) {
                    throw new ConfigError('IO_ERROR')
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
        }
    }
    //

    // Codes are less ambiguous than using `message` to determine the type of
    // error. Codes are not liable to change, easier to document and if you do
    // make changes to code, it is easier to document the change and document
    // the deprecation of the old code name.

    // **TODO** A second on renaming codes. Maybe deprecation warnings are part
    // of the audit? User could add a `deprecated` flag.

    // Codes become entirely unambiguous when you use a `Symbol`.

    // Every code you define for your generated Interrupt class will have an
    // associated `Symbol`.

    // The generated error class has a property named for every code you defined
    // in your call to `Interrupt.create()`. The property name is the code name
    // and the value is a `Symbol`. By default, the `Symbol` is unique for the
    // code.

    // When you construct an interrupt derived error it sets a non-enumerable
    // `symbol` property on the exception instance with the associated `Symbol`
    // for the code as its value. This is set in addition to the code.

    // Now you can test the exception type by an unambiguous `Symbol`.

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
            console.log(`${error.stack}\n`)
            okay(error.symbol === ParseError.INVALID_JSON, 'symbol is set')
        }
    }
    //

    // Becuase the `symbol` property is a non-enumerable property of the
    // generated error, it is not printed in the properties section of the stack
    // trace message. It is already represented by the `code` string. The code
    // string is somewhat ambiguous, but we would not able parse and restore a
    // symbol without having to make the same assumptions. This is, a `Symbol`
    // cannot be serialized so we'd have to serialize the `toString()` value
    // which is as ambiguous as the string code. We skip it so that the stack
    // trace report is not so chatty and redundant.
    //
    // You can also specify the code by symbol. Instead of passing the string
    // name of the code you pass in the symbol for the code.

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
            console.log(`${error.stack}\n`)
            okay(error.symbol === ParseError.INVALID_JSON, 'symbol is set')
        }
    }
    //

    // Because symbols are unique if we use the same code names in two
    // different exception classes we can distinguish the type symbol.

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
            console.log(`${error.stack}\n`)
            okay(error.symbol === JSONError.INVALID_JSON, 'invalid JSON error rethrown')
        }
    }
    //

    // In the contrived example above our CSV parser raises exceptions using a
    // Symbol to specify the code, the JSON parser uses strings to specify the
    // code. It doesn't matter the `symbol` property is set either way. In our
    // catch block we use a switch statement to distinguish between a
    // CSV `NULL_ARGUMENT` code and a JSON `NULL_ARGMENT` code.

    // You can start to see how symbols and a `switch` statement can make for a
    // clean catch block that starts to look like the catch error by type
    // facility in other languages.

    // Without the `symbol` property we'd have to compare both the `code`
    // property and test the `instanceof` the `error` to see if was a `CSVError`
    // or a `JSONError`.


    // **TODO** Got into the rough draft below, but should restart here. Seems
    // like there is more code discussion below, probably so that we could
    // introduce code prototypes after talking about properties.

    // **TODO** We probably need sub-headings.

    // **TODO** Move this up above symbols.

    // **TODO** Additional codes.

    // They are somewhere else, but you seem to believe they belong here. Maybe
    // they do, but the code definition function is really only useful when you
    // want to define additional code properties.

    //
    {
    }
    //

    // ## Exception Properties

    // Ordinarily, setting properties on an error means constructing the error,
    // then assigning the properties individually before throwing the error.

    // Here we set a `filename` property on an `Error` before throwing.

    //
    console.log('\n--- setting properties on an `Error` ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        async function read (filename) {
            try {
                return await fs.readFile(filename)
            } catch (error) {
                const e = new Error('unable to read file')
                e.filename = filename
                throw e
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.filename, filename, 'filename property set')
        }
    }
    //

    // With Interrupt you can set properties by specifying an object whose
    // properties will set on the exception in the constructor. This means you
    // can throw exceptions with additional properties in a one-liner.

    //
    console.log('\n--- setting properties with an `Interrupt` constructor ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ReaderError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function read (filename) {
            try {
                return await fs.readFile(filename)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'FILE_READ_ERROR', 'code set')
            okay(error.filename, filename, 'filename property set')
        }
    }
    //

    // The properties set on the constructed exception are always
    // non-enumerable. This is because Node.js has developed this annoying habit
    // of dumping enumberable properties after the stack trace using
    // `util.inspect()`. This is annoying because we already dumped the
    // properties using JSON which we can parse post-mortem.

    // We can't parse `util.inspect()` output, so we won't be deferring to
    // Node.js on this one. We're going to defeat it. We do this by making all
    // of the properties non-enumerable. You can't dump what you can't see.

    //
    console.log('\n--- error properties are non-enumerable ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ReaderError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function read (filename, encoding) {
            try {
                return await fs.readFile(filename, encoding)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename, encoding })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename, 'utf8')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'FILE_READ_ERROR', 'properties property example code set')
            okay(error.filename, filename, 'error property enumerability example filename property set')
            okay(error.encoding, 'utf8', 'error property enumerability example encoding property set')
            okay(Object.keys(error), [], 'no enumerable properties in error')
            okay('code' in error, 'remember that the in operator works on non-enumerable properties')
            okay(Object.getOwnPropertyNames(error).sort(), [
                'code', 'encoding', 'errors', 'filename', 'message', 'name', 'properties', 'stack', 'symbol'
            ], 'all of the error properties regardless of enumerability')
        }
    }
    //

    // You can see that the `in` operator still works with non-enumerable
    // properties, so you'll be able to check to see if a property is present.

    // You won't be able to iterate over the properties in an error unless you
    // use `Object.getOwnPropertyNames()`. Using destructure to copy attempting
    // to serialize using JSON will create an empty object.

    // We also provide a copy of all the properties with their enumerability
    // preserved in the `properties` property.

    //
    console.log('\n--- using the enumerable properties property ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ReaderError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function read (filename, encoding) {
            try {
                return await fs.readFile(filename, encoding)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename, encoding })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename, 'utf8')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'FILE_READ_ERROR', 'properties property example code set')
            okay(error.properties.filename, filename, 'properties property example filename property set')
            okay(error.properties.encoding, 'utf8', 'properties property example encoding property set')
            okay(Object.keys(error), [], 'no enumerable properties in error')
            okay(Object.keys(error.properties).sort(), [ 'code', 'encoding', 'filename' ], 'all of the enumerable properties')
            okay(Object.getOwnPropertyNames(error.properties).sort(), [
                'code', 'encoding', 'errors', 'filename', 'message', 'name', 'symbol'
            ], 'all of the properties on the properties property regardless of enumerability (stack and properties are excluded)')
        }
    }
    //

    // The `properties` property is serializable with JSON, can be copied with
    // destructuring, and the enumerable properties comprise the output see in
    // the stack trace.

    // While all the properties on the error are always non-enumerable,  the
    // enumerability of the properties in the properties `property` is
    // determined by the enumerability of the property in the properties object
    // given to the constructor.

    // Any property that is non-enumerable in the properties object given to the
    // constructor will be non-enumberable in the `properties` property.

    // Furthermore, non-enumberable properties in the `properties` property will
    // not be displayed in the stack trace.

    //
    console.log('\n--- non-enumerable properties hidden from stack trace  ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ReaderError', {
            FILE_READ_ERROR: 'unable to read file'
        })

        async function read (filename, encoding) {
            try {
                return await fs.readFile(filename, encoding)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', Object.defineProperties({}, {
                    filename: { value: filename, enumerable: true },
                    encoding: { value: encoding, enumerable: false }
                }))
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename, 'utf8')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'FILE_READ_ERROR', 'non-enumerable properties example code set')
            okay(error.filename, filename, 'non-enumerable properties example filename property set')
            okay(error.encoding, 'utf8', 'non-enumberable encoding property set')
            okay(Object.keys(error), [], 'non-enumerable properties no enumerable properties in error')
            okay(Object.keys(error.properties).sort(), [ 'code', 'filename' ], 'non-enumerable trait of property preserved in properties')
            okay(error.properties.encoding, 'utf8', 'non-enumerable encoding in properties property')
        }
    }
    //

    // Because non-enumerable properties do not appear in the stack trace, they
    // are particularly useful if you want to set a property with a value that
    // would be poorly represented in the stack trace. Symbols do not serialize
    // nicely, so you may choose to suppress a `Symbol` flag from stack trace
    // output.

    // We're about to talk about how you shouldn't be passing application data
    // around in exceptions so we're not suggesting that you throw exceptions
    // with large object trees properties or `Buffer` properties. In fact, we're
    // going to really bang on about it for a bit.

    // Properties should primarily be used for reporting. Only codes and other
    // flags should be acted upon in a catch block.

    // In this example we use the `error.filename` property as an argument to
    // `readOrCreate` when we retry our read.

    //
    console.log('\n--- the bad practice of using exception properties in application logic ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            DIRECTORY_MISSING: 'directory cannot be found',
            IO_ERROR: 'unable to read directory'
        })

        async function read (dirname) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                if (error.code == 'ENOENT') {
                    throw new ReaderError('DIRECTORY_MISSING', { dirname })
                }
                throw new ReaderError('IO_ERROR', { dirname })
            }
        }

        async function readOrCreate (dirname) {
            try {
                return await read(dirname)
            } catch (error) {
                if (error.code == 'DIRECTORY_MISSING') {
                    try {
                        await fs.mkdir(error.dirname, { recursive: true })
                    } catch (error) {
                        console.log(error.stack)
                        throw new ReaderError('IO_ERROR', { dirname: error.dirname })
                    }
                    return await read(error.dirname)
                }
            }
        }

        const dirname = path.join(__dirname, 'tmp', 'create', 'one')

        okay(await readOrCreate(dirname), [], 'created a missing directory')
    }
    //

    // There are many reasons why this is bad.

    // Catch blocks that perform recovery should not be at the root of the call
    // stack. They should be as close to the source of the error as possible and
    // they should be able to perform any recovery using the variables visible
    // within the scope of the catch block. There should be no need for a
    // catch block that is responding to an error to retrieve the arguments it
    // used to call the function from the properties of the thrown exception.

    // If you do this, you're now treating your exceptions as if they where a
    // part of your interface. If someone decides they don't like having the
    // directory reported, or they decide to rename the `dirame` property to
    // `directoryName` the code will break.

    // Instead, admonish your users not to use these properties, they are for
    // context in the stack trace only, except for the error code.

    //
    console.log('\n--- use the variables in scope in your catch block instead ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            DIRECTORY_MISSING: 'directory cannot be found',
            IO_ERROR: 'unable to read directory'
        })

        async function read (dirname) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                if (error.code == 'ENOENT') {
                    throw new ReaderError('DIRECTORY_MISSING', { dirname })
                }
                throw new ReaderError('IO_ERROR', { dirname })
            }
        }

        async function readOrCreate (dirname) {
            try {
                return await read(dirname)
            } catch (error) {
                if (error.code == 'DIRECTORY_MISSING') {
                    try {
                        await fs.mkdir(dirname, { recursive: true })
                    } catch (error) {
                        throw new ReaderError('IO_ERROR', { dirname })
                    }
                    return await read(dirname)
                }
            }
        }

        const dirname = path.join(__dirname, 'tmp', 'create', 'two')

        okay(await readOrCreate(dirname), [], 'created a missing directory')
    }
    //

    // Now the catch block is only dependent on the error for the error code,
    // essentially the error type information. It uses the same dirname
    // variable it used to initial the exceptional function call to recover.

    // The exception to this rule is additional error flags that may help a
    // developer resolve an internal state. We might pass the POSIX error code
    // onto the user.

    //
    console.log('\n--- immutable laws of programming are always flexible ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            IO_ERROR: 'unable to read directory'
        })

        async function read (dirname) {
            try {
                return await fs.readdir(dirname)
            } catch (error) {
                throw new ReaderError('IO_ERROR', { dirname, posixCode: error.code  })
            }
        }

        async function readOrCreate (dirname) {
            try {
                return await read(dirname)
            } catch (error) {
                if (error.code == 'IO_ERROR' && error.posixCode == 'ENOENT') {
                    try {
                        await fs.mkdir(error.dirname, { recursive: true })
                    } catch (error) {
                        throw new ReaderError('IO_ERROR', { dirname, posixCode: error.code })
                    }
                    return await read(error.dirname)
                }
            }
        }

        const dirname = path.join(__dirname, 'tmp', 'create', 'three')

        okay(await readOrCreate(dirname), [], 'created a missing directory')
    }
    //

    // Actually, how about we don't make a rule? If I'm sounding opinionated
    // it's simply that I don't want you, dear reader, to mistakenly think that
    // Interrupt is encouraging you to migrate your application code into the
    // catch blocks. Interrupt is all about reporting. Exceptions are tricky on
    // a good day. The error path is fraught with peril. Try to keep your
    // application logic out of it if you can.

    // In addition to setting properties at construction, you can assign default
    // properties by code.

    // When defining a code using `Interrupt.create()`, a format message for the
    // value of code map, you use an object. The properties of that object will
    // be set on the exception when it is created with the code. The `message`
    // property of the object will be used as the exception message.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            CONFIG_IO_ERROR: {
                fallback: true,
                message: 'unable to read file'
            },
            CONFIG_PARSE_ERROR: {
                message: 'unable to parse JSON'
            }
        })

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('CONFIG_IO_ERROR', { filename })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('CONFIG_PARSE_ERROR', { filename })
            }
        }

        async function loadOrFallback (filename) {
            try {
                return await load(filename)
            } catch (error) {
                if (error.fallback) {
                    return {}
                }
                throw error
            }
        }

        const filename = path.join(__dirname, 'tmp', 'missing')

        okay(await loadOrFallback(filename), {}, 'caught using a default property')

        console.log('\n--- catch an error with a default property ---\n')
        try {
            await load(filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'CONFIG_IO_ERROR', 'default property code set')
            okay(error.fallback, 'default property set')
        }

        try {
            await load(path.join(__dirname, 'tmp', 'bad', 'config.json'))
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.code, 'CONFIG_PARSE_ERROR', 'no default property code set')
            okay(!error.fallback, 'no default property property not set')
        }
    }
    //

    // **TODO** Now we're talking about codes again. Shouldn't this be above?

    // Once you've started to use codes you may find that one code per error is
    // not enough. You may want to have additional codes to classify errors.

    // You can define additional codes with no message or properties by
    // specifying them as strings in the call to `Interrupt.create()`.

    //
    console.log('\n--- define additional message-less error codes string by string ---\n')
    {
        const fs = require('fs').promises
        const path = require('path')

        const ConfigError = Interrupt.create('ConfigError', {
            'READ_FILE_ERROR': 'unable to read file',
            'PARSE_ERROR': 'unable to parse JSON'
        }, 'SUBSYSTEM_IO', 'SUBSYSTEM_CONFIG')

        okay(typeof ConfigError.SUBSYSTEM_CONFIG, 'symbol', 'additional code created')

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('CONFIG_IO_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_IO })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('CONFIG_PARSE_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_CONFIG  })
            }
        }

        try {
            await load(path.join(__dirname, 'tmp', 'missing.json'))
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.subsystem, ConfigError.SUBSYSTEM_IO, 'additional symbol code property set')
        }
    }
    //

    // These additional codes can also be specified as an array.

    // Once you've started to use codes you may find that one code per error is
    // not enough. You may want to have additional codes to classify errors.

    // You can define additional codes with no message or properties by
    // specifying them as strings in the call to `Interrupt.create()`.

    //
    console.log('\n--- define additional message-less error codes string by string ---\n')
    {
        const fs = require('fs').promises
        const path = require('path')

        const ConfigError = Interrupt.create('ConfigError', {
            'READ_FILE_ERROR': 'unable to read file',
            'PARSE_ERROR': 'unable to parse JSON'
        }, 'SUBSYSTEM_IO', 'SUBSYSTEM_CONFIG')

        okay(typeof ConfigError.SUBSYSTEM_CONFIG, 'symbol', 'additional code created')

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('CONFIG_IO_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_IO })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('CONFIG_PARSE_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_CONFIG  })
            }
        }

        try {
            await load(path.join(__dirname, 'tmp', 'missing.json'))
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.subsystem, ConfigError.SUBSYSTEM_IO, 'additional symbol code property set')
        }
    }
    //

    // You can also define additional codes as an array of strings. Instead of
    // passing in a straight up array, though, I like to split a string so that
    // maintaining the list is easier.

    //
    console.log('\n--- define additional message-less error codes string by string ---\n')
    {
        const fs = require('fs').promises
        const path = require('path')

        const ConfigError = Interrupt.create('ConfigError', {
            'READ_FILE_ERROR': 'unable to read file',
            'PARSE_ERROR': 'unable to parse JSON'
        }, `
            SUBSYSTEM_IO
            SUBSYSTEM_CONFIG
        `.trim().split(/\s\s*/g))

        okay(typeof ConfigError.SUBSYSTEM_CONFIG, 'symbol', 'additional code created')

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('READ_FILE_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_IO })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('PARSE_ERROR', { filename, subsystem: ConfigError.SUBSYSTEM_CONFIG  })
            }
        }

        try {
            await load(path.join(__dirname, 'tmp', 'missing.json'))
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.subsystem, ConfigError.SUBSYSTEM_IO, 'additional symbol code property set')
        }
    }
    //

    // Lastly you can define codes using a function. The function must return
    // either a code object map, a code array, a code string or anther code
    // function. The function will receive as its only argument of map of code
    // name strings to the code symbols for the codes defined by any previous
    // code declarations in the parameter list.

    // With this we are able to define a default property with a code symbol
    // value using codes we've defined in the constructor.

    //
    console.log('\n--- define additional message-less error codes string by string ---\n')
    {
        const fs = require('fs').promises
        const path = require('path')

        const ConfigError = Interrupt.create('ConfigError', [
            'SUBSYSTEM_IO', 'SUBSYSTEM_CONFIG'
        ], function ({ Codes }) {
            return {
                'READ_FILE_ERROR': {
                    message: 'unable to read file',
                    subsystem: Codes['SUBSYSTEM_IO'].symbol
                },
                'PARSE_ERROR': {
                    message: 'unable to parse JSON',
                    subsystem: Codes['SUBSYSTEM_CONFIG'].symbol
                }
            }
        })

        okay(typeof ConfigError.SUBSYSTEM_CONFIG, 'symbol', 'additional code created')

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('READ_FILE_ERROR', { filename })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('PARSE_ERROR', { filename })
            }
        }

        try {
            await load(path.join(__dirname, 'tmp', 'missing.json'))
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.subsystem, ConfigError.SUBSYSTEM_IO, 'additional symbol code property set')
        }
    }
    //

    // An interesting property of the codes map given to a code function is that
    // the `code` property is enumerable and the `symbol` property is not.
    //
    // **TODO** Would I use this and why dishearten the user with this sort of
    // thing? Simply suggest that they use a single symbol. I suppose it was for
    // the sake of output. Perhaps a `toJSON` method?
    //
    // Can't find a way. The only thing that bothers me about this is that
    // you'll display a symbol in the stack trace instead of a string and it
    // won't turn back into a string when you parse. Seems dubious. This is
    // such a triviality, I shouldn't make such a big deal of it.
    //
    // Not sure that naming it `'string'` is such a great idea. Using a
    // `toJSON()` changes the shape of the object.
    //
    // **TODO** Okay, this is now the silliest bit. Don't overthink it.
    //
    // Because Interrupt uses JSON to serialize properties, and because JSON
    // will only serialize enumerable properties, this means that if you use
    // this object as the value of a default property, the code will be
    // serialized in the stack trace, but the symbol will not.

    //
    {
        const fs = require('fs').promises
        const path = require('path')

        const ConfigError = Interrupt.create('ConfigError', [
            'SUBSYSTEM_IO', 'SUBSYSTEM_CONFIG'
        ], function ({ Codes }) {
            return {
                'READ_FILE_ERROR': {
                    message: 'unable to read file',
                    subsystem: Interrupt.Code(Codes['SUBSYSTEM_IO'])
                },
                'PARSE_ERROR': {
                    message: 'unable to parse JSON',
                    subsystem: Interrupt.Code(Codes['SUBSYSTEM_CONFIG'])
                }
            }
        })

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('READ_FILE_ERROR', { filename })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('PARSE_ERROR', { filename })
            }
        }
        const error = new ConfigError('READ_FILE_ERROR')

        try {
            await load(path.join(__dirname, 'tmp', 'missing.json'))
        } catch (error) {
            console.log(`\n${error.stack}\n`)
            okay(error.subsystem.code, 'SUBSYSTEM_IO', 'additional code property set')
            okay(error.subsystem.symbol, ConfigError.SUBSYSTEM_IO, 'additional symbol code property set')
            okay(JSON.stringify(error.subsystem), '{"code":"SUBSYSTEM_IO"}', 'only code is serialized')
        }
    }
    //

    // This esoteric behavior is there for you to abuse in your own programs.
    // The end user might notice that the symbol goes missing if they JSON
    // serialize the value themselves, but such are the mysteries of exception
    // handling with its many non-enumerable properties.

    // If you've made it this far, you may have noticed that we tend to use
    // `switch` statements with codes in our catch blocks. This is nice because
    // it starts to look like the sort of catch by type facility you see in
    // other languages. However, it is not type safe the way that it is in other
    // languages.

    // The code below will fall back to a default configuration if it has any
    // trouble reading from the filesystem, but if it gets a back configuration
    // it will rethrow the error.

    // It has a subtle bug that is on the error path.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            DIRECTORY_READ_ERROR: 'unable to read directory',
            FILE_READ_ERROR: 'unable to read file'
        })

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('DIRECTORY_READ_ERROR', 'unable to read dir', { dirname })
            }
            const configs = []
            for (const file of dir) {
                const filename = path.join(dirname, file)
                let body
                try {
                    body = await fs.readFile(filename, 'utf8')
                } catch (error) {
                    throw new ConfigError('FILE_READ_ERROR', { filename })
                }
                try {
                    console.log(body)
                    configs.push(JSON.parse(body))
                } catch (error) {
                    throw new ConfigError('FILE_PARSE_ERROR')
                }
            }
            return configs
        }

        async function loadConfigsFallback (dirname) {
            try {
                return await loadConfigs(dirname)
            } catch (error) {
                switch (error.symbol) {
                 // _Spelling error._
                case ConfigError.DIRECTROY_READ_ERROR:
                case ConfigError.FILE_READ_ERROR:
                    return [{ settings: { volume: 0 } }]
                default:
                    throw error
                }
            }
        }

        // _We expect a missing directory to result in a default but..._
        try {
            await loadConfigsFallback(path.join(__dirname, 'tmp', 'missing'))
        } catch (error) {
            // _... the error was rethrown._
            console.log(`${error.stack}\n`)
            okay(error.code, 'DIRECTORY_READ_ERROR', 'we didn\'t want this to be thrown')
        }
    }
    //

    // The same code object with a string `code` property an a non-enumerable
    // `symbol` property is returned from the static `codes()` function in the
    // generated `Interrupt` class.

    // If we use this object in our switch statements, we only need to unit test
    // one case out of a set of cases to know that all the cases in the switch
    // statement are defined.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            DIRECTORY_READ_ERROR: 'unable to read directory',
            FILE_READ_ERROR: 'unable to read file'
        })

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('DIRECTORY_READ_ERROR', 'unable to read dir', { dirname })
            }
            const configs = []
            for (const file of dir) {
                const filename = path.join(dirname, file)
                let body
                try {
                    body = await fs.readFile(filename, 'utf8')
                } catch (error) {
                    throw new ConfigError('FILE_READ_ERROR', { filename })
                }
                try {
                    console.log(body)
                    configs.push(JSON.parse(body))
                } catch (error) {
                    throw new ConfigError('FILE_PARSE_ERROR')
                }
            }
            return configs
        }

        async function loadConfigsFallback (dirname) {
            try {
                return await loadConfigs(dirname)
            } catch (error) {
                switch (error.symbol) {
                 // _Spelling error._
                case ConfigError.code('DIRECTROY_READ_ERROR').symbol:
                case ConfigError.code('FILE_READ_ERROR').symbol:
                    return [{ settings: { volume: 0 } }]
                default:
                    throw error
                }
            }
        }

        // _We expect a missing directory to result in a default but..._
        try {
            await loadConfigsFallback(path.join(__dirname, 'tmp', 'missing'))
        } catch (error) {
            // _... we got a meaningful JavaScript `TypeError` instead._
            console.log(`\n${error.stack}\n`)
            okay(error instanceof TypeError, 'useful error diagnosing problems with switch statement')
        }
    }
    //

    // It's more verbose but it allows us to use large sets of codes in switch
    // statements without having to write a unit test for every conceivable
    // error to ensure that the error codes are correct. We only need to unit
    // test the last case before the logic. It also allows us to rename an error
    // code and catch any overlooked renames.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            DIRECTORY_READ_ERROR: 'unable to read directory',
            FILE_READ_ERROR: 'unable to read file'
        })

        async function loadConfigs (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('DIRECTORY_READ_ERROR', 'unable to read dir', { dirname })
            }
            const configs = []
            for (const file of dir) {
                const filename = path.join(dirname, file)
                let body
                try {
                    body = await fs.readFile(filename, 'utf8')
                } catch (error) {
                    throw new ConfigError('FILE_READ_ERROR', { filename })
                }
                try {
                    console.log(body)
                    configs.push(JSON.parse(body))
                } catch (error) {
                    throw new ConfigError('FILE_PARSE_ERROR')
                }
            }
            return configs
        }

        async function loadConfigsFallback (dirname) {
            try {
                return await loadConfigs(dirname)
            } catch (error) {
                switch (error.symbol) {
                 // _Spelling error fixed._
                case ConfigError.code('DIRECTORY_READ_ERROR').symbol:
                case ConfigError.code('FILE_READ_ERROR').symbol:
                    return [{ settings: { volume: 0 } }]
                default:
                    throw error
                }
            }
        }

        okay(await loadConfigsFallback(path.join(__dirname, 'tmp', 'missing')), [{
            settings: { volume: 0 }
        }], 'finally working correctly')
    }
    //

    // The enumerability of the properties of your property object will be
    // applied to the properties when then are set on the constructed exception.

    //
    console.log('\n--- defining non-enumerable properties in the constructor ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            'FILE_READ_ERROR': 'unable to read file',
            'PARSE_ERROR': 'unable to parse JSON'
        })

        async function load (filename) {
            let json
            try {
                json = await fs.readFile(filename, 'utf8')
            } catch (error) {
                throw new ConfigError('FILE_READ_ERROR', { filename })
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('PARSE_ERROR', Object.defineProperties({}, {
                    filename: {
                        value: filename,
                        enumerable: true
                    },
                    json: {
                        value: json,
                        enumerable: false
                    }
                }))
            }
        }

        try {
            await load(__filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Object.keys(error.properties).sort(), [ 'code', 'filename' ], 'only two enumerable properties')
            console.log(Object.getOwnPropertyNames(error))
            okay(error.hasOwnProperty('json'), 'added a non-enumerable properties')
            okay(error.json.length > 4096, 'really too big to add to the stack trace')
        }
    }
    //

    // Non enumerable properties will not appear in the stack trace, JSON
    // serialization and many utilties that print errors will skip those
    // properties. You can use non-enumerable properties when you want to
    // provide context information that may need specialized reporting, that
    // would look rediculous in the stack trace.

    // Note that when you use `Object.defineProperties` you must set the
    // `enumerable` property to `true` for the property to be enumerable. The
    // default is `false`. **TODO** Double check. (Internet is down now.)

    // You can also specify non-enumerable properties in the default properties
    // for a code with `Interrupt.create()`.

    //
    console.log('\n--- defining non-enumerable default properties at create ---\n')
    {
        const ConfigError = Interrupt.create('ConfigError', {
            NULL_ARGUMENT: Object.defineProperties({}, {
                // _We ask that `message` be made enumerable, but our request
                // will be ignored._
                message: {
                    value: 'the JSON string to parse must not be null',
                    enumerable: true
                },
                fallback: {
                    value: false,
                    enumerable: false
                }
            }),
            INVALID_JSON: Object.defineProperties({}, {
                message: {
                    value: 'the argument must not be null',
                    enumerable: true
                },
                fallback: {
                    value: true,
                    enumerable: false
                }
            })
        })

        function parse (json) {
            if (json == null) {
                throw new ConfigError('NULL_ARGUMENT')
            }
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ConfigError('INVALID_JSON')
            }
        }

        try {
            parse(null)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Object.keys(error.properties), [ 'code' ], 'only code property set')
            okay(!error.propertyIsEnumerable('message'), 'despite our requests, message is not enumerable')
            okay(error.fallback, false, 'non-enumerable default property set')
        }

        try {
            parse('!')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Object.keys(error.properties), [ 'code' ], 'only code property set')
            okay(error.fallback, true, 'non-enumerable default property set')
        }
    }
    //

    // In this example we do not enumerable the `fallback` property. It is just
    // a handling hint so we don't want to see it in our stack trace.

    // The `message`, `errors`, and `symbol` properties will never be enumerable
    // on the created exception regardless of whether or not they are specified
    // as enumerable in the constructor or defaults.

    // The `code` property will always be enumerable regardless of whether or
    // not the property is enumerable in the constructor or defaults.

    // You cannot override the `stack`, `errors`, or `name` properties.

    // ## Property Serialization JSON

    // Error properties are written to the stack trace as JSON. If run this unit
    // test from the command line, you will have seen stack traces that include
    // formatted JSON of the properties.

    // We use JSON instead of `util.inspect()` because we want the ability to
    // gather our stack trace messages from our production logs and parse them
    // for programmatic analysis.

    // There are object trees that JSON cannot serialize, however. We've made
    // some accommodations so that JSON will do its best to serialize as much as
    // it can.

    // It's unreasonable to insist that only valid JSON objects are allowed as
    // error properties. A function could be trying to say, "I expected an
    // integer but instead you gave me this." If the bad argument the function
    // is trying to report contains circular references we don't want
    // `JSON.stringify()` to chime in with its own exception.

    // If given JSON that `JSON.stringify()` cannot stringify, rather than
    // failing silently, or worse, throwing an exception, Interrupt tries to
    // accommodate the invalid JSON.

    // This specialized `JSON` serialization is exposed by
    // `Interrupt.JSON.stringify()`. There is an associated
    // `Interrupt.JSON.parse()` to go with it.

    // We always serialize JSON with a four space indent.

    // Ordinary JSON serializes and parses like ordinary JSON.

    //
    console.log('\n--- serializing ordinary JSON ---\n')
    {
        const object = {
            missing: null,
            number: 1,
            string: 'string',
            array: [ 1, 2, 3 ],
            object: { key: 'value' }
        }

        const stringified = Interrupt.JSON.stringify(object)

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified)


        okay(parsed, object, 'serialize and parse ordinary JSON')
    }
    //

    // Circular references are supported and they can be parsed, but they make
    // the JSON output harder to read. There will be reference placeholders in
    // the output.

    //
    console.log('\n--- serializing JSON with circular references ---\n')
    {
        const object = { c: 1 }

        const stringified = Interrupt.JSON.stringify({ a: object, b: object })

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified)

        okay(parsed.a === parsed.b, 'serialize and parse JSON with circular references')
    }
    //

    // Undefined will be serialized and parsed. `JSON.stringify()` drops values
    // that are `undefined`, but seeing that a value is `undefined` might
    // explain clarify the cause of an error.

    //
    console.log('\n--- serializing JSON with undefined members ---\n')
    {
        const object = { missing: undefined }

        const stringified = Interrupt.JSON.stringify(object)

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified, '\n')

        okay(parsed, object, 'serialize and parse JSON with undefined members')
    }
    //

    // If your JSON has an array that just happens to start with a
    // `'_referenced'`, `'_undefined'`, or `'_array'` string, it is escaped with
    // an `_array` type specifier so it can be serialized and parsed.

    // We're able to parse circular references and undefined we replace them a
    // place-holder. The place-holder is an array that starts with a string
    // indicating the type, `'_referenced'`, or `'_undefined'` and has any
    // additinal information in the rest of the array. On parsing we detect
    // these special arrays by looking at the first element.

    //
    console.log('\n--- escaping type specifiers in JSON ---\n')
    {
        const object = { array: [ '_reference', [ 'a', 'b' ] ] }

        const stringified = Interrupt.JSON.stringify(object)

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified, '\n')

        okay(parsed, object, 'serialize and parse JSON parsing type specifiers')
    }
    //

    // Errors are serialized specially. JSON treats error an object and neither
    // `message`, nor `stack` are enumerable. If there are no additional
    // properties you simply see an empty array.

    // Interrupt's JSON will serialize the `message` and `stack`.

    //
    console.log('\n--- default JSON serialization of Error ---\n')
    {
        console.log(`${JSON.stringify(new Error('thrown'))}\n`)

        const error = new Error('thrown')
        error.code = 'ENOENT'
        console.log(`${JSON.stringify(error)}\n`)
    }
    //

    // Interrupt's JSON will serialize the `message`, `stack` and any additional
    // properties set on the `Error` object. It cannot, however, parse the JSON
    // and construct the object as an `Error` type. It will be a plain `Object`.

    //
    console.log('\n--- Interrupt JSON serialization of Error ---\n')
    {
        console.log(`${Interrupt.JSON.stringify(new Error('thrown'))}\n`)

        const error = new Error('thrown')
        error.code = 'ENOENT'
        const stringified = Interrupt.JSON.stringify(error)

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified)
        okay(parsed.message, 'thrown', 'parsed JSON serialized error message')
        okay(parsed.code, 'ENOENT', 'parsed JSON serialized error property')
        okay(!(parsed instanceof Error), 'does not recreate Error type')
    }
    //

    // Functions are converted to their `toString()` value so you can see their
    // source if it is available. They will not be parsed back into functions.

    //
    console.log('\n--- Interrupt JSON serialaization of a function ---\n')
    {
        const stringified = Interrupt.JSON.stringify({ f: number => number + 1 })

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified)

        okay(parsed.f, 'number => number + 1', 'serialize function to string in JSON')
    }
    //

    // The `Interrupt.JSON` functions do not support custom `replacer` or
    // `reviver` functions and you cannot adjust the indent, it is always four
    // spaces.

    // Otherwise, Interrupt JSON behaves the way ordinary `JSON` behaves.
    // Objects lose their type information, `toJSON` is called if it is defined
    // so objects like `Buffer` convert to a JSON representation, JSON itself
    // converts of `Date` to strings. You won't always get back from JSON the
    // same types you put in, but you know that.

    //
    console.log('\n--- serializing JSON with `toJSON()` defined and `Date` members ---\n')
    {
        const stringified = Interrupt.JSON.stringify({
            date: new Date(0),
            buffer: Buffer.from('a')
        })

        console.log(`${stringified}\n`)

        const parsed = Interrupt.JSON.parse(stringified, '\n')

        okay(new Date(parsed.date), new Date(0), 'able to reconstruct date using String constructor')
        okay(parsed.buffer, {
            type: "Buffer",
            data: [ 97 ]
        }, '`Buffer` JSON member converted to JSON using `Buffer.toJSON()`')
    }
    //

    // For the most part, you won't be able to parse the JSON and get back the
    // original objects if they are not plain `objects`. That isn't really
    // important for reporting purposes however, just don't be surprised is all.

    // ## Formatted Messages

    // Messages are formatted using `sprintf-fs` which has a named parameter
    // syntax so we can use our properties object as our `sprintf` parameters.

    //
    console.log('\n--- formatted messages ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file: %(filename)s'
        })

        async function read (filename) {
            try {
                return await fs.readFile(filename)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR', { filename })
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), `unable to read file: ${filename}`, 'sprintf message formatted')
            okay(error.filename, filename, 'sprintf example filename property set')
        }
    }
    //

    // If `sprintf` is unable to format the message due to an error in the
    // message format, the message format will be used as is.

    //
    {
        const path = require('path')
        const fs = require('fs').promises

        const ReaderError = Interrupt.create('ConfigError', {
            FILE_READ_ERROR: 'unable to read file: %(filename)'
        })

        async function read (filename) {
            try {
                return await fs.readFile(filename)
            } catch (error) {
                throw new ReaderError('FILE_READ_ERROR')
            }
        }

        const filename = path.join(__dirname, 'missing.txt')

        try {
            await read(filename)
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), `unable to read file: %(filename)`, 'format was missing a sprintf type specifier')
        }
    }
    //

    // To use a parameter in the format you **must** put it in the properties
    // object and it will become a property of the exception. If you really want
    // to use a parameter but not have it become a property of the exception
    // prefix add an underbar to both the property in the properties object and
    // the `sprintf` format.

    //
    console.log('\n--- sprintf-only properties ---\n')
    {
        const ReaderError = Interrupt.create('ConfigError', {
            INVALID_FILENAME: `filename must be a string, received: %(_type)s`,
            FILE_READ_ERROR: 'unable to read file: %(filename)s'
        })

        async function read (filename) {
            if (typeof filename != 'string') {
                throw new ReaderError('INVALID_FILENAME', { _type: typeof filename })
            }
            try {
                return await fs.readFile(filename)
            } catch (error) {
                throw new ReadError('FILE_READ_ERROR', { filename })
            }
        }

        try {
            await read([])
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(!('_type' in error), 'sprintf-only property is not a property of the exception')
            okay(Interrupt.message(error), 'filename must be a string, received: object', 'sprintf-only property available for sprintf')
        }
    }
    //

    // In the above example we decided add the incorrect type to the error
    // message, but decided against making it a property of the exception. For
    // an assertion that should be raised by unit testing, the message ought to
    // be enough.

    // Because underbars make properties disappear you should be careful not to
    // dump arbitrary objects into your properties with destructuring.

    //
    console.log('\n--- ruining a properties object with destructuring ---\n')
    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARAM_MISSING: 'config parameter missing',
            INVALID_PARAM_TYPE: 'invalid config parameter type'
        })

        function assertConfig (config) {
            if (config.settings == null) {
                throw new ConfigError('PARAM_MISSING', { ...config })
            }
            if (config.settings.volume != 'number') {
                throw new ConfigError('INVALID_PARAM_TYPE', { ...config })
            }
        }

        try {
            assertConfig({ _settings: { volume: 0 } })
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay({ ...error.properties }, { code: 'PARAM_MISSING' }, 'desired context infomration removed because of underbar')
        }
    }
    //

    // This is not a good thing to do in any case.

    // Only properties with underbar'd names at the top level of the properties
    // object are removed. We do not recursively search for underbar'd
    // properties to remove.

    // We can fix the above by removing the destructuring.

    //
    console.log('\n--- explicitly set your property names ---\n')
    {
        const ConfigError = Interrupt.create('ConfigError', {
            PARAM_MISSING: 'config parameter missing',
            INVALID_PARAM_TYPE: 'invalid config parameter type'
        })

        function assertConfig (config) {
            if (config.settings == null) {
                throw new ConfigError('PARAM_MISSING', { config })
            }
            if (config.settings.volume != 'number') {
                throw new ConfigError('INVALID_PARAM_TYPE', { config })
            }
        }

        try {
            assertConfig({ _settings: { volume: 0 } })
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay({ ...error.properties }, {
                code: 'PARAM_MISSING',
                config: { _settings: { volume: 0 } }
            }, 'we know our property names')
        }
    }
    //

    // **TODO** When you implement multi-line error messages, the description of
    // how to use them goes here.

    // ## Message Tables

    // You might not be able to create a message generic enough for a particular
    // code, or you might want to use generialized codes with customized
    // messages.

    // **TODO** Stabbing at how to say this. Rewrite.

    // Codes and messages are a matter of taste. You might want to have a small
    // set of generic codes but a lot of detailed messages and error properties
    // for context. If this is the case, you'll have to litter the specialized
    // messages throughout your program.

    // You can instead define a message table.

    // A default defines a `code` property that is either the string name of an
    // existing code, the symbol for an existing code or one of the code objects
    // in the code object map passed into a code definition function.

    //
    {
        const ConfigError = Interrupt.create('ConfigError', [
            'MISSING_PARAM', 'INVALID_PARAM_TYPE'
        ], function ({ Codes }) {
            return {
                // _Specify by code name._
                'SETTINGS_MISSING': {
                    code: 'MISSING_PARAM',
                    message: 'the settings property is missing'
                },
                // _Specify by code symbol._
                'VOLUME_MISSING': {
                    code: Codes.MISSING_PARAM.symbol,
                    message: 'the volume property is missing'
                },
                // _Easiest to read, just the `code` object itself._
                'INVALID_VOLUME_TYPE': {
                    code: Codes.INVALID_PARAM_TYPE,
                    message: 'the volume must be integer, got type: %(_type)s'
                }
            }
        })

        okay(ConfigError.INVALID_PARAM_TYPE != null, 'defined symbol property on class')
        okay(ConfigError.INVALID_VOLUME_TYPE == null, 'did not define message table as symbol')
        okay(ConfigError.code('INVALID_VOLUME_TYPE') == null, 'not available from codes either')
        okay(ConfigError.codes.sort(), [ 'INVALID_PARAM_TYPE', 'MISSING_PARAM' ], 'codes created, not templates')

        function assertConfig (config) {
            if (!('settings' in config)) {
                throw new ConfigError('SETTINGS_MISSING')
            }
            if (typeof config.settings != 'object') {
                throw new ConfigError('INVALID_SETTINGS_TYPE', { _type: typeof config.settings })
            }
            if (!('volume' in config.settings)) {
                throw new ConfigError('VOLUME_MISSING')
            }
            if (typeof config.settings.volume != 'number') {
                throw new ConfigError('INVALID_VOLUME_TYPE', { _type: typeof config.settings.volume })
            }
        }

        try {
            assertConfig({ settings: { volume: 'loud' } })
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'INVALID_PARAM_TYPE', 'aliased code set')
            okay(error.symbol, ConfigError.INVALID_PARAM_TYPE, 'aliased code set')
        }
    }
    //

    // **TODO** Getting poorly written here abouts.

    // When you specify a symbol or a code in your definition it is used as an
    // alias for that code. The properties and format for that code are used but
    // they are overwritten by the alias. The referenced code is used for
    // exceptions code. Aliases can reference aliases.

    // You cannot declare an alias or code more than once in `create()`. You
    // will inherit the aliases of the super class and they can be overridden in
    // the sub class.

    // You can specify both a symbol and a code, but they must agree.

    // ## Nested Exceptions

    // When you want to throw an exception based on a exception you caught you
    // can pass that exception's error into the constructor. The `errors`
    // property of the exception will contain the cause. Any argument that is an
    // object that is `instance Error` will be added to the `errors`.

    // If you pass in more than one error they will both be added to the errors
    // array. (**TODO** An example with a primary attempt and a fallback and
    // they both fail. Hmm... Now I have an aggregate but that is for the
    // context example, this example is still good.)

    // Any `Array` argument to the constructor is treated as an array of nested
    // errors and added to the error array.

    // You can mix adding both arrays and errors directly.

    // Any type can be thrown from JavaScript. If can't be certain that the
    // error you caught is `instanceof Error`, simply wrap it in an array.

    // **TODO** Example of any type of error.

    //

    // ## Stack Trace Limit

    // An integer greater than or equal to zero, or Infinity is interpreted as a
    // stack trace limit. It is used to temporarily set `Error.stackTraceLimit`
    // for during the construction of the exception. `Error.stackTraceLimit` is
    // restored to its original value after the exception is constructed.

    //
    {
    }
    //

    // In our nested error examples so far we've always specified a single
    // nested error so we've added context to wrapper error. When you create an
    // aggregate exception, you don't have a good way to associate properties in
    // the wrapper error with an error at a specific index in the nested errors
    // array.

    // To provide context for each nested error, you can create a wrapper error
    // for each nested error. Now you have an aggregate error with an array of
    // context wrapper errors containing the actual errors. Yes, you can do
    // this, and yes it's a bit much. This is where the stack trace limit can
    // help.

    // The stack trace can start to get too verbose. Each wrapper error will add
    // a stack trace and that stack trace is often superflous. If the aggregate
    // error provides a stack trace that points to the right function in your
    // application and the context wrapper errors merely repeat that stack
    // trace plus a frame, go ahead and get rid of it by setting a stack trace
    // limit of zero. The context wrapper exceptions will appear without a stack
    // trace or stack trace header merely providing some context.

    // **TODO** Do we want to maybe make the code a part of the exception name?
    // No. No way to distinquish the class name from the code without
    // introducing some additional funny character. What's the big deal about a
    // funny character? `#` and you encourage codes.

    //
    console.log('\n--- nested error context wrapper ---\n')
    {
        const path = require('path')
        const fs = require('fs').promises

        const ConfigError = Interrupt.create('ConfigError', {
            UNABLE_TO_READ_DIRECTORY: 'unable to read directory',
            UNABLE_TO_READ_FILE: 'unable to read file'
        })

        async function slurpDirectory (dirname) {
            let dir
            try {
                dir = await fs.readdir(dirname)
            } catch (error) {
                throw new ConfigError('UNABLE_TO_READ_DIRECTORY', { dirname })
            }
            const promises = [], errors = [], files = []
            for (const file of dir) {
                promises.push(async function () {
                    const filename = path.join(dirname, file)
                    try {
                        await files.push(await fs.readFile(filename))
                    } catch (error) {
                        errors.push(new ConfigError.Error(0, 'UNABLE_TO_READ_FILE', error, { filename }))
                    }
                } ())
            }
            for (const promise of promises) {
                await promise
            }
            if (errors.length) {
                throw new ConfigError('UNABLE_TO_READ_DIRECTORY', errors, { dirname })
            }
            return files
        }

        const dirname = path.join(__dirname, 'tmp', 'eisdir')

        try {
            await slurpDirectory(dirname)
        } catch (error) {
            console.log(`${error.stack}\n`)
        }
    }
    //

    // Alternatively, you could set the stack trace to `1` to get just a
    // filename and line number on the nested wrapper exception.

    // Trimming stack traces is worthwhile. We know that JavaScript won't give
    // us a continguous stack trace, so we become accustomed to using what we
    // get to poke around, so we learn to trim the cruft down to just what we
    // need to navigate the source post mortem.

    //

    // Why don't you need the additional stack trace? Okay, I'm going to add
    // this facility because it exists currently, but the new stack trace
    // adjustment facilities suggest that it is a mistake. Maybe this comes back
    // out. Can see how you might have a module where all the user really cares
    // about is the point of entry, not about the calls launched within the
    // module function.

    // **TODO** In Destructable, see if there is space for a launch marker. A `$
    // => ()` function that can encase the launch point of the strand.

    // ## Callee

    // Sometime you want the stack trace to exclude the upper most stack frames.
    // This is useful when creating assertion functions where the top of the
    // stack trace should be the point where the assertion was called, not the
    // point where the assertion function created the exception.

    // To specify a callee you pass in an options object as the first argument
    // to the constructor.

    // **TODO** The code or message format is always required, but somtimes it
    // is not desired. If you want to specify that you do not want to use a code
    // nor a message pass in null. (No, pass in an empty object!) This is useful
    // when you are overriding properties

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
                    json: json,
                    '#callee': parse
                })
            }
        }

        try {
            parse('!')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'INVALID_JSON', 'named parameters code set')
            okay(error.json, '!', 'named parameters property set')
        }
    }

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
    // `SyntaxError` already exists in the global namespace. We can create
    // instead create a `Syntax.Error`, an error that has a dot qualfiied name
    // and is a static member of our `Syntax` class.

    // **TODO** Terrible example. Just rewrite any of your existing file opening
    // examples. You're talking about `assert` before you've introduced it. The
    // example is more contrived than any you're written before.

    // Also, any test of the file to see if it contains hippopotus will succeed
    // without having to write hippopotus anywhere except in the test.

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
            console.log(`${error.stack}\n`)
            okay(error.name, 'Syntax.Error', 'name allowed to have dot qualifiers')
        }
    }
    //

    // These days I'm targeting Node.js 12 or greater, which has a `static`
    // keyword that makes declaration easier.

    // **TODO** Who cares about these days? Interrupt targets Node.js 12.
    // Enough!

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
            console.log(`${error.stack}\n`)
            okay(error.name, 'Syntax.Error', 'name allowed to have dot qualifiers in ES6 classes')
        }
    }
    //

    // **TODO** Maybe parsing goes here so we can us it to ensure that assert
    // and the rest set the correct file and line in the stack. That is,
    // introduce parsing and then use it to get the top of the stack.

    //

    // ## Assertions

    // If you're using Interrupt in your code would probably like to raise
    // assertions that are derived from `Interrupt` instead of using `assert`
    // and raising errors that are of type `AssertionError`.

    // Interrupt adds a simple boolean assertion function as a static class
    // member of the generated `Interrupt` derived exception class. You can use
    // this in lieu of the Node.js `assert` module. The exceptions you raise
    // will be consistent, the same type, with a code specific to your
    // application instead of `ERR_ASSERTION` and you can add properties to your
    // assertion exceptions.

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
            console.log(`${error.stack}\n`)
            okay(error.symbol, ParseError.INVALID_TYPE, 'symbol set')
            okay(error.code, 'INVALID_TYPE', 'code set')
            okay(error.type, 'number', 'type property set')
        }
    }
    //

    // Thie first argument to `.assert()` is a condition that must be truthy.
    // After the condition argument the assertion accepts all the of the same
    // arguments that the exception constructor accepts.

    // If the only argument after the assertion is a function it is interpreted
    // as a `callee`. It is used as an exception constructor function.

    // Sometimes propeties require some calculation so building the properties
    // argument takes effort, effort that we throw away immediately if the
    // assertion doesn't fail.

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
            ParseError.assert(json.length < MAX_LENGTH, 'TOO_MUCH_JSON', {
                MAX_LENGTH: MAX_LENGTH,
                length: json.length,
                difference: json.length - MAX_LENGTH
            }, $ => $())
            try {
                return JSON.parse(json)
            } catch (error) {
                throw new ParseError('INVALID_JSON', error, { json })
            }
        }

        try {
            parse(JSON.stringify('x'.repeat(1023)))
        } catch (error) {
            console.log(error)
            console.log(`${error.stack}\n`)
            okay(error.symbol, ParseError.TOO_MUCH_JSON, 'deferred assert symbol set')
            okay(error.code, 'TOO_MUCH_JSON', 'deferred assert code set')
            okay(error.difference, 1, 'deferred assert property set')
        }
    }
    //

    // ## Synchronous `try`/`catch` Wrappers

    // There are times when I don't want to go to the trouble of unit testing
    // catch blocks that merely wrap an exception, but I don't want to forgo the
    // unit test coverage.

    // When all a catch block does is wrap and rethrow, you can use the static
    // `invoke()` method specifying a guarded function to run and the parameters
    // to the error constructor of the wrapper function if the function fails.
    // The function will be run in `try/catch` block and if the function throws
    // an exception, the error will be wrapped in an exception constructed with
    // the given constructor parameters.

    //
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string'
        })

        function parse (json) {
            return ParseError.invoke(() => JSON.parse(json), 'INVALID_JSON')
        }

        try {
            parse('!')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'INVALID_JSON', 'synchronous try/catch wrapper code set')
            okay(error.errors[0] instanceof SyntaxError, 'synchronous try/catch wrapper nested error present')
        }
    }
    //

    // You cannot use invoke to call `async` functions or resolve `Promise`s.
    // For that you use the static `resolve()`. See below.

    // For consistencies sake, you can defer calculation of the constructor
    // parameters. If you pass a function as the only argument after the guarded
    // function is a function it is used as an exception constructor.

    //
    {
        const ParseError = Interrupt.create('ParseError', {
            INVALID_JSON: 'unable to parse JSON string'
        })

        function parse (json) {
            return ParseError.invoke(() => JSON.parse(json), 'INVALID_JSON', { length: json.length }, $ => $())
        }

        try {
            parse('!')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'INVALID_JSON', 'synchronous try/catch wrapper code set')
            okay(error.length, 1, 'synchronous try/catch wrapper property set')
            okay(error.errors[0] instanceof SyntaxError, 'synchronous try/catch wrapper nested error present')
        }
    }
    //

    // **TODO** Didn't I write about this at length? Is it in the swipe?

    // **TODO** Okay, look in swipe, but it is not above. This is the beginnning
    // of the discussion of stack trace preservation. Needs more preamble.

    // **TODO** Needs to be introduced with callbacks which have no caveats.
    // Promises are fixed in Node.js 14, so, no wait. Isn't it broken regardless
    // if you call a Node.js filesystem function? I believe I decided to do
    // callbacks first for some reason.

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
            console.log(`${error.stack}\n`)
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
            console.log(`${error.stack}\n`)
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
            console.log(`${error.stack}\n`)
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
            console.log(`${error.stack}\n`)
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

    // **TODO** This section is a message. I'm only using the poker function in
    // some examples, not in others. Need to sort out how to introduce it.

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
                const handle = await Reader.Error.resolve(fs.open(filename, 'r'), 'UNABLE_TO_OPEN_FILE', { filename }, $ => $())
                const stat = await Reader.Error.resolve(handle.stat(), 'UNABLE_TO_STAT_FILE', { filename })
                const buffer = Buffer.alloc(stat.size)
                await Reader.Error.resolve(handle.read(buffer, 0, buffer.length, 0), 'UNABLE_TO_READ_FILE', { filename })
                await Reader.Error.resolve(handle.close(), 'UNABLE_TO_CLOSE_FILE', { filename })
                return buffer
            }
        }

        const reader = new Reader

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(`${error.stack}\n`)
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
                const resolver = Reader.Error.resolve({}, { filename })
                const handle = await resolver(fs.open(filename, 'r'), 'UNABLE_TO_OPEN_FILE', $ => $())
                const stat = await resolver(handle.stat(), 'UNABLE_TO_STAT_FILE', $ => $())
                const buffer = Buffer.alloc(stat.size)
                await resolver(handle.read(buffer, 0, buffer.length, 0), 'UNABLE_TO_READ_FILE', $ => $())
                await resolver(handle.close(), 'UNABLE_TO_CLOSE_FILE', $ => $())
                return buffer
            }
        }

        const reader = new Reader

        try {
            const reader = new Reader
            await reader.read(path.join(__dirname, 'missing.txt'))
        } catch (error) {
            console.log(`${error.stack}\n`)
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
                console.log(`${error.stack}\n`)
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
                console.log(`${error.stack}\n`)
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
                    return new Reader.Error({ '#callee': constructor }, message, vargs[0], properties)
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
                console.log(`${error.stack}\n`)
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
                fs.readFile(filename, Reader.Error.callback('UNABLE_TO_READ_FILE', { filename }, $ => $(), callback))
            }
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing.txt'), (error, body) => {
            if (error) {
                console.log(`${error.stack}\n`)
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
                fs.readFile(filename, Reader.Error.callback('UNABLE_TO_READ_FILE', { filename }, $ => $(), callback))
            }

            async load (filename, callback) {
                this.read(filename, Reader.Error.callback('UNABLE_TO_READ_FILE', { filename }, $ => $(), (error, body) => {
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
                console.log(`${error.stack}\n`)
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            resolve()
        })
    })
    //

    // ## Currying

    // * Start with resolve, callback, invoke, then assert.

    //
    await new Promise(resolve => {
        const path = require('path')
        const fs = require('fs')

        class Reader {
            static Error = Interrupt.create('Reader.Error', {
                UNABLE_TO_READ_DIRECTORY: 'unable to read directory: %(dirname)s',
                UNABLE_TO_READ_FILE: 'unable to read file: %(filename)s'
            })

            read (dirname, callback) {
                const wrap = Reader.Error.callback({}, { dirname }), files = []
                fs.readdir(dirname, wrap('UNABLE_TO_READ_DIRECTORY', $ => $(), (error, dir) => {
                    if (error) {
                        callback(error)
                    } else {
                        function readFile () {
                            if (dir.length == 0) {
                                callback(null, files)
                            } else {
                                const filename = path.join(dirname, dir.shift())
                                fs.readFile(filename, 'utf8', wrap('UNABLE_TO_READ_FILE', { filename }, $ => $(), (error, body) => {
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
        }

        const reader = new Reader

        reader.read(path.join(__dirname, 'missing'), (error, body) => {
            if (error) {
                console.log(`${error.stack}\n`)
                okay(error.code, 'UNABLE_TO_READ_DIRECTORY', 'curried callback wrapper code set')
                okay(error.errors[0].code, 'ENOENT', 'curried callback nested error set')
            } else {
                console.log(/hippopotomus/.test(body.toString()))
            }
            reader.read(path.join(__dirname, 'tmp', 'eisdir'), (error, body) => {
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
    //

    //
    {
        const ConfigError = Interrupt.create('ConfigError', {
            CONFIG_PARSE_ERROR: 'unable to parse config JSON',
            CONFIG_PARAM_MISSING_ERROR: 'parameter is missing: %(param)s'
        })

        function parseConfig (config) {
            const invoker = ConfigError.invoke({}, { config })
            const object = invoker(() => JSON.parse(config), 'CONFIG_PARSE_ERROR')
            return invoker(() => object.settings.volume, 'CONFIG_PARAM_MISSING_ERROR', { param: 'settings.volume' })
        }

        try {
            parseConfig('!')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'CONFIG_PARSE_ERROR', 'curried invoke code set')
            okay(error.errors[0] instanceof SyntaxError, 'curried invoke nested error set')
        }

        try {
            parseConfig('{}')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'CONFIG_PARAM_MISSING_ERROR', 'curried invoke code set')
            okay(error.errors[0] instanceof TypeError, 'curried invoke nested error set')
        }

        okay(parseConfig('{"settings":{"volume":0}}'), 0, 'curried invoke no errors')
    }
    //

    //
    {
        const ConfigError = Interrupt.create('ConfigError', {
            CONFIG_PARAM_MISSING_ERROR: 'parameter is missing: %(param)s'
        })

        function parseConfig (config) {
            const object = JSON.parse(config)
            const assert = ConfigError.assert(Interrupt.CURRY, { config: object })
            assert(object.settings != null, 'CONFIG_PARAM_MISSING_ERROR', { param: 'settings' })
            assert(object.settings.volume != null, 'CONFIG_PARAM_MISSING_ERROR', { param: 'settings.volume' })
            return object
        }

        try {
            parseConfig('{}')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'CONFIG_PARAM_MISSING_ERROR', 'curried assert code set')
        }

        try {
            parseConfig('{"settings":{}}')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(error.code, 'CONFIG_PARAM_MISSING_ERROR', 'curried assert code set')
        }

        okay(parseConfig('{"settings":{"volume":0}}'), {
            settings: { volume: 0 }
        }, 'curried assert no failed assertions')
    }
    //

    // ## Auditing Deferred Construction

    // Deferred construction is cute when working with asssertions and necessary
    // for meaninful stack traces when working with callbacks. However, it
    // creates a lot of little functions that are only invoked if an exception
    // is raised. These are essentially our catch blocks.

    // Even without deferred construction we won't know if we've correctly
    // created the exception without raising it. Perhaps a property using in the
    // formatted message is missing, we'll end up with a poorly formatted
    // message and missing context in our crash log. It might mean the
    // difference between fixing a production bug or merely fixing a bug in a
    // production bug.

    // To determine if our exceptions are going to be correctly constructed we
    // can using the deferred construction audit mechanism. Simply assign a
    // function to the `Interrupt.audit` property. If the `Interrupt.audit`
    // property is set with a function that function will be called from all the
    // assistant functions, `assert`, `invoke`, `callback` and `resolve` with
    // the constructed exception regardless of whether or not the exception was
    // necessary. The `audit` function can examine the constructed exception to
    // ensure that it's properties and format are correct.

    // Additionally, an `errors` array is provided. This contains an array of
    // errors or potential errors encountered while constructing the exception.
    // These are simple objects, not instances of type `Error` so they do not
    // contain a stack trace.

    // The `invoke`, `callback` and `resolve` functions wrap an exception.
    // Exceptions creates soely for the purpose of auditing that are not the
    // result of a caught exception will use `Interrupt.AUDIT` for the
    // exception. This is a `Error` generated at startup and its stack trace is
    // meaningless.

    // You should only use the audit function in your unit testing.

    //
    {
        const path = require('path')
        const fs = require('fs').promises
        const fileSystem = require('fs')

        class Config {
            static Error = Interrupt.create('Config.Error', {
                INVALID_FILE: 'unable to load file: %(filename)',
                INVALID_ARGUMENT: 'the JSON string to parse must not be null',
                INVALID_JSON: 'unable to parse JSON'
            })

            parse (json) {
                Config.Error.assert(json != null, 'INVALID_ARGUMENT')
                const object = Config.Error.invoke(() => JSON.parse(json), 'INVALID_JSON')
                return object
            }

            async load (filename) {
                const json = await Config.Error.resolve(fs.readFile(filename, 'utf8'), 'INVALID_FILE', { filename })
                return this.parse(json)
            }

            classicLoad (filename, callback) {
                fileSystem.readFile(filename, 'utf8', Config.Error.callback('INVALID_FILE', { filename }, $ => $(), (error, json) => {
                    if (error) {
                        callback(error)
                    } else {
                        try {
                            callback(null, this.parse(json))
                        } catch (error) {
                            callback(error)
                        }
                    }
                }))
            }
        }

        const audit = []

        Interrupt.audit = function (error, errors) {
            if (error instanceof Config.Error) {
                audit.push({ error, errors })
            }
        }

        const filename = path.join(__dirname, 'tmp', 'good', 'config.json')

        const config = new Config

        okay(await config.load(filename), { settings: { volume: 0 } }, 'audit `Promise` resolution')

        await new Promise((resolve, reject) => {
            config.classicLoad(filename, (error, config) => {
                if (error) {
                    reject(error)
                } else {
                    okay(config, { settings: { volume: 0 } }, 'audit error-first callback')
                    resolve()
                }
            })
        })

        okay(audit.length != 0, 'created and reported despite no exceptions raised')

        for (const { error, errors } of audit) {
            if (errors.length != 0) {
                console.log(errors)
            }
        }

        // _Reset our logging mechamism._
        audit.length = 0

        // _Turn audit off._
        Interrupt.audit = null

        config.parse('{}')

        okay(audit.length, 0, 'nothing to report')
    }
    //

    // ## Reducing the Verbosity of Stack Traces

    // **TODO** Dedup goes here.

    //
    {
        const Test = {
            Error: Interrupt.create('Test.Error', {
                one: 'one',
                two: 'two',
                root: 'root'
            })
        }
        const hello = new Error('hello')
        const world = new Error('world')
        const one = new Test.Error('one', [ hello, hello, hello ], { id: 1, x: 4 })
        const two = new Test.Error('one', [ world, world ], { id: 1, x: 5 })
        const three = new Test.Error('one', [ hello, world ], { id: 1, x: 6 })
        const four = new Test.Error('two', [ hello, world ], { id: 1, x: 7 })
        const interrupt = new Test.Error('three')
        const error = new Test.Error('root', [
            one, one, two, two, three, four, new Test.Error,
            interrupt, interrupt,
            new Test.Error('no context', new Error), 1
        ], { id: 2, x: 8 })
        console.log(error.stack)
        console.log(Interrupt.dedup(error))
        console.log(Interrupt.dedup(error, error => {
            return [ error.name, error.code || error.message, error.id || null ]
        }))
        console.log(Interrupt.dedup(new Error))
    }
    //

    // Putting this here for test coverage. What needs to be covered? Where is
    // the dead code? **TODO** Move to `swipe.t.js`.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                FILE_READ_ERROR: 'unable to read file',
                MISSING_CODE_ERROR: null
            })
        }

        try {
            throw new Config.Error('MISSING_CODE_ERROR')
        } catch (error) {
            console.log('>>>', error.stack, '!')
        }

        try {
            throw new Config.Error('message')
        } catch (error) {
            console.log(error)
        }

        try {
            throw new Error('message')
        } catch (error) {
            console.log(error)
        }
        //

        // **TODO** Multi-line messages. We can still parse them if we indent.
        // The indent escapes a lot of stuff. If you don't like our formatting,
        // that's fine, your stuff can look bad, we don't care.

        // **TODO** We really need to bring parse into `readme.t.js`. We should
        // probably be using it through out, we should probably have an error
        // extraction stream, or at least a buffer parser.

        // But, yes, if something is an Error, you can format a message such
        // that it cannot be parsed. The only thing we could do is check the
        // type at serialzation time and assert that it is as expected. That the
        // message is not multi-line, and if it is, that it does not begin with
        // `    at` at any point. I suppose that is the only condition that
        // would make it unparsable. If it is unparsable, then we can display it
        // as JSON.

        // We are always going to have `cause:` and we can put a type specifier
        // right after that colon, no type specifier means parsable error.

        // Still no good place to put the internal errors, except maybe an
        // `errors` section, we might have to say `constructor:` or something
        // because the word error can be in all the error codes.

        //
        try {
            throw new Error('multi-line\nmessage\n    at')
        } catch (error) {
            console.log(`${error.stack}\n`)
        }

        try {
        } catch (error) {
        }

        console.log(JSON.stringify(new Config.Error('FILE_READ_ERROR', { key: 1 }), null, 4))
        console.log(Interrupt.JSON.stringify(new Config.Error('FILE_READ_ERROR', { key: 1 }), null, 4))

        // **TODO** Wondering if you get an unresolved exception of promise 0
        // does a `setTimeout` and promise 1 throws an exception synchronously.
        async function _gather (callee, promises, options, vargs) {
            const errors = [], results = []
            for (const promise of promises) {
                try {
                    results.push(await promise)
                } catch (error) {
                    errors.push(error)
                }
            }
            // **TODO** Some reason why you'd want to allow properties before
            // the constructor occurred to me but I forgot it.
            //
            // Expose construct.
            if (errors.length) {
                throw Interrupt.construct(options, vargs, errors, callee)
            }
            return results
        }

        function _all (callee, options, vargs) {
            if (Array.isArray(vargs[0])) {
                return _gather(called, vargs.shift(), options, vargs)
            }
            const merged = Interrupt._options([ options ], vargs)
            return function all (promises, ...vargs) {
                return _all(all, merged, vargs)
            }
        }

        function all (...vargs) {
            return _all(all, {}, vargs)
        }

        // **TODO** An `assertEqual` function would be a good tour of the
        // currying issues.

        const one = new Error('one')
        const two = new Error('two')

        const error = new Config.Error('FILE_READ_ERROR')

        console.log(Interrupt.stringify(new Error))
        console.log(Interrupt.stringify(one))
        console.log(Interrupt.explode(one))
        console.log(Interrupt.explode(new Error))
        one.code = 'ERROR'
        console.log(Interrupt.explode(one))
        const parser = new Interrupt.Parser
        for (const line of error.stack.split('\n')) {
            parser.push(line)
        }
        parser.end()
        console.log(parser._node)
        /*
        await all([ async () => {
            await new Promise(resolve => setTimeout(resolve, 50))
        }, Promise.reject(new Error('thrown')) ], 'wrapped')
        */
    }

    // ## Parsing Stack Traces

    // The stack trace emitted from an Interrupt generated error is both human
    // readable and machine readable. Using the `Interrupt.parse()` method you
    // can parse the stack trace of an `Interrupt` error.

    //
    console.log('\n--- parse an Interrupt stack trace ---\n')
    {
        const path = require('path')

        class Config {
            static Error = Interrupt.create('Config.Error', {
                'FILE_READ_ERROR': 'unable to read file'
            })
        }

        const nested = new Error('nested')
        nested.code = 'ERRORED'

        const error = new Config.Error('FILE_READ_ERROR', [ nested ])

        console.log('--- stack trace ---\n')
        console.log(error.stack)
        console.log('\n--- parsed ---\n')

        const object = Interrupt.parse(error.stack)

        console.log(object)
        console.log('')

        okay(Object.keys(object).sort(), [
            '$errors', '$trace', 'className', 'errors', 'message', 'properties', 'stack'
        ], 'properties of parsed object')

        okay({
            className: object.className,
            message: object.message,
            properties: object.properties,
            errors: object.errors.map(object => {
                if (object.className) {
                    return {
                        className: object.className,
                        message: object.message,
                        properties: object.properties,
                        errors: object.errors,
                        $errors: object.errors,
                        top: path.basename(object.stack[0].file)
                    }
                }
            }),
            $errors: object.$errors,
            $trace: object.$trace,
            top: path.basename(object.stack[0].file)
        }, {
            className: 'Config.Error',
            message: 'unable to read file',
            properties: { code: 'FILE_READ_ERROR' },
            errors: [{
                className: 'Error',
                message: 'nested',
                properties: { code: 'ERRORED' },
                errors: [],
                $errors: [],
                top: 'readme.t.js'
            }],
            $errors: [],
            $trace: [],
            top: 'readme.t.js'
        }, 'parsed stack traces object values')
    }
    //

    // Errors that are not objects are serialized as JSON. There is an ambiguity
    // where someone could create an exception whose name is `null` has no stack
    // trace or properties, which would be valid JSON.

    // As you can see from Interrupt itself, you can override the default
    // `Error` properties and hack the stack to create custom messages. Too much
    // hacking and you'll defeat `Interrupt.parse()` so `Interrupt.parse()` will
    // first make sure everything is in order with a nested `Error` and if it is
    // not, it will serialize that `Error` as JSON.

    //
    {
        const path = require('path')

        class Config {
            static Error = Interrupt.create('Config.Error', {
                'FILE_READ_ERROR': 'unable to read file'
            })
        }

        class NullError extends Error {
            constructor () {
                super()
                Object.defineProperty(this, 'name', { value: 'null' })
            }
        }

        const stackTraceLimit = Error.stackTraceLimit
        Error.stackTraceLimit = 0

        const evil = new NullError

        Error.stackTraceLimit = stackTraceLimit

        // _We now have an error whose `error.stack` is `'null'`.
        okay(evil.stack, 'null', 'confusing error')
        okay(Interrupt.JSON.parse(Interrupt.stringify(evil)), {
            constructor: 'NullError',
            error: {
                name: 'null',
                message: '',
                stack: [],
                properties: {}
            }
        }, 'serialized bad identifier as JSON')

        Object.defineProperty(evil, 'stack', { value: null })
        okay(evil.stack, null, 'made things even worse')
        okay(Interrupt.JSON.parse(Interrupt.stringify(evil)), {
            constructor: 'NullError',
            error: {
                name: 'null',
                message: '',
                stack: null,
                properties: {}
            }
        }, 'serialized missing stack as JSON')

        const interrupt = new Config.Error('FILE_READ_ERROR', [ evil ])
        console.log(Interrupt.parse(interrupt.stack))
    }
    //

    // ## Error Heirarchies

    // You can define symbols elsewhere and import them into the defintion of
    // your expcetion.

    // To do so you specify a `symbol` property in your prototype definition.
    // The symbol will be used instead of generating a symbol for the code.

    //
    console.log(`\n--- use existing external symbols ---\n`)
    {
        const Constants = {
            IO_ERROR: Symbol('IO_ERROR'),
            INVALID_ARGUMENT: Symbol('INVALID_ARGUMENT'),
            ANONYMOUS_SYMBOL: Symbol('ANONYMOUS_SYMBOL')
        }

        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: { symbol: Constants.IO_ERROR },
                INVALID_ARGUMENT: {
                    symbol: Constants.INVALID_ARGUMENT,
                    message: 'invalid argument for: %(_name)s'
                },
                NULL_ARGUMENT: {
                    symbol: Constants.ANONYMOUS_SYMBOL,
                    message: 'argument must not be null: %(_name)s'
                }
            })
        }

        try {
            throw new Config.Error('IO_ERROR')
        } catch (error) {
            console.log(`${error.stack}`)
            okay(error.symbol, Config.Error.IO_ERROR, 'use symbol')
            okay(error.code, 'IO_ERROR', 'use symbol name as code')
            okay(Interrupt.message(error), 'IO_ERROR', 'use symbol name as message')
        }
    }
    //

    // To inherit a codes and aliases from the parent you must use a code
    // function.

    // The code function is with a `Super` property that contains an object. The
    // `Super` contains a `Codes` property containing the codes of super class
    // indexed by the code name and an `Alaises` property containing the aliases
    // of the super class indexed by code name.

    // You can import code from the parent by returning one of the code objects
    // from the `Super.Codes` object.

    //
    console.log('\n--- inherit a code ---\n')
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse',
                NULL_ARGUMENT: 'must not be null'
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

    // You can import all the codes at once by returning the `Super.Codes` object.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse',
                NULL_ARGUMENT: 'must not be null'
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return Super.Codes
            })
        }

        okay(Derived.Error.codes.sort(), [ 'IO_ERROR', 'NULL_ARGUMENT', 'PARSE_ERROR' ], 'all codes inherited')
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

    // You can always return an code array, code object or another code function
    // so you can use one of these to return a subset of codes to import.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse',
                NULL_ARGUMENT: 'must not be null'
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return Object.keys(Super.Codes)
                             .filter(code => ! Super.Codes[code].recoverable)
                             .map(code => Super.Codes[code])
            })
        }

        okay(Derived.Error.codes.sort(), [ 'NULL_ARGUMENT', 'PARSE_ERROR' ], 'all codes inherited')
        okay((
            Config.Error.IO_ERROR === Derived.Error.IO_ERROR &&
            Config.Error.PARSE_ERROR === Derived.Error.PARSE_ERROR
        ), 'symbols inherited')

        try {
            throw new Derived.Error('NULL_ARGUMENT')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'must not be null', 'inherit message format')
            okay(error.code, 'NULL_ARGUMENT', 'inherit code name')
            okay(error.symbol, Config.Error.NULL_ARGUMENT, 'inherit code symbol')
        }
    }

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
    //

    // You're not able to remove properties when you override. You can however,
    // just redeclare the inherited property as code with an imported symbol.

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

        // **TODO** Expose properties, that is make it a part of the codes
        // object.
        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                return {
                    IO_ERROR: {
                        symbol: Super.Codes.IO_ERROR.symbol,
                        message: 'i/o error', // Super.Codes.properties.message
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
            okay(!('recoverable' in error), 'override default property')
            okay(error.type, 'directory',  'add default property')
        }
    }
    //

    // You can import all of the codes, but override or replace some of them
    // using JavaScript destructuring.

    // In this example we destructure the entire `Super.Codes` object into a new
    // object, which will import them as is, while at the same time extending
    // a specific code.

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
                    ...Super.Codes,
                    IO_ERROR: {
                        code: Super.Codes.IO_ERROR,
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
            okay(error.recoverable, 'inherit default property')
            okay(error.type, 'directory',  'add default property')
        }
    }
    //

    // You can also import aliases.

    //
    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                },
                PARSE_ERROR: 'unable to parse',
                FILE_ERROR: {
                    code: 'IO_ERROR',
                    message: 'the file cannot be read',
                    type: 'file'
                }
            })
        }

        class Derived {
            static Error = Interrupt.create('Derived.Error', Config.Error, function ({ Super }) {
                console.log(Super.Aliases)
                return {
                    IO_ERROR: Super.Codes.IO_ERROR,
                    ...Super.Aliases
                }
            })
        }

        okay(Config.Error.IO_ERROR === Derived.Error.IO_ERROR, 'symbols inherited')

        try {
            throw new Derived.Error('FILE_ERROR')
        } catch (error) {
            console.log(`${error.stack}\n`)
            okay(Interrupt.message(error), 'the file cannot be read', 'inherit message format')
            okay(error.code, 'IO_ERROR', 'inherit code name')
            okay(error.symbol, Config.Error.IO_ERROR, 'inherit code symbol')
            okay(error.recoverable, 'inherit default property')
            okay(error.type, 'file',  'add default property')
        }
    }

    {
        class Config {
            static Error = Interrupt.create('Config.Error', {
                IO_ERROR: {
                    message: 'i/o error',
                    recoverable: true
                }
            })
        }

        okay(new Config.Error().toString(), 'Config.Error', 'no message to string')
        okay(new Config.Error('IO_ERROR').toString(), 'Config.Error: i/o error', 'with message to string')
    }

})
