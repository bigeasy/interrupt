require('proof')(2, prove)

/*
    ___ strings: en_US ___

        convert : value, outcome ~ You failed to convert %s to %d.
        outcome : count, count ~ You have %d #{cat/cats}.

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
}
