var Benchmark = require('benchmark')

var suite = new Benchmark.Suite('async', { /*minSamples: 100*/ })

function body (async) { async()(null, 1) }

var interrupt = require('../interrupt').createInterrupter('x')

function fn () {
    interrupt('x')
}

var interrupt_ = require('../bootstrap_').createInterrupterCreator(Error)('x')

function fn_ () {
    interrupt_('x')
}

for (var i = 1; i <= 4; i++)  {
    suite.add({
        name: 'interrupt  stack ' + i,
        fn: fn
    })

    suite.add({
        name: 'interrupt_ stack ' + i,
        fn: fn_
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()
