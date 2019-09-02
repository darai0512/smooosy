export {}
const sendgrid = require('../lib/sendgrid')

module.exports = {
  cacheInvalidation,
}

async function cacheInvalidation(req, res) {
  const { id } = req.params

  const result = await sendgrid.get().deleteTemplateCache(id)
  if (!result) {
    return res.status(500).json({message: 'Internal Server Error'})
  }
  res.json({})
}
