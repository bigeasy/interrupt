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

// **TODO** Also convert this to Docco.

// **TODO** Document `Interrupt.Error` as an example of how to document an
// external error.

// **TODO** Already serializing `undefined` as `[ '_undefined' ]` has caught
// dead code in an Interrupt sneak (`ln -s`) preview.

// **TODO** Not sure how I'm feeling about `enumerable`.

// **TODO** Importing codes seems like it would silently fail.

//
require('proof')(2, async okay => {
    const Interrupt = require('..')

    // ## Thoughts on inhertiance.
    {
        // Declare a bunch of codes.

        //
        class Config {
            static Error = Interrupt.create('Config.Error', [
                'IO_ERROR',
                [ 'PARSE_ERROR', 'INVALID_ARGUMENT' ],
                function (codes) {
                    return 'RANGE_ERROR'
                }
            ])
        }
        //

        // Inherit codes as is. Simply inherit them. With default properties.

        //
        class Descend {
            static Error = Interrupt.create('Descend.Error', Config.Error, Config.Error.code('PARSE_ERROR').symbol, function (codes, inherited) {
                return [ inherited.IO_ERROR.code.symbol ]
            })
        }

        okay(Descend.Error.IO_ERROR != null && Descend.Error.IO_ERROR === Config.Error.IO_ERROR, 'inherited code')
        okay(Descend.Error.PARSE_ERROR != null && Descend.Error.PARSE_ERROR === Config.Error.PARSE_ERROR, 'inherited another code')
        //

        //

        //
        {
        }
    }
})
