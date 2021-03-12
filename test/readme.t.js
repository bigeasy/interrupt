// [![Actions Status](https://github.com/bigeasy/interrupt/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/interrupt/actions)
// [![codecov](https://codecov.io/gh/bigeasy/interrupt/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/interrupt)
// [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
//
// Nested exceptions with elaborate stack traces for Node.js.
//
// | What          | Where                                         |
// | --- | --- |
// | Discussion    | https://github.com/bigeasy/interrupt/issues/1 |
// | Documentation | https://bigeasy.github.io/interrupt           |
// | Source        | https://github.com/bigeasy/interrupt          |
// | Issues        | https://github.com/bigeasy/interrupt/issues   |
// | CI            | https://travis-ci.org/bigeasy/interrupt       |
// | Coverage:     | https://codecov.io/gh/bigeasy/interrupt       |
// | License:      | MIT                                           |
//
// Interrupt installs from NPM.

// Exceptions are nice. I like the concept. I've always done my best to employ them
// in JavaScript and Node.js but it isn't always easy.
//
// Interrupt is a module I created to address the problems with JavaScript's
// limited exception mechanism, solving the challenges I've encountered over the
// years that I'm sure you've encountered as well. It is not an elegant solution,
// but it is a solution none the less.
//
// ## Advocacy
//
// Interrupt allows you to get exceptions that have a file name and line number
// from your program, instead of a stubby stack trace that points to the wilderness
// of the Node.js source, or [no stack trace at
// all](https://github.com/nodejs/node/issues/30944). It does this with some
// syntactical struggle, but without the expensive superfluous stack trace
// generation of the long stack trace modules.
//
// Interrupt allows you to nest exceptions so you can provide application context
// to system and library exceptions.
//
// Interrupt allows you to cite multiple nested exceptions as the cause of your
// contextual exception which is necessary if you're doing any sort of parallel
// asynchronous programming where multiple parallel paths can raise exceptions.
//
// Interrupt uses and abuses the `Error.stack` property provided by Google V8 to
// generate an elaborate report from `Error.stack` including the `Error` type,
// message, context properties, and stack trace along with the error messages and
// stack traces of all the nested errors.
//
// Interrupt's elaborate `Error.stack` is machine readable so you could conceivably
// process these stack traces programmatically after gathering them from production
// logs.
//
// Interrupt can report it's elaborate stack trace de-duped with a count of similar
// exceptions so that when great many parallel operations raise the same you don't
// have wade through the repetitive stack traces to see if there is anything unique
// about one of them.
//
// Interrupt endeavours to do all this with a minimum of extra code and code paths
// so you can format exception messages with `sprintf-js`, set properties, specify
// nested expressions the constructor, often as a one-liner. **TODO** Basically
// advocating one-liners, poorly worded.
//
// This `README.md` is also a unit test using the
// [Proof](https://github.com/bigeasy/proof) unit test framework. We'll use the
// Proof `okay` function to assert out statements in the readme. A Proof unit test
// generally looks like this.

