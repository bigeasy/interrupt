module.exports = function (stack) {
    return parse(stack, true)
}

var JSON5 = require('json5')
var unstacker = require('stacktrace-parser')

function parse (stack, isRoot) {
    var $
    if (/^(?:Interrupt: )[\w\d.]+#[\w\d.]+\n[^\u0000]+\nstack:\n/m.test(stack)) {
        stack = stack.replace(/^[^\u0000]*\n(Interrupt: [\w\d.]+#[\w\d.]+\n)/, '$1')
        stack = stack.replace(/^Interrupt: /, '')
        $ = /^([\w\d.]+)#([\w\d.]+)\n/.exec(stack)
        var object = {
            type: 'Interrupt',
            qualifier: $[1],
            name: $[2],
            stack: null,
            context: null,
            causes: []
        }
        stack = stack.replace(/.*?\n+(?=[^\n])/, '')
        var chunks = stack.split(/^(?:cause|stack):$/gm)
        var context = chunks.shift()
        if (/\S/.test(context)) {
            object.context = JSON5.parse(context)
        }
        object.stack = unstacker.parse(chunks.pop())
        while (chunks.length) {
            object.causes.push(parse(chunks.shift().replace(/^    /gm, ''), false))
        }
        return object
    }
    if (isRoot) {
        return null
    }
    stack = stack.replace(/^\s+|\s+$/g, '')
    var notStack = stack.replace(/(?:\n    at [^\n]+)+/, '')
    if (notStack == stack) {
        return stack
    }
    var $ = /^([^:]+):(.*)/.exec(notStack)
    return {
        type: $[1],
        message: $[2],
        stack: unstacker.parse(stack.replace(notStack, ''))
    }
}
