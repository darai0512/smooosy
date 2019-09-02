export {}
const { SearchKeyword, SearchKeywordRanking, Service, Category } = require('../models')
const moment = require('moment')
const config = require('@smooosy/config')

module.exports = {
  indexForAdmin,
  showForAdmin,
  create,
  update,
  remove,
  download,
  upload,
  output,
  ranking,
  categories,
  categoryVolume,
}

async function indexForAdmin(req, res) {
  const key = req.query.key
  let categoryServiceIds = []
  const sub = await Category.findOne({key}).select('name')
  const tag = sub ? sub.name : ''
  categoryServiceIds = await Service.find({'tags.0': tag})
    .select('id')

  let [ searchKeywords, searchKeywordRankings ] = await Promise.all([
    SearchKeyword.find()
      .populate('service')
      .sort({createdAt: -1}),
    SearchKeywordRanking.aggregate([
      { $match: { location: '' } },
      { $group: { _id: '$searchKeyword', date: { $max: '$date' }, rank: { $last: '$rank' }, url: { $last: '$url' } } },
    ]),
  ])

  const searchKeywordObjs = {}
  searchKeywords = searchKeywords.map(searchKeyword => {
    searchKeywordObjs[searchKeyword._id] = {
      id: searchKeyword._id,
      keyword: searchKeyword.keyword,
      searchVolume: searchKeyword.searchVolume,
      service: {id: searchKeyword.service.id, name: searchKeyword.service.name},
    }
    return searchKeywordObjs[searchKeyword._id]
  })

  if (searchKeywordRankings && searchKeywordRankings.length > 0) {

    searchKeywordRankings.map(searchKeywordRanking => {
      const date = searchKeywordRanking.date
      const rank = moment().diff(date, 'days') === 0 ? searchKeywordRanking.rank : '-'
      const url = searchKeywordRanking.url
      searchKeywordObjs[searchKeywordRanking._id] = {
        ...searchKeywordObjs[searchKeywordRanking._id],
        date,
        rank,
        url,
      }
    })
    searchKeywords = []
    Object.keys(searchKeywordObjs).forEach(key => {
      if (key) {
        if (categoryServiceIds.filter(cs => cs.id === searchKeywordObjs[key].service.id).length > 0) {
          searchKeywords.push(searchKeywordObjs[key])
        }
      } else {
        searchKeywords.push(searchKeywordObjs[key])
      }
    })
  }

  res.json(searchKeywords)
}

async function showForAdmin(req, res) {
  const searchKeyword = await SearchKeyword.findOne({_id: req.params.id}).populate('service')
  res.json(searchKeyword)
}

async function create(req, res) {

  if (req.body.keyword) {
    req.body.keyword = req.body.keyword.replace('　', ' ') // 全角スペースは排除
    await SearchKeyword.update({keyword: req.body.keyword}, req.body, {upsert: true})
  } else {
    req.body.map(async k => {
      const searchKeyword = {...k, keyword: k.keyword.replace('　', ' ')}
      await SearchKeyword.update({keyword: searchKeyword.keyword}, searchKeyword, {upsert: true})
    })
  }
  res.json()
}

async function update(req, res) {
  let searchKeyword = await SearchKeyword.findOne({_id: req.params.id})
  if (searchKeyword === null) return res.status(404).json({message: 'not exists'})

  req.body.path = (req.body.path || [])
  searchKeyword = await SearchKeyword.findByIdAndUpdate(searchKeyword.id, {$set: req.body})

  res.json(searchKeyword)
}

async function remove(req, res) {
  const id = req.params.id

  await Promise.all([
    SearchKeywordRanking.remove({searchKeyword: id}),
    SearchKeyword.remove({_id: id}),
  ])
  res.json()
}

async function download(req, res) {
  const searchKeywords = await SearchKeyword.find().sort({createdAt: -1})
  // TODO: 都道府県をつける？
  res.json(searchKeywords)
}

