export {}
import '../../../../src/api/lib/mongo'

const { createQueryWithHistory } = require('../../../../src/api/lib/queries')

const createQuery = async(props: any = {}) => {
  const defaults: any = {
    text: 'How many photos do you want taken?',
    type: 'number',
  }

  return await createQueryWithHistory({ ...defaults, ...props })
}

module.exports = {
  createQuery,
}