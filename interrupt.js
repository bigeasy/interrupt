const util = require('util')
const assert = require('assert')
const coalesce = require('extant')
const departure = require('departure')
const Keyify = require('keyify')
const MATERIAL = new WeakMap
const location = require('./location')

function stringify (object) {
    return JSON.stringify(object, function (key, value) {
        if (value instanceof Error) {
            var object = { message: value.message, stack: value.stack }
            for (var key in value) {
                object[key] = value[key]
            }
            return object
        }
        return value
    }, 4)
}

function _causes (vargs) {
    if (vargs[0] instanceof Error) {
        return [ vargs.shift() ]
    } else if (Array.isArray(vargs[0])) {
        return vargs.shift()
    }
    return []
}

function _message (messages, varg, merge) {
    if (Array.isArray(varg)) {
        const message = messages[varg[0]]
        if (message != null) {
            merge.code = varg[0]
            varg[0] = message
        }
        return varg
    }
    const message = messages[varg]
    if (message != null) {
        merge.code = varg
        return [ message ]
    }
    return [ varg ]
}

function _vargs (messages, vargs, callee) {
    const merge = {}
    return [
        util.format.apply(util, _message(messages, vargs.shift(), merge)),
        _causes(vargs),
        typeof vargs[0] == 'object'
            ? { ...merge, ...coalesce(vargs.shift(), {}) }
            : merge,
        coalesce(vargs.shift())
    ]
}

class Interrupt extends Error {
    constructor (messages, name, vargs) {
        if (vargs.length == 0) {
            super()
            MATERIAL.set(this, { message: null, context: {} })
            Object.defineProperties(this, {
                name: {
                    value: this.constructor.name,
                    enumerable: false
                },
                causes: { value: [] },
                contexts: { value: [] }
            })
            return
        }
        const [
            message, $causes, context, callee
        ] = _vargs(messages, vargs, null)
        let dump = message
        const contexts = []
        const causes = []
        const keys = Object.keys(context).length
        if (keys != 0 || $causes.length) {
            dump += '\n'

            if (keys != 0) {
                dump += '\n' + stringify(context) + '\n'
            }

            for (let i = 0, I = $causes.length; i < I; i++) {
                const cause = Array.isArray($causes[i]) ? $causes[i] : [ $causes[i] ]
                const text = (cause[0] instanceof Error)
                    ? coalesce(cause[0].stack, cause[0].message)
                    : cause[0].toString()
                const indented = text.replace(/^/gm, '    ')
                if (cause.length == 1) {
                    dump += '\ncause:\n\n' + indented + '\n'
                } else {
                    const contextualized = stringify(cause[1]).replace(/^/gm, '    ')
                    dump += '\ncause:\n\n' + contextualized + '\n\n' + indented + '\n'
                }
                causes.push(cause[0])
                // TODO Note that nullishness makes this useful and `||`
                // doesn't always do it.
                contexts.push(coalesce(cause[1]))
            }
        } else {
            dump += '\n'
        }

        dump += '\nstack:\n'
        super(dump)

        MATERIAL.set(this, { message, context })

        Object.defineProperty(this, "name", {
            value: this.constructor.name,
            enumerable: false
        })

        // FYI It is faster to use `Error.captureStackTrace` again than
        // it is to try to strip the stack frames created by `Error`
        // using a regular expression or string manipulation. You know
        // because you tried.

        if (callee != null) {
            Error.captureStackTrace(this, callee)
        }

        const assign = { label: message, causes, contexts, ...context }
        for (const property in assign) {
            // TODO No. This is bad. Not everyone is going to unit test their
            // exceptions and you don't check this with `assert` which gets unit
            // test coverage to it is on a clear path to production.
            assert(property != 'name')
            Object.defineProperty(this, property, { value: assign[property] })
        }
    }

    static create (name, ...vargs) {
        const messages = vargs.length > 0 && typeof vargs[0] == 'object' ? vargs.shift() : {}
        const superclass = typeof vargs[0] == 'function' ? vargs.shift() : Interrupt
        assert(superclass == Interrupt || superclass.prototype instanceof Interrupt)
        const interrupt = class extends superclass {
            constructor (...vargs) {
                if (superclass == Interrupt) {
                    super(messages, name, vargs)
                } else {
                    super(...vargs)
                }
            }

            static assert (condition, ...vargs) {
                if (!condition) {
                    vargs.unshift(null)
                    vargs.push(interrupt.assert)
                    throw new (Function.prototype.bind.apply(interrupt, vargs))
                }
            }
        }
        Object.defineProperty(interrupt, 'name', { value: name })
        Object.defineProperty(interrupt, 'messages', { value: messages })
        return interrupt
    }

