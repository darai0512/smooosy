export {}
import '../../../../src/api/lib/mongo'
const { ObjectId } = require('mongodb')

const { Category } = require('../../../../src/api/models')

const createCategory = async (props: any = {}) => {
  if (!props._id) {
    props._id = ObjectId()
  }

  const defaults: any = {
    key: `カテゴリ名_${props._id}`,
    name: `categoryName_${props._id}`,
    parent: 'event',
  }

  return await Category.create({ ...defaults, ...props })
}

module.exports = {
  createCategory,
}