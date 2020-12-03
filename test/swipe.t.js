// **TODO** Also convert this to Docco.

// **TODO** Document `Interrupt.Error` as an example of how to document an
// external error.

// **TODO** Already serializing `undefined` as `[ '_undefined' ]` has caught
// dead code in an Interrupt sneak (`ln -s`) preview.

// **TODO** Not sure how I'm feeling about `enumerable`.

// **TODO** Importing codes seems like it would silently fail.

//
require('proof')(2, async okay => {
    const Interrupt = require('..')

    // ## Thoughts on inhertiance.
    {
        // Declare a bunch of codes.

        //
        class Config {
            static Error = Interrupt.create('Config.Error', [
                'IO_ERROR',
                [ 'PARSE_ERROR', 'INVALID_ARGUMENT' ],
                function (codes) {
                    return 'RANGE_ERROR'
                }
            ])
        }
        //

        // Inherit codes as is. Simply inherit them. With default properties.

        //
        class Descend {
            static Error = Interrupt.create('Descend.Error', Config.Error, Config.Error.code('PARSE_ERROR').symbol, function (codes, inherited) {
                return [ inherited.IO_ERROR.code.symbol ]
            })
        }

        okay(Descend.Error.IO_ERROR != null && Descend.Error.IO_ERROR === Config.Error.IO_ERROR, 'inherited code')
        okay(Descend.Error.PARSE_ERROR != null && Descend.Error.PARSE_ERROR === Config.Error.PARSE_ERROR, 'inherited another code')
    }
})
