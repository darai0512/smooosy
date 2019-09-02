export {}
const { CloudFront } = require('../lib/aws')

module.exports = {
  cacheInvalidation,
}


async function cacheInvalidation(req, res) {
  const { path } = req.body

  try {
    const result = await CloudFront.cacheInvalidation(path)
    res.json(result)
  } catch (e) {
    res.status(400).json({message: 'キャッシュ削除失敗'})
  }
}