    static dedup (error, keyify = (_, file, line) => [ file, line ]) {
        const seen = {}
        let id = 0
        function treeify (parent, error, context = {}) {
            const [ file, line ] = location(error.stack)
            const key = keyify(error, file, line)
            if (error instanceof Interrupt) {
                const node = {
                    parent: parent,
                    duplicated: false,
                    duplicates: new Set,
                    id: id++,
                    key: key,
                    stringified: Keyify.stringify(key),
                    error: error,
                    context: context,
                    causes: null
                }
                node.causes = error.causes.map((cause, index) => {
                    return treeify(node, cause, { ...(error.contexts[index] || {}) })
                })
                return node
            }
            return {
                parent: parent,
                duplicated: false,
                id: id++,
                key: key,
                duplicates: new Set,
                stringified: Keyify.stringify(key),
                error: error,
                context: context,
                causes: null
            }
        }
        const leaves = {}
        function leafify (node) {
            if (node.causes != null && node.causes.length != 0) {
                for (const cause of node.causes) {
                    leafify(cause)
                }
            } else {
                const key = node.stringified
                if (leaves[key] == null) {
                    leaves[key] = []
                }
                leaves[key].push(node)
            }
        }
        function compare (left, right) {
            if (left.stringified != right.stringified) {
                return false
            }
            if (left.causes == null && right.causes == null) {
                return true
            }
            if (left.causes.length != right.causes.length) {
                return false
            }
            const causes = right.causes.slice(0)
            CAUSES: for (const cause of left.causes) {
                for (let i = 0; i < causes.length; i++) {
                    if (compare(cause, causes[i])) {
                        causes.splice(i, 1)
                        continue CAUSES
                    }
                }
                return false
            }
            return true
        }
        function mark (node) {
            if (node.duplicated) {
                return
            }
            if (node.causes != null && node.causes.length != 0) {
                for (const cause of node.causes) {
                    mark(cause)
                }
            } else {
                for (const other of leaves[node.stringified]) {
                    if (other === node) {
                        continue
                    }
                    const iterator = {
                        self: node,
                        other: other
                    }
                    const departure = {
                        self: null,
                        other: null
                    }
                    while (
                        iterator.self.parent != null &&
                        iterator.other.parent != null &&
                        iterator.self !== iterator.other &&
                        iterator.self.parent.stringified == iterator.other.parent.stringified
                    ) {
                        departure.self = iterator.self
                        departure.other = iterator.other
                        iterator.self = iterator.self.parent
                        iterator.other = iterator.other.parent
                    }
                    if (departure.self != null) {
                        if (compare(departure.self, departure.other)) {
                            departure.self.duplicates.add(departure.other.id)
                            departure.other.duplicated = true
                        }
                    }
                }
            }
        }
        function format (node) {
            if (node.causes == null || node.causes.length == 0) {
                const repeated = node.duplicates.size + 1
                const context = node.context
                if (repeated != 1) {
                    context.repeated = repeated
                }
                const text = (node.error instanceof Error)
                    ? coalesce(node.error.stack, node.error.message)
                    : node.error.toString()
                if (Object.keys(context).length != 0) {
                    const contextualized = stringify(context)
                    return `${contextualized}\n\n${text}`
                }
                return text
            }
            const causes = []
            for (const cause of node.causes) {
                const formatted = format(cause)
                const indented = formatted.replace(/^/gm, '    ')
                causes.push(`\ncause:\n\n${indented}\n`)
            }
            const repeated = node.duplicates.size + 1
            const material = MATERIAL.get(node.error)
            const context = { ...material.context }
            if (repeated != 1) {
                context.repeated = repeated
            }
            const stack = node.error.stack.replace(/[\s\S]*^stack:$/m, 'stack:')
            if (Object.keys(context).length != 0) {
                const contextualized = stringify(context)
                return `${node.error.name}: ${material.message}\n\n${contextualized}\n\n${causes.join('')}\n\n${stack}`
            }
            return `${node.error.name}: ${material.message}\n\n${causes.join('')}\n\n${stack}`
        }
        /*
        function print (indent, extract, node) {
            console.log(`${indent}${util.inspect(extract(node), { depth: null, breakLength: Infinity })}`)
            if (node.causes != null && node.causes.length != 0) {
                for (const cause of node.causes) {
                    print(`  ${indent}`, extract, cause)
                }
            }
        }*/
        function trim (node, parent) {
            if (parent != null) {
                parent.causes = parent.causes.filter(sibling => ! node.duplicates.has(sibling.id))
            }
            if (node.causes != null && node.causes.length != 0) {
                let i = 0
                while (node.causes.length != i) {
                    trim(node.causes[i++], node)
                }
            }
        }
        const tree = treeify(null, error)
        leafify(tree)
        mark(tree)
        // print('', $ => [ $.id, 1 + $.duplicates.size ], tree)
        trim(tree, null)
        // print('', $ => [ $.id, 1 + $.duplicates.size ], tree)
        return format(tree)
    }
}

module.exports = Interrupt
