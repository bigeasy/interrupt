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

All information is availbable through `Error.stack` and is more or less human readable.
