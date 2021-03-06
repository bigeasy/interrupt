## Sat Dec 12 01:43:28 CST 2020

Going to break my Issues streak. No longer going to maintain a GitHub Issue for
reference and take the time and attention spared and use it to focus on
documentation. If it gets to where I'm actually managing an open source project
that requires coordinating many different contributors, I'll develop the habits
that faciliate that coordination. Currently, I'm burning up hours because of the
spread of NPM dependencies. If I update an upstream dependency I have to
recursively update the dependencies listing of the dependents which means
updating `package.json` and creating a throw away issue that is immediately
closed. I'm always looking up issues to reference when I make a commit. I'm
more likely to write a detailed commit message, keeping a journal of changes if
I'm not spending all this time building this index that I never use.

Could still maintain cross-references using hyperlinks to GitHub releases. If
they go away because GitHub goes away and that history is broken I wouldn't miss
it. Really, all this should be designed to allow me to reach a point where I'm
supporting an open source community, and that may never happen. It may never
happen because I'm too busy with this cargo cult behavior. It may never happen
because when it happens I find that it nothing that I can afford to do.

## Sat Dec 12 01:16:15 CST 2020

Here it is. All the effort to keep the `util.inspect` dump out of the fatal
stack trace defeated defeated at [this line](https://github.com/nodejs/node/blob/b589128f6f4c3c6f636bfb0146957847ef0a8d53/lib/internal/errors.js#L721).

Now I have to decide if I want to make all the properties non-enumerable, and I
think I do. Regardless, I have to figure out how to strip the properties dump
from the end of of the stack trace in case the user adds a property.

We could make all properties non-enumerable and have an `enumerable` property
which ought to defeat anyone's attempt to show properties that are not hidden.
Or we could call it `properties`.

This is all very complicated and highly magical, but that is just the nature of
this module.

## Mon Dec  7 03:44:35 CST 2020

Tempted to make all the reported properties children of `context` so that
`context` can be non-enumerable and so that no one will emit it. Node.js is
dumping enumerable properties on error and it's so ugly.

Also, need to parse my way around this in the parser.

## Tue Dec  1 22:00:30 CST 2020

Seems like we should use the parsed representation of an object to `dedup` so
that `dedup` works after the fact. It also means we need to know how to identify
error types in the parsed representation, which we could do with a special
wrapper object just for the sake of the constructor, or we could do it by just
insisting that an object have a very particlar shape, these properties with
these types, and a value JavaScript identifer here or there, or else it gets
serialized as JSON. If we ever do get a case of mistaken identity it would be
quite something.

An interrupt could stringify and parse or there could be a function to just
recursively JSONify an error, perhaps that is our JSONify function, and if so
then we should have it treat an error specially by breaking up the error and
serializing it as expected, with name, message, and a parsed stack trace.
Perhaps we stash JSONified objects in the Instance map?

We really want to add somewhere in the documentation that the user should
consider a generated object to be immutable, that any interpretation will be
done from the `stack` value and you should not reset it.

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
