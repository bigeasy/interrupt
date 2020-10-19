const fs = require('fs').promises


async function main () {
    try {
        let string = await fs.readFile('diary.md', 'utf8')
        console.log(string)
        for (let i = 0; i < 16; i++) {
            string += string
        }
        await fs.readFile(string, 'utf8')
    } catch (error) {
        console.log(error.stack)
    }
}

main()
