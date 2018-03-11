[![Build Status](https://travis-ci.org/bigeasy/interrupt.svg)](https://travis-ci.org/bigeasy/interrupt) [![Coverage Status](https://coveralls.io/repos/bigeasy/interrupt/badge.svg?branch=master&service=github)](https://coveralls.io/github/bigeasy/interrupt?branch=master)

The problem with Error is that it reports one and only one message with very
little context other than the error message and stack trace. There are
additioanl concepts in exception handling missing in JavaScript that Interrupt
re-introduces.

 * One or more nested exceptions as causes.
 * Context for each exception in the form of attached properties.
 * Nested exceptions and context preserved in the `Error.stack` and extracted by
 parsing `Error.stack`.

Appears to be a piffle but it is pretty effective and easier to use than
fiddling with `Error` directly even with ES6 support for classical inheritence.

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

In addition to being human readable the error can be parsed.

```
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

## Catching Interrupts

Rather than have an if/else ladder that is probing with `instanceof` , I use a
library I created [Rescue](https://gihub.com/bigeasy/resuce) to catch Interrupt
generated exceptions by their qualified names.

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

In the above, the `rescue` function returns a function that test an exception's
message against the regular expression and if it matches call the given catcher
function. The exception is multi-line because the qualified name of the
exception is on the first line of the message.

Please note that when you inspect the `message` property of an `Error` it does
not include the file and line where the exception was thrown nor the exception
type. That is added by the uncaught exception handler when printing to standard
out.


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

The `message` property does not include the stack nor the type information. The
first line is the qualified exception name. You can match against that name
using the following regular expression.

```javascript
/^module#foo$/m
```

The `m` switch will cause `$` to match the end of a line, not the end of string.
