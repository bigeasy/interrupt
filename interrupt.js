var slice = [].slice

// todo: create strings parser.
function Interrupt () {
    this._types = {}
}

Interrupt.prototype._populate = function (error, type, vargs) {
    this._types[type] || (this._types[type] = {})
    error.message = error.type = type
    error.typeIdentifier = this._types[type]
    var context = error.context = {}
    vargs.forEach(function (values) {
        for (var key in values) {
            context[key] = values[key]
        }
    })
    error.context = context
    return error
}

Interrupt.prototype.error = function (error, type) {
    return this._populate(error, type, slice.call(arguments, 2))
}

Interrupt.prototype.panic = function (error, type) {
    throw this._populate(error, type, slice.call(arguments, 2))
}

Interrupt.prototype.type = function (error) {
    if (error.type
        && this._types[error.type]
        && this._types[error.type] === error.typeIdentifier
    ) {
        return error.type
    }
    return null
}

Interrupt.prototype.rescue = function (catcher) {
    var interrupt = this
    return function (error) {
        if (error) {
            if (interrupt.type(error) != null) {
                return catcher(error)
            } else {
                throw error
            }
        }
    }
}

module.exports = function (messages) {
    return new Interrupt
}
