describe('parse', () => {
    const fs = require('fs')
    const assert = require('assert')
    const path = require('path')
    it('can parse', () => {
        const stack = fs.readFileSync(path.join(__dirname, 'parse.txt'), 'utf8')
        const parse = require('../parse')
        const parsed = parse(stack)
        assert.deepStrictEqual(parsed.context, { a: 1 }, 'parsed context')
        assert.equal(parsed.causes[2], '1', 'parsed nested')
        assert.equal(parse(''), null, 'parsed nope')
        assert.deepStrictEqual(parsed.causes[1].contexts[0], { a: { c: 3  } }, 'parsed error context')
    })
})
