const error = new Error('hello')

const Interrupt = require('..')
const Test = { Error: Interrupt.create('Test.Error') }
const errors = []

for (let i = 0; i < 100000; i++) {
    errors.push(error)
}

const start = Date.now()
const interrupt = new Test.Error('interrupt', errors)
console.log(Date.now() - start, interrupt.stack.length)

{
    const start = Date.now()
    const dedup = Interrupt.dedup(interrupt)
    console.log(Date.now() - start, dedup.length)
    console.log(dedup)
}
