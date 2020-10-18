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
