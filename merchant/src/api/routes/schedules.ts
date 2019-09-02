export {}
const moment = require('moment')
const { Schedule, Chat, Meet, Request, User } = require('../models')
const { emailBookingRequest, emailBookingUpdate } = require('../lib/email')
import * as userLib from '../lib/user'

module.exports = {
  index,
  indexForPro,
  show,
  create,
  update,
  remove,
  updateBusinessHour,
  updateBusinessHourForAdmin,
}

async function index(req, res) {
  const cond: any = {
    user: req.params.id,
  }
  if (req.query.startTime && req.query.endTime) {
    cond.startTime = {
      $gte: req.query.startTime,
      $lte: req.query.endTime,
    }
  }

  if (req.query.recurrence) {
    cond.recurrence = req.query.recurrence
  }

  // 両方指定の場合、andではなくorにする
  if (req.query.startTime && req.query.endTime && req.query.recurrence) {
    cond.$or = [
      {startTime: cond.startTime},
      {recurrence: cond.recurrence},
    ]
    delete cond.startTime
    delete cond.recurrence
  }
  const schedules = await Schedule
    .find(cond)
    .select('type startTime endTime status recurrence')

  res.json(schedules)
}

async function indexForPro(req, res) {
  const cond: any = {
    user: req.user.id,
    status: {$nin: ['decline', 'cancel']},
  }
  if (req.query.startTime && req.query.endTime) {
    cond.startTime = {
      $gte: req.query.startTime,
      $lte: req.query.endTime,
    }
  }

  if (req.query.recurrence) {
    cond.recurrence = req.query.recurrence
  }

  // 両方指定の場合、andではなくorにする
  if (req.query.startTime && req.query.endTime && req.query.recurrence) {
    cond.$or = [
      {startTime: cond.startTime},
      {recurrence: cond.recurrence},
    ]
    delete cond.startTime
    delete cond.recurrence
  }
  const schedules = await Schedule
    .find(cond)
    .sort({startTime: 1})
    .populate({
      path: 'meet',
      populate: {
        path: 'customer',
        model: 'User',
        select: 'lastname deactivate',
      },
    })

  res.json(schedules)
}

async function show(req, res) {
  const schedule = await Schedule
    .findOne({
      _id: req.params.id,
      user: req.user.id,
      type: { $ne: 'block' },
    })
  if (schedule === null) return res.status(404).json({message: 'not found'})

  const meet = await Meet
    .findOne({_id: schedule.meet})
    .populate({
      path: 'service',
      select: 'name',
    }).populate({
      path: 'customer',
      select: 'lastname deactivate',
    })

  schedule.meet = meet

  res.json(schedule)
}

async function create(req, res) {
  if (Array.isArray(req.body)) {
    const data = req.body.map(data => ({...data, user: req.user.id}))
    let schedules = []
    try {
      schedules = await Schedule.insertMany(data, {ordered: false})
    } catch (e) {
      // empty
    }
    res.json(schedules)
  } else {
    if (req.body.meet) {
      const exists = await Request.countDocuments({meets: req.body.meet, deleted: {$ne: true}})
      if (exists === 0) return res.status(404).json({message: 'not found'})
    }

    const schedule = await Schedule.create(req.body)

    if (schedule.meet && schedule.type !== 'block') {
      const meet = await updateMeetWithSchedule(req, schedule)
      schedule.meet = meet

      emailBookingRequest({
        user: meet.pro,
        schedule,
        meet,
      })
    }
    res.json(schedule)
  }
}

async function update(req, res) {
  let schedule = await Schedule.findOne({_id: req.params.id})
  if (schedule === null) return res.status(404).json({message: 'not found'})

  const preStatus = schedule.status
  schedule = await Schedule.findByIdAndUpdate(schedule.id, {$set: {status: req.body.status, info: {...schedule.info, ...req.body.info}}})

  if (preStatus !== schedule.status) {
    const meet = await updateMeetWithSchedule(req, schedule)
    emailBookingUpdate({
      user: meet.pro.id === req.user.id ? meet.customer : meet.pro,
      schedule,
      meet,
    })
  }

  // updateMeet された場合、その返り値でも良いがデータ量が多いため撮り直す
  const meet = await Meet
    .findOne({_id: schedule.meet})
    .populate({
      path: 'service',
      select: 'name',
    }).populate({
      path: 'customer',
      select: 'lastname deactivate',
    })
  schedule.meet = meet

  res.json(schedule)
}

