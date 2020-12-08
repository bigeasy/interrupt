const Interrupt = require('..')

class Config {
    static MAX_JSON = 3584

    static Error = Interrupt.create('Config.Error', [
        'NULL_ARGUMENT', 'INVALID_ARGUMENT'
    ], {
        'NULL_JSON': {
            code: 'NULL_ARGUMENT',
            message: 'the JSON string to parse must not be null'
        },
        'INVALID_JSON_TYPE': {
            code: 'INVALID_ARGUMENT',
            message: 'the JSON to parse must be a string, got type: %(_type)s'
        },
        'TOO_MUCH_JSON': {
            code: 'INVALID_ARGUMENT',
            message: 'the JSON string must be less than %(_max).2d kb'
        },
        'INVALID_JSON': 'unable to parse JSON string'
    })

    parse (json) {
        Config.Error.assert(json != null, 'NULL_JSON')
        Config.Error.assert(typeof json == 'string', 'NULL_JSON', { _type: typeof json })
        Config.Error.assert(json.length < Config.MAX_JSON, 'TOO_MUCH_JSON', {
            _max: Config.MAX_JSON / 1024,
            length: json.length
        })
        try {
            return JSON.parse(json)
        } catch (error) {
            throw new Config.Error('INVALID_JSON', error)
        }
    }

    async load (filename) {
        try {
            return this.parse(await fs.readFile(filename, 'utf8'))
        } catch (error) {
            if (error instanceof Config.Error) {
                // Here's an idea for you...
                throw Config.Error.amend(error, { filename })
            }
            throw new Config.Error('UNABLE_TO_READ_CONFIG', error, { filename })
        }
    }

    async loadOrDefault (filename) {
        try {
            return await this.load()
        } catch (error) {
            if (error.code === Config.Error.IO_ERROR) {
                return { settings: { volume: 0 } }
            }
            throw error
        }
    }
}

async function main () {
    const config = new Config
    assert.deepEqual(console.log(config.loadOrDefault(path.join(__dirname, 'missing.json'))), {
        settings: { volume: 0 }
    })
}

main()
