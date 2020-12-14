{
    const multi = `
        this is a multi-line

        message
    `

    function multiLine (message) {
        if (/^[^\S\n]*\n[^\S\n]*\n/.exec(message)) {
            return message.replace(/^[^\S\n]*\n/, '')
        }
        if (/^[^\S\n]*\n/.test(message) && /\n[^\S\n]*$/.test(message)) {
            const trimmed = message.replace(/^[^\S\n]*\n|\n[^\S\n]*$/g, '')
            let min = Infinity
            for (const match of trimmed.matchAll(/^$|(^ *)(\S)/gm)) {
                if (match[1] != null) {
                    min = Math.min(match[1].length, min)
                }
            }
            return trimmed.replace(new RegExp(`^ {${min}}`, 'gm'), '')
        }
        return message
    }

    console.log(multiLine(multi))
    console.log(multiLine(`

        this is a multi-line

        message
    `) == `
        this is a multi-line

        message
    `)
    console.log('-')
}