async function remove(req, res) {
  await Schedule.remove({
    _id: {$in: req.body},
    user: req.user.id,
  })
  res.json({})
}

async function updateBusinessHour(req, res) {
  const {schedule, schedules} = await handleUpdateBusinessHour(req.user._id, req.body)

  res.json({schedule, schedules})
}

async function updateBusinessHourForAdmin(req, res) {
  const data = req.body
  const {schedule, schedules} = await handleUpdateBusinessHour(req.params.id, data)

  res.json({schedule, schedules})
}

async function handleUpdateBusinessHour(userId, data) {
  const { dayOff, startTime, endTime } = data
  const user = await User.findByIdAndUpdate(userId, {$set: {schedule: {dayOff: userLib.getValidDayOff(dayOff), startTime, endTime}}})

  await Schedule.remove({
    user: userId,
    recurrence: 'week',
  })

  let schedules = businessHourToSchedules({
    user: userId,
    dayOff: dayOff || [],
    start: startTime,
    end: endTime,
  })
  schedules = await Schedule.insertMany(schedules, { ordered: false })
  return {schedule: user.schedule, schedules}
}

function businessHourToSchedules({ user, dayOff, start, end }) {
  const weekStart = moment().startOf('week')
  const schedules = []
  const overnight = start > end
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    // 未入力の場合trueにする
    dayOff[dayOfWeek] = dayOff[dayOfWeek] === undefined ? false : dayOff[dayOfWeek]
    const startTime = dayOff[dayOfWeek]
      ? weekStart.clone().add(dayOfWeek * 24 + start, 'hours').toDate()
      : weekStart.clone().add((overnight ? dayOfWeek + 1 : dayOfWeek) * 24 + end, 'hours').toDate()
    const endTime = weekStart.clone().add((dayOfWeek + 1) * 24 + start - 1, 'hours').endOf('hour').toDate()
    if (startTime > endTime) continue

    schedules.push({
      user,
      type: 'block',
      recurrence: 'week',
      startTime,
      endTime,
    })
  }

  return schedules
}


async function updateMeetWithSchedule(req, schedule) {
  if (!schedule.meet) {
    return null
  }

  const meet = await Meet.findById(schedule.meet)
    .populate(['pro', 'customer', 'service', 'profile'])
  if (!meet) {
    return null
  }

  let action = ''
  if (req.user.id === meet.pro.id) {
    action = schedule.status
  } else {
    action = schedule.status === 'accept' ? 'accept' : 'request'
  }

  const chat = await Chat.create({
    user: req.user.id,
    type: 'booking',
    booking: {
      schedule: schedule.id,
      action,
    },
  })

  const updateData = {$push: {chats: [chat.id]}}

  // NOTE: 事業者側から意図しない動作をしたという申告が懸念されるため、自動成約は一旦コメントアウト
  //       仕事の日程が認知されたら戻すのを検討
  // if (meet.status === 'waiting' && schedule.type === 'job' && schedule.status === 'accept') {
  //   const prevTrackInfo = {
  //     status: meet.status,
  //     archive: meet.archive,
  //   }
  //
  //   const chatHired = await Chat.create({user: req.user.id, system: true, text: `${meet.profile.name}様が仕事の日程を確定しました`})
  //   updateData.$push.chats.push(chatHired.id)
  //   updateData.$set = {
  //     status: 'progress',
  //     hiredAt: new Date(),
  //   }
  //
  //   BigQueryInsert(req, {
  //     event_type: 'meet_hire',
  //     event: JSON.stringify({ service_id: meet.service.toString(), request_id: meet.request.toString(), meet_id: meet.id, prev: prevTrackInfo }),
  //   })
  //
  //   await Request.findByIdAndUpdate(meet.request, {$set: {status: 'close'}})
  // }

  return await Meet.findByIdAndUpdate(schedule.meet, updateData)
    .populate(['pro', 'customer', 'service', 'profile'])
}