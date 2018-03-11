var parse = require('../parse')

var interrupt = require('..').createInterrupter('module')

try {
    var object = null
    try {
        console.log('value is: ', object.value)
    } catch (e) {
        throw interrupt('value', e, { object: object })
    }
} catch (e) {
    console.log(parse(e.stack))
}
