
const pokers = []

pokers.push($ => $())

pokers.push($ => $())

console.log('--- pokers ---')

function poke (pokers, message) {
    const shifted = pokers.slice()
    function constructor () {
        const e = new Error(message)
        Error.captureStackTrace(e, constructor)
        return e
    }
    const poker1 = shifted.shift()
    const poker2 = shifted.shift()
    const p = () => poker1(constructor)
    const e = poker2(p)
    return e
}

function poke2 (pokers, message) {
    function constructor () {
        const e = new Error(message)
        Error.captureStackTrace(e, constructor)
        return e
    }
    const shifted = pokers.slice()
    let previous = constructor
    while (shifted.length != 0) {
        previous = function (caller, callee) {
            return () => caller(callee)
        } (shifted.shift(), previous)
    }
    return previous()
}

function poke3 (pokers, message) {
    function constructor () {
        const e = new Error(message)
        Error.captureStackTrace(e, constructor)
        return e
    }
    const shifted = pokers.slice()
    let previous = constructor
    while (shifted.length != 0) {
        previous = function (caller, callee) {
            return caller.bind(null, callee)
        } (shifted.shift(), previous)
    }
    return previous()
}

console.log(poke(pokers, 'poked'))
console.log(poke2(pokers, 'poked'))
console.log(poke3(pokers, 'poked'))
