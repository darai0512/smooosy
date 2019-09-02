import '../../../../src/api/lib/mongo'
import { ObjectId } from 'mongodb'

const { PointBought } = require('../../../../src/api/models')
const { createUser } = require('./user')

const createPointBought = async (props: any = {}) => {
  if (!props._id) {
    props._id = new ObjectId()
  }
  if (!props.user) {
    props.user = await createUser()
  }

  const defaults: any = {
    point: 0,
  }

  return await PointBought.create({ ...defaults, ...props })
}

module.exports = {
  createPointBought,
}