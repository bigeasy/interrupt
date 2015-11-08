Errors that you can catch by type.

Interrupt is part of the [Cadence](https://github.com/bigeasy/cadence) Universe.
Cadence provides a robust asynchronous try/catch mechansism. Thus, I use
try/catch error handling in all my evented Node.js programs.

When you throw an exception in any other language, you're able to catch those
exceptions by type, so that you only handle the exceptions you know how to
handle.

Generally, those are exceptions that you yourself have raised. With Interrupt,
you can throw exceptions that you'll handle only if they are the exceptions that
you yourself have thrown. You don't have to filter on exception message. You'll
catch your own exceptions unambiguously.

### Synopsis

```javascript
var assert = require('assert')
var interrupt = require('interrupt').createIterruptor()

try {
    interrupt.raise(new Error, 'convert', { value: 1 })
}  catch (error) {
    interrupt.rescue(function (error) {
        switch(error.type) {
        case 'convert':
            assert.equal(error.context, { value: 1 })
        }
    })(error)
}
```

In the above example we create a new exception by calling `interrupt.raise`,
passing a `new Error`, a string identifier, and some context.

In the catch block we call `interrupt.rescue()` with an error handler. That
error handler is only invoked if the error has passed through the
`raise()` function of the very same `Interruptor`. Otherwise, the exception is
rethrown.

### Unambiguous Exceptions

What if you want to catch an exception from a third party library. You use a
try/catch block to choke up on the point of failure and wrap the result in an
interupt.

```javascript
try {
    try {
        library.frobinate(1)
    } catch (error) {
        // almost certainly a frobination exception.
        interrupt.raise(new Error, 'frobinate', { cause: error })
    }
} catch (error) {
    interrupt.rescue(function (error) {
        assert.equal(error.context, { value: 1 })
    })(error)
}
```

In the above example we've put a catch block around the operation we know might
fail, that we know how to recover from, but rather than try and guess the error
in some remove catch block when it has unwound the stack, we immediately wrap it
in an Interrupt exception. The `rescue` function will only catch Interrupt
exceptions, it will rethrow all others.

In my programs, I find that the two patterns above make try catch useful again.

### With Cadence

When combine with Cadence, I have robuts asynchronous try/catch with unambiguous
error handling.

```javascript
function Service (processor) {
    this._processor = processor
}

Service.prototype.serve = cadence(function (async, file) {
    async([function () {
        async([function () {
            fs.readFile(file, 'utf8', async())
        }, function (error) {
            interrupt.raise(new Error, 'readFile', { cause: error })
        }], function (file) {
            this._processor.process(file, async())
        })
    }, function (error) {
        interrupt.rescue(function (error) {
            console.log('cannot read file: ' + file)
        })(error)
    }])
})
```

The above example shows how we can catch an error locally, then wrap it so that
we know to catch it in the outer most rescue loop. In this example, it would be
better to log and return, but imagine if you will a much more complicated
example where the file read is nested deeply in the call stack.

## Diary

Thoughts on future directions before 1.0.

```javascript
try {
    try {
        library.frobinate(1)
    } catch (error) {
        // almost certainly a frobination exception.
        interrupt.raise(new Error, 'frobinate', { cause: error })
    }
} catch (error) {
    interrupt.rescue({
        forbinate: function (error) {
            assert.equal(error.context, { value: 1 })
        },
        reticulate: function (error) {
            console.log(error.stack)
        }
    })(error)
}
```

Named an a map. This is a way to do a catch block, but why not just do a catch
block inside the function?

```javascript
try {
    try {
        library.frobinate(1)
    } catch (error) {
        // almost certainly a frobination exception.
        interrupt.raise(new Error, 'frobinate', { cause: error })
    }
} catch (error) {
    interrupt.rescue(function (error) {
        switch (error.type) {
        case 'badness':
            require('goodness').reform(error)
            break
        case 'frobinate':
        case 'reticuate':
            console.log(error.stack)
            break
        default:
            console.log('mystery error!')
            break
        }
    })(error)
}
```

The point is to avoid untestable unit test branches. This should be added to the
documentation, everywhere, that I'm a coverage driven test driven developer, and
I hate uncovered branches.

Also, with Cadence, I see this happening. Can't explain in the `README.md` how
cool it is. You'd have to have a lot of Cadence code, or code ported from
something else to Cadence, to see the precision.

```javascript
function Service (processor) {
    this._processor = processor
}

Service.prototype.serve = cadence(function (async, file) {
    async([function () {
        async([function () {
            fs.readFile(file, 'utf8', async())
        }, /^ENOENT$/, function (error) {
            interrupt.raise(new Error, 'readFile', { cause: error })
        }], function (file) {
            this._processor.process(file, async())
        })
    }, interrupt.rescue(function (error) {
        switch (error.type) {
        case 'readFile':
            console.log(synonymous.format('en_US', [ 'fs' ], error.type, error.context))
            break
        case 'badness':
            require('goodness').reform(error)
            break
        case 'frobinate':
        case 'reticuate':
            console.log(error.stack)
            break
        default:
            console.log('mystery error!')
            break
        }
    })])
})
```
