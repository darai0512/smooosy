export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { ProService } = require('../../../../src/api/models')

const geo = require('./geo')
const { createService } = require('./service')
const { createUser } = require('./user')
const { createProfile } = require('./profile')

const createProService = async(props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }
  if (!props.loc) {
    props.loc = geo.points.tokyo
  }
  if (!props.service) {
    props.service = await createService()
  }
  if (!props.user) {
    props.user = await createUser()
  }
  if (!props.profile) {
    props.profile = await createProfile({
      loc: props.loc,
      services: [ props.service ],
      user: props.user,
      profile: props.profile,
    })
  }

  const defaults: any = {
    distance: 50000,
    jobRequirements: [],
  }

  return await ProService.create({ ...defaults, ...props })
}

module.exports = {
  createProService,
}