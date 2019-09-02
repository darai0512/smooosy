export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { User } = require('../../../../src/api/models')

const createUser = async (props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }

  const defaults: any = {
    lastname: `user_${props._id}`,
    email: `test_${props._id}@smooosy.com`,
    token: `token_${props._id}`,
    bounce: true, // メールを送らない
  }

  return await User.create({ ...defaults, ...props })
}

module.exports = {
  createUser,
}
