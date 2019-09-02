export {}
const moment = require('moment')
const { CSTask, Request, Profile } = require('../models')
const { S3 } = require('../lib/aws')

module.exports = {
  index,
  update,
  create,
  assign,
  cancelAssign,
  showByProfile,
  // helper
  handleCSTaskLicence,
  handleCSTaskIdentification,
  handleCSTaskDeactivate,
  handleCSTaskInterview,
  handleCSTaskNegativeChat,
}

async function index(req, res) {
  const [{licences}, {identifications}, {interviews}, {negativeChats}, {deactivates}, {others}] = await Promise.all([
    loadTasks.licence(),
    loadTasks.identification(),
    loadTasks.interview(),
    loadTasks.negativeChat(),
    loadTasks.deactivate(),
    loadTasks.other(),
  ])

  res.json({licences, identifications, interviews, negativeChats, deactivates, others})
}

async function update(req, res) {
  const task = await CSTask.findByIdAndUpdate(req.params.id, req.body)
  if (!task) res.status(404).json({message: 'not found'})
  res.json(task)
}

async function create(req, res) {
  await CSTask.create(req.body)
  const others = await loadTasks.other()
  res.json({others})
}

async function assign(req, res) {
  const { user } = req.body
  const task = await CSTask.findByIdAndUpdate(req.params.id, {$set: {assignee: user}})
  const json = await loadTasks[task.type]()
  res.json(json)
}

async function cancelAssign(req, res) {
  const task = await CSTask.findByIdAndUpdate(req.params.id, {$unset: {assignee: true}})
  const json = await loadTasks[task.type]()
  res.json(json)
}

async function showByProfile(req, res) {
  const profile = await Profile.findById(req.params.id).select('pro')
  if (!profile) return res.status(404).json({message: 'not found'})
  const identification = await CSTask.findOne({done: false, type: 'identification', user: profile.pro})
    .populate({path: 'assignee', select: 'lastname'})
    .populate({
      path: 'user',
      select: 'lastname firstname identification profiles',
      populate: {
        path: 'profiles',
        select: 'name',
      },
    })
  if (identification) {
    identification.user.identification.image = await Promise.all(identification.user.identification.image.map(image => {
      return S3.getSignedUrl({
        key: image,
        method: 'getObject',
      })
    }))
  }

  const licence = await CSTask.findOne({done: false, type: 'licence', profile: profile.id})
    .populate({path: 'assignee', select: 'lastname'})
    .populate({
      path: 'profile',
      select: 'licences pro name',
      populate: [{
        path: 'licences.licence',
      }, {
        path: 'pro',
        select: 'lastname firstname',
      }],
    })
    .sort('-createdAt')
  res.json({identification, licence})
}

const loadTasks = {
  licence: async () => {
    const licences = await CSTask.find({done: false, type: 'licence'})
      .populate({path: 'assignee', select: 'lastname'})
      .populate({
        path: 'profile',
        select: 'licences pro name',
        populate: [{
          path: 'licences.licence',
        }, {
          path: 'pro',
          select: 'lastname firstname',
        }],
      })
      .sort('-createdAt')
    return {licences}
  },
  interview: async () => {
    const tasks = await CSTask.find({done: false, type: 'interview'})
      .populate({path: 'assignee', select: 'lastname'})
      .populate({
        path: 'request',
        select: 'createdAt service customer interview deleted status',
        populate: [{
          path: 'service',
          select: 'name',
        }, {
          path: 'customer',
          select: 'lastname',
        }],
      })
      .sort('-createdAt')
    // サスペンド・キャンセル済み・期限切れはdoneにする
    const interviews = []
    for (const task of tasks) {
      if (task.request.deleted || task.request.status === 'suspend' || moment(task.request.createdAt).isBefore(moment().subtract(4, 'day'))) {
        await task.update({$set: {done: true}})
      } else {
        interviews.push(task)
      }
    }
    return {interviews}
  },
  negativeChat: async () => {
    const negativeChats = await CSTask.find({done: false, type: 'negativeChat'})
      .populate({path: 'user', select: 'lastname'})
      .populate({path: 'profile', select: 'name'})
      .populate({
        path: 'request',
        select: 'createdAt service customer',
        populate: [{
          path: 'service',
          select: 'name',
        }, {
          path: 'customer',
          select: 'lastname',
        }],
      })
      .sort('-createdAt')
    return {negativeChats}
  },
  identification: async () => {
    const identifications = await CSTask.find({done: false, type: 'identification'})
      .populate({path: 'assignee', select: 'lastname'})
      .populate({
        path: 'user',
        select: 'lastname firstname identification profiles',
        populate: {
          path: 'profiles',
          select: 'name',
        },
      })
      .sort('-createdAt')
    for (const id of identifications) {
      id.user.identification.image = await Promise.all(id.user.identification.image.map(image => {
        return S3.getSignedUrl({
          key: image,
          method: 'getObject',
        })
      }))
    }
    return {identifications}
  },
  deactivate: async () => {
    const deactivates = await  CSTask.find({done: false, type: 'deactivate'})
      .populate({path: 'assignee', select: 'lastname'})
      .populate({
        path: 'user',
        select: 'lastname firstname deactivateReason requestDeactivate pro',
      })
      .sort('-createdAt')
    return {deactivates}
  },
  other: async () => {
    const others = await CSTask.find({done: false, type: 'other'})
      .populate({path: 'assignee', select: 'lastname'})
      .sort('-createdAt')
    return {others}
  },
}

// functions
async function handleCSTaskLicence({profile}) {
  const task = await CSTask.findOne({type: 'licence', profile: profile.id, done: false})
  if (!task && profile.licences.some(l => l.status === 'pending')) {
    await CSTask.create({type: 'licence', profile: profile.id})
  } else if (task && profile.licences.every(l => ['invalid', 'valid'].includes(l.status))) {
    await task.update({done: true})
  }
}

async function handleCSTaskIdentification({user}) {
  const identification = await CSTask.findOne({type: 'identification', user: user.id, done: false})
  if (identification) {
    if (!user.identification || ['valid', 'invalid'].includes(user.identification.status)) {
      await identification.update({done: true})
    }
  } else if (user.identification && user.identification.status === 'pending') {
    await CSTask.create({type: 'identification', user: user.id})
  }
}

async function handleCSTaskDeactivate({user}) {
  const deactivate = await CSTask.findOne({type: 'deactivate', user: user.id, done: false})
  if (deactivate) {
    if (!user.requestDeactivate) {
      await deactivate.update({done: true})
    }
  } else if (user.requestDeactivate) {
    const newestRequest = await Request.findOne({customer: user.id}).sort('-createdAt').select('_id').lean()
    await CSTask.create({type: 'deactivate', user: user.id, request: newestRequest})
  }
}

async function handleCSTaskInterview({request}) {
  const interview = request.interview.filter(i => i !== 'admin')
  const task = await CSTask.findOne({type: 'interview', request: request.id, done: false})
  if (task) {
    if (request.deleted || !interview.length) {
      await CSTask.findOneAndUpdate({type: 'interview', request: request.id}, {$set: {done: true}})
    }
  } else {
    if (interview.length) {
      await CSTask.create({type: 'interview', request: request.id})
    }
  }
}

async function handleCSTaskNegativeChat({request, user, profile, meet, chat, detail}) {
  await CSTask.create({type: 'negativeChat', request, user, profile, meet, chat, detail})
}