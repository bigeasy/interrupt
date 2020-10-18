const RE_FILE_LINE = /[\s\S]*?^    at (?:(.*):(\d+):\d+|.* \((.*):(\d+):\d+\))$/m

module.exports = function (stack) {
    const match = RE_FILE_LINE.exec(stack)
    if (match == null) {
        return [ null, null ]
    }
    match.shift()
    while (match[0] == null) {
        match.shift()
    }
    return [ match[0], +match[1] ]
}
