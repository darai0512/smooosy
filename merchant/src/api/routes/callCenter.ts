export {}
const { User } = require('../models')
const config = require('config').get('twilio')

module.exports = {
  createWorker,
  removeWorker,
  tokenGenerator,
  holdHandler,
  assignHandler,
  trackingHandler,
  callTwimlHandler,
  transferTwimlHandler,
  transferQueueTwimlHandler,
  transferConferenceTwimlHandler,
}

function getWorker(user) {
  if (!user || !user.tools || !user.tools.twilioWorkerSid) return null
  return {
    identify: user.id,
    sid: user.tools.twilioWorkerSid,
  }
}

async function createWorker(req, res) {
  const user = await User.findOne({_id: req.body.user})
  const tools = user.tools || {}
  await User.findByIdAndUpdate(user.id, {$set: {tools}})
  res.json({})
}

async function removeWorker(req, res) {
  const user = await User.findOne({_id: req.params.id})
  if (!user.tools || !user.tools.twilioWorkerSid) return res.json({})
  await User.findByIdAndUpdate(user.id, {$unset: {tools: {twilioWorkerSid: 1}}})
  res.json({})
}

async function tokenGenerator(req, res) {
  const worker = getWorker(req.user)
  if (!worker) return res.json(null)

  res.json({
    activities: config.activities,
  })
}

// Inbound and Outbound call handler.
// This is run as soon as we receive or begin an call.
//
// Behavior:
// outbound) validate To number and dial to it.
// inbound) enqueue call in standard response workflow.
//
// Notes:
// Enqueueing call creates a task in TaskRouter and
// reserves an available worker for it.
async function callTwimlHandler(req, res) {
  res.set('Content-Type', 'text/xml')
  res.send('')
}

// Task assignment handler.
// This is run after an available worker has been reserved for a
// task.
//
// Behavior:
// 1). Dequeue the call, attempting to contact the worker
//     on their `contact_uri`.
// 2). After the call is over, set the worker back to idle state
//     so that they can receive new calls.
//
// Notes:
// Dequeue will fail if the worker doesn't have the `contact_uri`
// field set.
async function assignHandler(req, res) {
  res.json(req.body)
}

// Tracking handler.
// This is called by Twilio whenever any event related to our TaskRouter
// happens.
//
// Behavior:
// 1). Ack receiving the event.
//
// Notes:
// In the future, this should store all these events so we can analyze
// CSR efficiency.
async function trackingHandler(req, res) {
  res.send('OK')
}

// Transfer handler
// This is called by Twilio when we want to transfer a call.
async function transferTwimlHandler(req, res) {
  res.set('Content-Type', 'text/xml')
  res.send('Oops')
}

async function transferQueueTwimlHandler(req, res) {
  res.set('Content-Type', 'text/xml')
  res.send('Oops')
}

async function transferConferenceTwimlHandler(req, res) {
  res.set('Content-Type', 'text/xml')
  res.send('Oops')
}

async function holdHandler(req, res) {
  const worker = getWorker(req.user)
  if (!worker) return res.status(404).json({message: 'User is not callCenter worker.'})

  res.json({})
}
