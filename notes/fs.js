const fs = require('fs').promises
const path = require('path')
const assert = require('assert')

async function main () {
    try {
        await fs.open(path.resolve(__filename, 'x'))
    } catch (error) {
        console.log(error.stack)
    }
    try {
        assert(false)
    } catch (error) {
        console.log(error.stack)
    }
}

main()