async function upload(req, res) {
  const { records } = req.body

  const areas = []
  Object.keys(config.prefectures).forEach(key => {
    areas.push(`${key === '北海道' ? key : key.slice(0, -1)}`)
  })
  const regStr = areas.concat(config.majorCities).join('|')
  const reg = new RegExp(regStr, 'g')

  const keywords = []
  for (const key in records) {
    const word = key.split(' ')
    let location = ''
    let keyword = ''
    // 末尾が都道府県、政令指定都市の場合
    if (word[word.length - 1].match(reg)) {
      keyword = word.reduce((sum, current, idx) => {
        if (idx === 0) {
          return current
        } else if (idx === word.length - 1) {
          return sum
        }
        return sum + ' ' + current
      }, '')
      location = word[word.length - 1]
    // そうでない場合はキーワードそのもの
    } else {
      keyword = key
    }

    // キーワードが存在しているかチェック
    const searchKeyword = await SearchKeyword.findOne({keyword})
    if (searchKeyword) {
      const date = moment(records[key].date).format('YYYY/MM/DD')
      const rank = records[key].rank
      const url = records[key].url
      keywords.push({searchKeyword: searchKeyword.id, keyword, date, rank, url, location})
    }
  }

  for (const keyword of keywords) {
    await SearchKeywordRanking.update({searchKeyword: keyword.searchKeyword, date: keyword.date, location: keyword.location}, keyword, {upsert: true})
  }

  res.json()
}

async function output(req, res) {
  const searchKeywordRankings = await SearchKeywordRanking.find()

  res.json(searchKeywordRankings)
}

async function ranking(req, res) {
  const searchKeywordRankings = await SearchKeywordRanking.find({searchKeyword:  req.params.id})

  res.json(searchKeywordRankings)
}

async function categories(req, res) {
  const searchKeywordRankings = await SearchKeywordRanking.aggregate([
    { $match: { location: '' } },
    { $group: { _id: '$searchKeyword', date: { $max: '$date' }, rank: { $last: '$rank' }} },
  ])
  const searchKeywordObjs = {}
  searchKeywordRankings.map(searchKeywordRanking => {
    const rank = moment().diff(searchKeywordRanking.date, 'days') === 0 ? searchKeywordRanking.rank : '-'
    searchKeywordObjs[searchKeywordRanking._id] = {
      rank,
    }
  })
  const categories = await Category.find().select('key name')
  for (const key in categories) {
    categories[key] = categories[key].toObject()
    const serviceIds = await Service.find({'tags.0': categories[key].name})
      .select('id')
    const searchKeywords = await SearchKeyword.find({service: {$in: serviceIds}})
    categories[key].searchVolume = 0
    categories[key].clickVolume = 0
    searchKeywords.map(searchKeyword => {
      const rank = searchKeywordObjs[searchKeyword.id] ? parseInt(searchKeywordObjs[searchKeyword.id].rank) : '-'
      if (rank !== '-' && !isNaN(rank) && rank <= 20) {
        categories[key].clickVolume += searchKeyword.searchVolume * config.ctr[rank]
      }
      categories[key].searchVolume += searchKeyword.searchVolume
    })
    categories[key].clickVolume = Math.floor(categories[key].clickVolume)
  }
  res.json(categories)
}

async function categoryVolume(req, res) {
  const key = req.params.key

  // カテゴリに所属しているサービス
  let categoryServiceIds = []
  if (key === 'all') {
    categoryServiceIds = await Service.find().select('id')
  } else {
    const category = await Category.findOne({key})
    const tag = category ? category.name : ''
    categoryServiceIds = await Service.find({ 'tags.0': tag }).select('id')
  }


  // カテゴリに所属しているキーワード
  const searchKeywords = await SearchKeyword.find({service: {$in: categoryServiceIds.map(cs => cs.id)}})
    .select('keyword')
  // キーワードのランキング
  const searchKeywordRanking = await SearchKeywordRanking
    .find({keyword: {$in: searchKeywords.map(s => s.keyword)}, location: '',  date: {$gt: moment().add(-7, 'days').toDate()}})
    .populate('searchKeyword')

  const categoryVolumeObjs = {}
  searchKeywordRanking.map(s => {
    const clickVolume = s.rank !== '-' && s.rank <= 20 ? Math.floor(s.searchKeyword.searchVolume * config.ctr[s.rank]) : 0
    const date = moment(s.date).format('YYYY/MM/DD')
    categoryVolumeObjs[date] = {
      date: s.date,
      clickVolume: categoryVolumeObjs[date] ? categoryVolumeObjs[date].clickVolume + clickVolume : clickVolume,
    }
  })
  const categoryVolume = []
  Object.keys(categoryVolumeObjs).forEach(key => {
    categoryVolume.push(categoryVolumeObjs[key])
  })
  categoryVolume.sort((a, b) => b.date - a.date)

  res.json(categoryVolume)
}
