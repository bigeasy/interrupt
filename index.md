# Interrupt

## API

```text
UserError = Interrupt.create(className[, superClass ][, codesObject | codesArray | code ]*)
```

 * `className` &mdash; The class name. It can include dots to appear dot
 qualified in stack traces.
 * `superClass` &mdash; The optional super class of the `Interrupt` derived
 class. The class must be derived from `Interrupt`.
 * `codesObject` &mdash; An optional map of error codes to error code
 definitions where an error code definition can be one of the following.
    * `String` &mdash; The `sprintf` message format with named parameters.
    * `Object` &mdash; A set of properties that will be set on the exception
    when constructed. A `message` property, if present, will be used for the
    `sprintf` message format.
 * `codesArray` &mdash; An optional array of `String` message codes to define
 with no message format or default properties.
 * `code` &mdash; A `String` code to define with no message format or message
 properties.
 * `codesFunction` &mdash; A function that is envoke with object containing a
 map of the codes already defined mapped to their symbols that returns either a
 `codesObject`, `codesArray`, `code`, or another `codesFunction`.

Create a new error class derived from `Interrupt`. The class name is required
and must be a valid JavaScript identifier or a dot separated path of valid
JavaScript identifiers.

Code definition will register codes for the generated `Interrupt` object and and
create associated `Symbols` for each code. Each code must be specified only once
or else an exception is raised.

For each code a static property is added to the generated error class with the
name of the code and the symbol for the code as a value.

```text
interrupt = new UserError(< properties | < code | message > | error | [ error* ] | stackTraceLimit >*)
interrupt = new UserInterrupt()
```

Where options can be.

 * `properties` &mdash; An object used to define options and additional
 properties to set on constructed error. If a property is one one of the special
 properties defined below, the given value will be set as a property on the
 constructed error. The property must be a valid JavaScript identifier or one of
 the special `#` prefixed properties. If a property is prefixed with an
 underscore `_` it will be used for `sprintf` formatting but not set as a
 property on the constructed error.
    * `code` &mdash; The string name of a code to use as the prototype for the
    constructed error. The symbol of the associated code will be used to set the
    `symbol` property of the constructed error.
    * `message` &mdash; The `sprintf` message format used to set the `message`
    property of the generated error.
    * `errors` &mdash; An array of errors that will be added to the `errors`
    array property of the constructed error.
    * `'#type'` &mdash; An optional type indicator that if given, must always
    have the value `Interrupt.OPTIONS`.
    * `'#errors'` &mdash; An array of error objects that describe construction
    errors encountered while constructing the error itself.
    * `'#callee'` &mdash; a function used to prune the stack trace, stack frames
    above the given `#callee` will be removed from the stack trace using
    `Error.captureStackTrace()`.
 * `code | message` &mdash; The string code name or the code symbol of the code
 to assign to the exception. If the code is a string name and does not match the
 existing set of codes, the code is used as a `sprintf-js` formatted message
 format.
 * `error` &mdash; An object that is `instanceof Error` that will be added to
 the array of nested property `errors` in the constructed object.
 * `errors` &mdash; An array of zero, one or more nested errors that represent
 the cause of the this exception used to set the `errors` property of the
 exception.
 * `stackTraceLimit` &mdash; `Infinity` or on integer greater than or equal to
 zero. The stack trace limit used to generate the stack trace. If `0` the stack
 heading will not be displayed in the stack trace message of the generated
 error.

You can specify any of the arguments any number of times. The results are merged
to create a final set of options used to create the constructed error.
The `error` and `errors` arguments and the `errors` property of a `properties`
object will be pushed onto a single array to create the array of nested errors
used for the `errors` property of the constructed object. The `'#errors'`
property of a `properties` object will also be pushed onto a single construction
errors array. All other arguments arguments will override previous value
specified if any.

The error constructor will not perform any assertions. It will not raise an
excpetion if it incounters invalid arguments. It ignores arguments it cannot
interpret or properties in the `properties` argument that are invalid (i.e.
null, wrong type, etc.) Any errors encoutered during construction will be
reported in the stack trace output in a construction errors section that follows
the properties section of the stack trace message. An array of construction
errors can also be obtained using `Interrupt.errors(error)`.

The `properties` are used to both specify options and set additional properties
on the constructed error. Special properties will not be used to set properties
on the constructed error. Additional properties must have valid JavaScript
identifier names otherwise they are ignored and construction error is recorded.

Names in a `properties` object prefixed with an underscore `_` will not be set
on the constructed error, but they will be available to `sprintf` to format the
`message` property of the constructed error.

