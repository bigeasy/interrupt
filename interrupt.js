var slice = [].slice

// todo: create strings parser.
function Interrupt () {
    this._types = {}
}

Interrupt.prototype.panic = function (error, type) {
    this._types[type] || (this._types[type] = {})
    error.message = error.type = type
    error.typeIdentifier = this._types[type]
    var context = error.context = {}
    slice.call(arguments, 2).forEach(function (values) {
        for (var key in values) {
            context[key] = values[key]
        }
    })
    error.context = context
    throw error
}

Interrupt.prototype.rescue = function (catcher) {
    return function (error) {
        if (error) {
            if (error.type && this._types[error.type] === error.typeIdentifier) {
                catcher(error)
            } else {
                throw error
            }
        }
    }.bind(this)
}

module.exports = function (messages) {
    return new Interrupt
}
