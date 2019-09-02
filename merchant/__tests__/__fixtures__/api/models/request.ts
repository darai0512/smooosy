export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { Request } = require('../../../../src/api/models')

const geo = require('./geo')
const { createService } = require('./service')
const { createUser } = require('./user')

const createRequest = async(props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }
  if (!props.customer) {
    props.customer = await createUser()
  }
  if (!props.service) {
    props.service = await createService()
  }
  if (!props.loc) {
    props.loc = geo.points.tokyo
  }
  if (!props.description) {
    props.description = [
      {
        'type': 'textarea',
        'label': 'プロの方へのメッセージ',
        'answers': [
          {
            'text': '依頼その1',
          },
        ],
      },
    ]
  }

  const defaults: any = {
    status: 'open',
    category: 'カテゴリ名',
    point: 5,
    pt: 24,
  }

  return await Request.create({ ...defaults, ...props })
}

module.exports = {
  createRequest,
}