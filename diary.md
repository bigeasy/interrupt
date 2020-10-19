## Mon Oct 19 16:53:27 CDT 2020

Could use `sprintf` to create formatted messages, but I don't know that I really
want formatted messages. For my purposes it is enough to have the contextual
JSON dumped and to avoid thinking too hard about how to compose an error
message.

Not even sure I like the `util.format` foratting that is there now.

With the `util.format` I'm likely to duplicate arguments, one to format and one
to the context dump, but maybe the formatted message and the context are often
different. Dedup is enough of a win for this iteration.

## Mon Oct 19 15:41:53 CDT 2020

There are some trade offs to consider with including messages in the stack
trace. Can see why this has been avoiding in JavaScript and at the core of
Node.js. Imagine you invoke `fs.writeFile(filename, string)` with the arguments
transposed. What does the message read? Well, bad example. Imagine you read the
file and its not there. Basically, big long string for the file name, error
occurs.

Well, Node.js gives you the name of the file in the error message that is that
big long string. So, they do it already, but it can get out of hand.

I imagine if I'm trying to guard an interface by complaining about the
invocation of functions on that interface, there is the potential to generate
useless errors that reflect back obviously incorrect arguments such as these.

But, my primary application is runtime diagnostics of more pernicious errors,
not developer education. I want the context information that comes with errors,
and I don't want to be shy about it.

Seems to me that for interface enforcement we could use the `sprintf` trick of
providing functions that are resolved only if an exception is generated.

```
FooError.assert('FOO_INVALID_FILENAME', { filename: () => filename.substr(0, 256) })
```

This way we don't do the string manipulation when we invoke `assert`, only if
the assertion is invalid.

## Sun Oct 18 17:07:00 CDT 2020

Wouldn't it be nice if we could do things like `dedup` and `filter` after the
fact by parsing the stack? We could make the message easier to parse by
indenting every subsequent line after the first line. Then the context dump
follows, so the first line dedented by four and starting with `{` is the
beginning of the context.

Then for causes that are not errors we can put type in front of the value just
as we do with errors, so that `Object`, `Boolean`, `String` and `Number` are
easy enough to determine how to parse. Grab the value and parse it using JSON.

That is, serialize with the type followed by JSON serialization. For this we
could even add Array. It breaks down at some point, if the user gives us an
object we can't serialize with JSON, so maybe we have some other indicator, such
as `undefined`, or `null`, something that would never reasonably be a class
name, or maybe just `:` with no name.

We wouldn't be able to turn things into Errors again. We can't assume that a
post-processor has the classes available, but we can regenerate the stack traces
deduped or filtered.

Working from parse would remove the need for the `WeakMap` that tracks `context`
and `message`.
