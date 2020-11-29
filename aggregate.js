const hasAggregrateError = typeof AggregateError !== 'undefined'

class Aggregate {
    constructor (globalThis) {
        this.hasAggregrateError = !! globalThis.AggregateError
        this.superClass = this.hasAggregrateError ? globalThis.AggregateError : Error
    }

    vargs (errors, message) {
        if (message == null) {
            return this.hasAggregrateError ? [ errors ] : []
        }
        return this.hasAggregrateError ? [ errors, message ] : [ message ]
    }

    errors (error, errors) {
        if (!this.hasAggregrateError) {
            Object.defineProperty(error, 'errors', {
                value: errors,
                enumerable: false
            })
        }
    }

}

module.exports = Aggregate
