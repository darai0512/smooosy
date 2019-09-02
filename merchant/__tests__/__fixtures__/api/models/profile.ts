export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { Profile } = require('../../../../src/api/models')

const geo = require('./geo')
const { createService } = require('./service')
const { createUser } = require('./user')

const createProfile = async(props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }
  if (!props.pro) {
    props.pro = await createUser({pro: true})
  }
  if (!props.services) {
    props.services = [
      await createService(),
    ]
  }
  if (!props.loc) {
    props.loc = geo.points.tokyo
  }

  const defaults: any = {
    name: 'Akasaka pro with meet rate of 0.4',
    description: 'aaaaa',
  }

  const profile = await Profile.create({ ...defaults, ...props })
  props.pro.profiles.push(profile._id)
  await props.pro.save()
  return profile
}

module.exports = {
  createProfile,
}