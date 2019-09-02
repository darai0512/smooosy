export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { Meet } = require('../../../../src/api/models')

const { createProfile } = require('./profile')
const { createRequest } = require('./request')
const { createService } = require('./service')
const { createUser } = require('./user')

const createMeet = async(props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }
  if (!props.service) {
    props.service = await createService()
  }
  if (!props.customer) {
    props.customer = await createUser()
  }
  if (!props.pro) {
    props.pro = await createUser({pro: true})
  }
  if (!props.profile) {
    props.profile = await createProfile({
      services: [ props.service ],
      pro: props.pro,
    })
  }
  if (!props.request) {
    props.request = await createRequest({
      service: props.service,
      customer: props.customer,
    })
  }

  const defaults: any = {
    price: 10000,
  }

  const meet = await Meet.create({ ...defaults, ...props })
  props.request.meets.push(meet._id)
  await props.request.save()
  return meet
}

module.exports = {
  createMeet,
}