require('proof')(7, prove)

/*
    ___ strings: en_US ___

        convert : value, outcome ~ You failed to convert %s to %d.
        outcome : count, count ~ You have %d %{cat/cats}.

    ___ en_US ___
 */

function prove (assert) {
    var interrupt = require('../..')()
    try {
        interrupt.panic(new Error, 'convert', { value: 1 })
    } catch (error) {
        interrupt.rescue(function (error) {
            switch (error.type) {
            case 'convert':
                assert(error.context, { value: 1 }, 'rescue')
            }
        })(error)
    }

    interrupt.rescue(function (error) {
        switch (error.type) {
        case 'convert':
            assert(error.context, { value: 1 }, 'rescue')
        }
    })(interrupt.error(new Error, 'convert', { value: 1 }))

    try {
        throw new Error('rethrown')
    } catch (error) {
        try {
            interrupt.rescue(function () {})(error)
        } catch (error) {
            assert(error.message, 'rethrown', 'rethrow')
        }
    }

    interrupt.rescue(function () {})(null, 1)

    // todo: I don't believe I've ever used this. looks like one callback too
    // many.
    interrupt.rescue(function () {
    }, function (error) {
        assert(error.message, 'uncaught', 'callback')
    })(new Error('uncaught'))

    assert(interrupt.type(new Error), null, 'type untyped')
    assert(interrupt.type(interrupt.error(new Error, 'convert')), 'convert', 'type typed')
    var error = new Error
    error.type = 'unknown'
    assert(interrupt.type(error), null, 'type unknown')
}
