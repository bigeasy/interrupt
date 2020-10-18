const func = `Error
    at main (/home/alan/interrupt/program.js:2:17)
    at Object.<anonymous> (/home/alan/interrupt/program.js:4:1)
    at Module._compile (internal/modules/cjs/loader.js:1138:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1158:10)
    at Module.load (internal/modules/cjs/loader.js:986:32)
    at Function.Module._load (internal/modules/cjs/loader.js:879:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:71:12)
    at internal/main/run_main_module.js:17:47
`
const anon = `Error
    at repl:1:13
    at Script.runInThisContext (vm.js:120:20)
    at REPLServer.defaultEval (repl.js:433:29)
    at bound (domain.js:426:14)
    at REPLServer.runBound [as eval] (domain.js:439:12)
    at REPLServer.onLine (repl.js:760:10)
    at REPLServer.emit (events.js:327:22)
    at REPLServer.EventEmitter.emit (domain.js:482:12)
    at REPLServer.Interface._onLine (readline.js:329:10)
    at REPLServer.Interface._line (readline.js:658:8)
`
require('proof')(3, okay => {
    const location = require('../location')
    okay(location(anon), [ 'repl', 1 ], 'no function')
    okay(location(func), [ '/home/alan/interrupt/program.js', 2 ], 'function')
    okay(location(''), [ null, null ], 'failed')
})
