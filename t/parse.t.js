require('proof')(1, prove)

function prove (okay) {
    var fs = require('fs')
    var path = require('path')
    var stack = fs.readFileSync(path.join(__dirname, 'parse.txt'), 'utf8')
    var parse = require('../parse')
    okay(parse(stack).causes[2], '1', 'parsed nested')
}
