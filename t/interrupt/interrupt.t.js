require('proof')(1, prove)

function prove (assert) {
    var interrupt = require('../..')
    assert(interrupt, 'require')
    return
    try {
        interrupt.panic('type', { value: 1 })
    } catch (error) {
        interrupt.rescue(function (error) {
            switch (error.type) {
            case "type":
                assert(error.context, { value: 1 }, 'context')
            }
        })(error)
    }


}