require('proof')(7, async okay => {
    // The only way to see the elaborate stack trace output is to run this test at the
    // command line, so please do so. **TODO** No, we're going to fix that.
    //
    // Interrupt is targeted for Node.js 12 or greater. Note that we are running with
    // `--async-stack-traces` enabled and to enjoy all the features discussed in this
    // readme you need to be running Node.js 14.
    //
    // The Interrupt module exports an `Interrupt` constructor.

    const Interrupt = require('..')

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

    // All of the examples in this code are _contrived_, and in practice, I'm
    // never quite this zealous with my use of exceptions or Interrupt.
    //
    // ## Happy Path vs Error Path
    //
    // Throughout we'll be referring to the happy path and the error path.
    //
    // The happy path is the path of code execution where everything goes as
    // expected. It is the code path that gets the most exercise, the path that
    // receives the most robust testing.
    //
    // The error path is the path of code excution that is followed when things
    // go sideways. One would hope that the error path is not often executed
    // during normal operation. One would expect the error path to be followed
    // as a result unforseen circumstances that might not have been considered
    // during development. Sadly, the error path usually does not receive a lot
    // of testing. One should tread lightly on the error path.
    //
    // Interrupt endevours to be exacting on the happy path and accommodating on
    // error path. It has a lot of assertions on functions that are executed
    // during normal operation and a lot of fallbacks on the functions that are
    // executed during exception handling.
    //
    // When we speak of the error path in this documenation, we are urging
    // caution and justifing our accommodations. When we speak of the happy path
    // in this documentation we are urging rigor and justifying our assertions.
    //
    // ## Errors by Code
    //
    // Errors in JavaScript have very little context information. The only
    // properties defined by the spec are `name` and `message`.
    //
    // **TODO** As of this writing, Interrupt is targeted for Node.js and Google
    // V8 only, but can probably be ported to other JavaScript engines if
    // someone would like to recommend a cross-browser development setup. I'm
    // open to porting if someone is interested.
    //
    // The `message` is supposed to be human readable and because of this it
    // doesn't serve well as a programmatic indication of error type.

    {
        console.log('\n--- message only Errors ---\n')

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
            // If the file doesn't exist, use a default configuration, otherwise
            // rethrow any configuration exceptions.
            if (/file unreadable/.test(error.message) && error.cause.code == 'ENOENT') {
                config = { size: 5 }
            } else {
                throw error
            }
        }

        okay(config, { size: 5 }, 'used a default configuration (example)')
    }

    // Interrupt prefers to use codes as well. Interrupt encourages you to
    // create a set of error codes for your module.
    //
    // You can still create an Error object heirarchy using Interrupt, but once
    // you have a set of codes you start to see how they're easier to work with.
    //
    // You declare your codes when you create your Interrupt derived class. You
    // can obtain a list of declared codes using the static `codes` property.
    //
    // In the example below we declare a `ConfigError` class with an object
    // that maps the error codes to an error message. We can get a list of the
    // codes defined using the `codes` property of the generated class.

    {
        okay(Interrupt.prototype instanceof Error, '`Interrupt` is an `Error`')

        const ConfigError = Interrupt.create('ConfigError', {
            IO_ERROR: 'unable to read config file',
            PARSE_ERROR: 'unable to parse config file'
        })

        const codes = ConfigError.codes
        okay(codes.sort(), [ 'IO_ERROR', 'PARSE_ERROR' ], 'set of generated error codes')

        okay(typeof ConfigError.IO_ERROR, 'symbol', 'constant that maps an error code name to a symbol')
        okay(typeof ConfigError.PARSE_ERROR, 'symbol', 'one for each error code')

        okay(ConfigError.prototype instanceof Interrupt, 'generated error is an `Interrupt`')
        okay(ConfigError.prototype instanceof Error, 'generated error is therefore also an `Error`')
    }
})

// You can run this unit test yourself. The `--async-stack-traces` flag is not
// necessary on Node.js 14 or above.

// Other languages have the ability to catch an exception by type. This
// ability to catch by type is where the idea for an exception class for
// each type of error comes from.
//
// JavaScript does not have this ability. Once the exception is caught it
// must be filtered through an `if`/`else` ladder with `instanceof` to
// determine the type of exception. Using entire classes for what is
// essentially a flag is a heavyweight approach. The user now has to import
// the module's exceptions into the namespace of their application to use
// them as test conditions. Not only do we have to add this `if`/`else`
// ladder, we have to our `require` statements start to look like this.

// This is so foreign to JavaScript, to use type information directly,
// instead of using ploymorphism. Kinda feels like we're moving the
// internals of a dependency into our module to check a flag.
//
// Node.js itself doesn't extend the error class heirarchy by much.  In
// fact, in our code we further test the cause of the I/O error by checking
// a `code` property to see if it is a `ENOENT`, the POSIX code for a
// missing file.
//
// The Node.js libraries use a base `Error` class (with the exception of the
// `assert` module) and simply set a `code` on the error object. All of the
// errors eminating from the standard Node.js modules have a `code` property
// and each `code` property has associated documentation.
//
// If you use codes your module can adhere to this practice.
