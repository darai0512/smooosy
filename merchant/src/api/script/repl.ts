import * as models from '../models'
import * as moment from 'moment'
import * as repl from 'repl'

const HISTORY_DIRECTORY = __dirname + '/.ym_history'

import mongoosePromise from '../lib/mongo'
mongoosePromise.then(mongoose => {
  console.log('REPL with async/await and mongoose! 🐍')
  const replInstance = repl.start({ prompt: '> ' })
  replInstance.context.moment = moment

  replInstance.setupHistory(HISTORY_DIRECTORY, (err) => {
    if (err) console.log(err)
  })
  for (const name in models) {
    replInstance.context[name] = models[name]
  }

  replInstance.on('exit', () => {
    mongoose.disconnect()
  })
})
