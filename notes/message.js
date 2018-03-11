var interrupt = require('..').createInterrupter('module')

var object = null
try {
    try {
        console.log(object.value)
    } catch (e) {
        throw interrupt('foo', e, { object: object })
    }
} catch (e) {
    console.log(e.message)
}
