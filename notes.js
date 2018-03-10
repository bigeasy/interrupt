var util = require('util')

console.log('---')

function X () {
    this.name = 'X'
    this.message = 'foo!'
    Error.captureStackTrace(this, X)
}
util.inherits(X, Error)

var x = new X

console.log(x instanceof Error)
console.log(x.toString())
console.log(new Error().toString())

throw new X
