[![Build Status](https://travis-ci.org/bigeasy/interrupt.svg)](https://travis-ci.org/bigeasy/interrupt) [![Coverage Status](https://coveralls.io/repos/bigeasy/interrupt/badge.svg?branch=master&service=github)](https://coveralls.io/github/bigeasy/interrupt?branch=master)

## Why?

Exceptions are useful. I like the concept. I've always been able to program
try/catch in Node.js regardless of whether a function is synchronous or
asynchronous because I've always programmed with `Cadence` which has a nice
implementation of asynchronous `try`/`catch` that pre-dates `await`.

Interrupt is an `Error` generator allows me to gather up errors from many
different waiting asynchronous calls and report them in a bouquet of failure on
the command line and in my server logs. Interrupt supports nested exceptions,
context for exceptions and complete error reports on fatal error exit. It does
this using the `stack` property which is specific to Node.js.

Interrupt does not attempt to create a library that is useful across all
JavaScript implementations. Why not attempt to make it work across all
implementations?

In JavaScript, Error defined as some arbitrary object with an `Error` type and a
`message` property. It is, in itself, not very useful.

The error type is supposed to be subclassed the way it is in other languages,
but for years `Error` would not subclass without [addition work](https://coderwall.com/p/m3-cqw/subclassing-error-in-javascript-is-harder-than-it-seems). Furthermore, it
was the only suggested use of subclassing in this prototypical language, so it
never did feel quite right. Finally, unlike other languages, you can't catch an
exception based on type. It was a behavior borrowed from other languages without
the key benefit; that you could build type based `catch` ladder.

The very useful stack trace you get in Node.js is a Node.js specific extension
for Node.js. In order for `Error` to be useful to Node.js we've had to add a
non-standard property that we in turn depend upon for meaningful fatal error
exits.

Interrupt organizes `Error` with custom properties so that you can start to
program with exceptions and use the patterns that are common to other languages.
It creates meaningful error reports by stuffing `message` with a plain-text,
human-readable, machine-parsable error report.

## Overview

This library generates and `Error` that is specific to Node.js and generally
more useful than the `Error` that comes with Node.js. This is fine because the
useful bits of `Error` that comes with Node.js are already non-standard and the
standard itself is not very useful at all.

JavaScript's minimal `Error` lacks support for some of the most common concepts
in exception handling found in other languages. Interrupt re-introduces:

 * One or more nested exceptions as causes.
 * Context for each exception in the form of attached properties.
 * Single statement delcare and throw exceptions.
 * Plain-text, human-readable and machine-parsable reports that include all of
 the above.
 * Plain-text, human-readable and machine-parsable that work with default
 Node.js error reporting.

Interrupt may appear to be a piffle but it is pretty effective and easier to use
than fiddling with `Error` directly even with ES6 support for classical
inheritance.

In addition to the useful report with nested exceptions, the ability to declare
and error, set context properties and throw it in one statement reduces chatter.
Exceptions are off the happy path and a lot of chatter to setup an exception is
aesethtically unpleasing. Interrupt makes it possible to throw a detailed
exception with a one liner (or one statementer.)

```javascript
var interrupt = require('.').createInterrupter('module')

var object = null
try {
    console.log('value is: ', object.value)
} catch (e) {
    throw interrupt('value', e, { object: object })
}
```

Running the above generates the following.

```
# node notes/readme.js

/home/alan/interrupt/notes/readme.js:7
    throw interrupt('value', e, { object: object })
    ^
Error: module#value

{ object: null }

cause:

    TypeError: Cannot read property 'value' of null
        at Object.<anonymous> (/home/alan/interrupt/notes/readme.js:5:38)
        at Module._compile (module.js:635:30)
        at Object.Module._extensions..js (module.js:646:10)
        at Module.load (module.js:554:32)
        at tryModuleLoad (module.js:497:12)
        at Function.Module._load (module.js:489:3)
        at Function.Module.runMain (module.js:676:10)
        at startup (bootstrap_node.js:187:16)
        at bootstrap_node.js:608:3

stack:

    at Object.<anonymous> (/home/alan/interrupt/notes/readme.js:7:11)
    at Module._compile (module.js:635:30)
    at Object.Module._extensions..js (module.js:646:10)
    at Module.load (module.js:554:32)
    at tryModuleLoad (module.js:497:12)
    at Function.Module._load (module.js:489:3)
    at Function.Module.runMain (module.js:676:10)
    at startup (bootstrap_node.js:187:16)
    at bootstrap_node.js:608:3
```

All information is available through `Error.stack` and is more or less human
readable.

Because it is all in the `Error.stack` property, it will be recorded by default
error logging implementations. It does not require a special
`unhandledException` method to get a detailed report. It works well with the
standard error logging of Node.js which prints `Error.stack` to the standard
error stream.

## Parsing Errors

In addition to being human readable the error can be parsed.

```javascript
var parser = require('interrupt/parse')

var interrupt = require('.').createInterrupter('module')

try {
    var object = null
    try {
        console.log('value is: ', object.value)
    } catch (e) {
        throw interrupt('value', e, { object: object })
    }
} catch (e) {
    console.log(parse(e.stack))
}
```

The above generates the following output.

```
{ type: 'Interrupt',
  qualifier: 'module',
  name: 'value',
  stack:
   [ { file: '/Users/alan/git/ecma/bluey/interrupt/notes/parse.js',
       methodName: 'Object.<anonymous>',
       lineNumber: 10,
       column: 15 },
     { file: 'module.js',
       methodName: 'Module._compile',
       lineNumber: 635,
       column: 30 },
     { file: 'module.js',
       methodName: 'Object.Module._extensions..js',
       lineNumber: 646,
       column: 10 },
     { file: 'module.js',
       methodName: 'Module.load',
       lineNumber: 554,
       column: 32 },
     { file: 'module.js',
       methodName: 'tryModuleLoad',
       lineNumber: 497,
       column: 12 },
     { file: 'module.js',
       methodName: 'Function.Module._load',
       lineNumber: 489,
       column: 3 },
     { file: 'module.js',
       methodName: 'Function.Module.runMain',
       lineNumber: 676,
       column: 10 },
     { file: 'bootstrap_node.js',
       methodName: 'startup',
       lineNumber: 187,
       column: 16 },
     { file: 'bootstrap_node.js',
       methodName: '<unknown>',
       lineNumber: 608,
       column: 3 } ],
  context: { object: null },
  causes:
   [ { type: 'TypeError',
       message: ' Cannot read property \'value\' of null',
       stack: [Array] } ] }
```

I don't imagine that it is going to be incredibly useful to be able to parse
exceptions, but that it is possible asserts that the necessary debugging
information is complete and well structured.

I find that having everything in `Error.stack` makes it hard for most logging
systems to lose errors. They might neglect to fire custom error handlers, but
they rarely neglect to record `Erorr.stack`. This is nice because you'll usually
only ever realize that the your penultimate error handling logic is broken when
your program is broken and an important parting message is getting dropped by
your logging mechanisms.

While I don't imagine that parsing errors will be incredibly useful, it might be
at some point, if you record enough state in the error context, you could go
back over your logs extracting errors and parsing them for application specific
error properties. I've never found a use for it, but there it is.

The human readability and completeness has been incredibly helpful, however.

## Catching By Classification

Interrupt uses the `Error.message` property as report. It is designed to be a
plain-text, human-readable report that can display in your terminal.

```javascript
var rescue = require('rescue')

var object = null
try {
    try {
        console.log(object.value)
    } catch (e) {
        throw inerrupt('foo', e, { object: object })
    }
} catch (e) {
    console.log(e.message)
}
```

The above outputs the following.

```
module#foo

{
    object: null
}

cause:

    TypeError: Cannot read property 'value' of null
        at Object.<anonymous> (/Users/alan/git/ecma/bluey/interrupt/notes/message.js:6:28)
        at Module._compile (module.js:635:30)
        at Object.Module._extensions..js (module.js:646:10)
        at Module.load (module.js:554:32)
        at tryModuleLoad (module.js:497:12)
        at Function.Module._load (module.js:489:3)
        at Function.Module.runMain (module.js:676:10)
        at startup (bootstrap_node.js:187:16)
        at bootstrap_node.js:608:3

stack:

```

Note that when you inspect the `message` property of an `Error` it does not
include the file and line where the exception was thrown nor the exception type.
That is added by the uncaught exception handler when printing to standard out.

In most textbook examples of try/catch, the author uses an if/else ladder that
is probing with `instanceof`. Interrupt adds the properties `qualifier`, `name`
and `qualified` that you can use in `switch` statement or `if`/`else` ladder.

```javascript
try {
    f()
} catch (e) {
    switch (e.qualified) {
    case: 'bigeasy.example#fs':
        console.log('I/O error with code: ' + e.cause.code)
        break
    case: 'bigeasy.example#http':
        console.log('HTTPO error with code: ' + e.statusCcode)
        break
    default:
        throw error
    }
}
```


I use a library I created [Rescue](https://gihub.com/bigeasy/resuce) to catch
Interrupt generated exceptions by their qualified names.

```javascript
var rescue = require('rescue')

var object = null
try {
    try {
        console.log(object.value)
    } catch (e) {
        throw inerrupt('foo', e, { object: object })
    }
} catch (e) {
    rescue(/^module#foo$/m, function (e) {
        console.log('unable to write object: ', e.object)
    })(e)
}
```

In the above, the `rescue` function returns a function that tests an exception's
message against the regular expression and if it matches call the given catcher
function. The `m` switch will cause `$` to match the end of a line, not the end
of string. The exception is multi-line because the qualified name of the exception is on
the first line of the message.

This is what I like to do for now, but I'll probably move to `switch` statements
now that I've finalized Interrupt.

## State of the Argument

Two different thoughts on the state of subclassed `Error` for exceptions in
JavaScript, the
[pro](https://medium.com/@xjamundx/custom-javascript-errors-in-es6-aa891b173f87)
and [con](http://gunargessner.com/subclassing-exception/).
