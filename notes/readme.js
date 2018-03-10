var interrupt = require('..').createInterrupter('module')

var object = null
try {
    console.log('value is: ', object.value)
} catch (e) {
    throw interrupt('value', e, { object: object })
}
