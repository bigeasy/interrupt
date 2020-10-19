module.exports = function (stack) {
    return parse(stack, true)
}

var unstacker = require('stacktrace-parser')

function parse (stack, isRoot) {
    var $
    if (/^(?:Interrupt: )[\w\d.]+#[\w\d.]+\n[\S\s]+\nstack:\n/m.test(stack)) {
        stack = stack.replace(/^[\S\s]*\n(Interrupt: [\w\d.]+#[\w\d.]+\n)/, '$1')
        stack = stack.replace(/^Interrupt: /, '')
        $ = /^([\w\d.]+)#([\w\d.]+)\n/.exec(stack)
        var object = {
            type: 'Interrupt',
            qualifier: $[1],
            name: $[2],
            stack: null,
            context: null,
            causes: [],
            contexts: []
        }
        stack = stack.replace(/.*?\n+(?=[^\n])/, '')
        var chunks = stack.split(/^(?:cause|stack):$/gm)
        var context = chunks.shift()
        if (/\S/.test(context)) {
            object.context = JSON.parse(context)
        }
        object.stack = unstacker.parse(chunks.pop())
        while (chunks.length) {
            var dedented = chunks.shift().replace(/^    /gm, '')
            var $ = /(\n\{[\S\s]*?\n\})([\S\s]*)/m.exec(dedented)
            if ($) {
                object.contexts.push(JSON.parse($[1]))
                object.causes.push(parse($[2], false))
            } else {
                object.contexts.push(null)
                object.causes.push(parse(dedented, false))
            }
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
