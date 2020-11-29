require('proof')(8, okay => {
    const Aggregate = require('../aggregate')

    const _globalThis = {
        AggregateError: {}
    }
    const missing = new Aggregate({})
    const present = new Aggregate(_globalThis)

    okay(missing.superClass === Error, 'missing superClass is Error')
    okay(present.superClass === _globalThis.AggregateError, 'present superClass is AggregateError')
    okay(missing.vargs([ 1 ], 'message'), [ 'message' ], 'missing message is just message')
    okay(present.vargs([ 1 ], 'message'), [ [ 1 ], 'message' ], 'present message is errors then message')
    okay(missing.vargs([ 1 ]), [], 'missing null message is empty')
    okay(present.vargs([ 1 ]), [ [ 1 ] ], 'present null message is errors')

    const object = {}
    present.errors(object, [ 1 ])
    okay(object.errors === void 0, 'present does not set errors')
    missing.errors(object, [ 1 ])
    okay(object.errors, [ 1 ], 'missing does set errors')
})