The `errors` property must be an array and can contain objects of any type, not
just instances of `Error`.

The `#type` property is only useful in specifying currying to helper functions.
**TODO** Just link to to the `readme.t.js`. To hard to explain.

The `'#errors'` array can be used by helper functions like `assert` to report
construction errors encountered prior to calling the error constructor. A
construction error should have string `code`, a non-enumberable `symbol`
property whose value is a `Symbol` with a display name is the same as the code,
a `message`. Any additional properites should be have JavaScript identifier
names and JSON serializable values.

```
UserError.codes
```

 * <String[]> The names of the error codes for the error.

An array containing the names of all the codes for the error.

```
UserError.<USER_CODE>
```

 * <Symbol> The symbol associated with a user defined error code.

A static property for each code defined in the `Interrupt.code()` declarator is
defined on the generated error class. This symbol will be used to set the
`symbol` property of constructed errors.

```javascript
const ConfigError = Interrupt.create('ConfigError', 'IO_ERROR')

assert(typeof ConfigError.IO_ERROR === 'symbol')
```

```text
Interrupt.Code((?: (?: code, symbol ) | object ))
```

 * code `<String>` &mdash; The name of the code.
 * symbol `<Symbol>` &mdash; A symbol to associate with the code.
 * object `<Object>` &mdash; An object whose `code` and `symbol` properties are
 used to construct a code object.

Construct a code object with an enumerable `code` name property and a
non-enumerable `symbol` property for the code symbol.

This is a helper function to add additional codes to your constructed errors
that you can test by symbol at runtime, but whose symbols will be excluded from
JSON serialized output.

```text
Interrupt.OPTIONS
```

 * <Symbol> The value of `'#type'` in an options object.

When you construct an options object using `Interrupt.options()` the `'#type'`
property is set to this symbol to unambiuously identify the object as an options
object.

```text
Interrupt.CURRY
```

 * `<Object>` An object containing a `#type'` property with a value of
 `Interrupt.OPTIONS`.

A pre-constructed options object for use with user-defined helper functions to
indicate that the helper function should be curried. An object with a `'#type'`
property whose value is `Interrupt.OPTIONS` is an options object and cannot be
mistaken for any other type.

```text
Interrupt.message(error)
```

 * error `<Object>` &mdash; Any value other than `null` or `undefined`.

If `error` is an instance of `Interrupt`, return the `sprintf` formatted error
message without the additional stack trace formatted message. If `error` is any
other object return the `message` property of that object.

```text
Interrupt.parse(stack)
```

 * stack `<String>` &mdash; A stack trace string from `Error.stack`.

Parse a stack trace from any `Error` instance. Returns an object with the error
class, message and an array with the parsed stack trace. If the stack trace is
from an instance of `Interrupt` or the result of calling `Interrupt.stringify()`
on a non-Interrupt `Error` the resuling object tree will include enumerable
`Error` properties and nested errors.

```text
Interrupt.explode(error)
```

 * `<Object>` Any value other than `null` or `undefined`.

**TODO** Why not `null` or `undefined`. What if you pass in `1`. Can't we just
JSON stringify and parse something?
**TODO** Return the component parts and a flag instead of the array encasement.

Converts an `Error` into an object containing its component parts for
serialization in the Interrupt serialization format or else returns an array
containing the component parts if the Interrupt serialization would be
malformed.

```text
Interrupt.stringify(error)
```

 * `<Object>` An instance of `Error`.

Serialize the given `error` using the Interrupt serialization format. If `error`
is an instance of `Interrupt`, simply return `error.stack`. Otherwise serialize
the error using the Interrupt serialization format including enumerable
properties and nested errors. If the `Error` properties would create a malformed
Interrupt serialization, serialize the `Error` properties as JSON instead.

```text
userError[util.inspect.custom](depth, options)
```

 * depth `<Integer>` The depth to recurse when serializing. (ignored)
 * options `<Object>` The inspect options. (ignored)

Implements serialization used by `util.inspect`. `util.inspect` is used to dump
the exception to standard error when an Node.js program has an uncaught
exception or an unhandled rejection. `util.inspect` would ordinarily duplicate
the dispaly of enumerable properties using its own unparsible serialization
format. This implementation returns the parsible `error.stack` property of an
instance of `Interrupt`.

```text
userError.toString()
```

Returns the generated class name and the `sprintf` formatted message spearated
by a colon. Without overriding it, the full message with properties, nested
errors and headings would be returned.
