export {}
/**
 * mongoose settings
 */
import * as dotenv from 'dotenv'
dotenv.config()
import * as config from 'config'
import mongoose = require('mongoose')
import { Mongoose } from 'mongoose'
const isTest = process.env.NODE_ENV === 'test'

mongoose.Promise = global.Promise

const main = (): Promise<Mongoose> => {
  if (isTest) {
    const MongodbMemoryServer = require('mongodb-memory-server').default
    const mongod = new MongodbMemoryServer({
      binary: {
        version: '4.0.6',
      },
    })
    return mongod.getConnectionString().then(str => mongoose.connect(str, config.get('mongodb.options')))
  }
  return mongoose.connect(config.get('mongodb.uri'), config.get('mongodb.options'))
}

export default main()
