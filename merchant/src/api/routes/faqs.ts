export {}
const { Faq } = require('../models')

module.exports = {
  index,
}

async function index(req, res) {
  const faqs = await Faq.find()
  res.json(faqs)
}
