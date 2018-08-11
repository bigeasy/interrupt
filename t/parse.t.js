require('proof')(4, prove)

function prove (okay) {
    var fs = require('fs')
    var path = require('path')
    var stack = fs.readFileSync(path.join(__dirname, 'parse.txt'), 'utf8')
    var parse = require('../parse')
    var parsed = parse(stack)
    okay(parsed.context, { a: 1 }, 'parsed context')
    okay(parsed.causes[2], '1', 'parsed nested')
    okay(parse(''), null, 'parsed nope')
    okay(parsed.causes[1].contexts[0], { a: { c: 3  } }, 'parsed error context')
}
