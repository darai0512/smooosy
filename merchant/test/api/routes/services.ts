export {}
const test = require('ava')
const nock = require('nock')
const supertest = require('supertest')
const uuidv4 = require('uuid/v4')
const server = require('../../../src/api/server')
const { wpOrigin } = require('@smooosy/config')

const { Crawl, Lead, Media, MeetTemplate, LocationService, ServiceArea, ProfileIntroduction, Keyword, FormattedRequest, Location, Profile, Service, ProService, Meet, Chat, Review, User, RuntimeConfig } = require('../../../src/api/models')
import { getServiceCategory, getLocationService, getLocationServiceProfiles, servicePage, contentDraftLoad, contentDraftSave } from '../../../src/api/routes/services'
const redis = require('../../../src/api/lib/redis')
const { generateServiceUserProfile, generateRequest, postProcess } = require('../helpers/testutil')

const context: any = {}
test.before(async () => {
  context.location = await Location.create({
    isPublished: true,
    group: [],
    name: '東京都',
    key: 'tokyo',
    distance: 40000,
    loc: { coordinates: [ 139.56231318417963, 35.72383805086727 ], type: 'Point' },
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    depth: 0,
    keyPath: 'tokyo',
  })
})

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  t.context.location = context.location
  t.context.locationService = await LocationService.create({
    key: 'tokyo',
    name: '東京都',
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    keyPath: 'tokyo',
    isGroup: false,
    profiles: [t.context.profile.id],
    leads: [],
    service: t.context.service.id,
    count: 3,
  })
  t.context.locationService2 = await LocationService.create({
    key: 'kanagawa',
    name: '神奈川県',
    parentKey: 'japan',
    parentName: '日本',
    path: '神奈川県',
    keyPath: 'kanagawa',
    isGroup: false,
    profiles: [t.context.profile.id],
    leads: [],
    service: t.context.service.id,
    count: 3,
  })
  t.context.locationService3 = await LocationService.create({
    path: '東京都,港区',
    keyPath: 'tokyo,minato',
    isGroup: false,
    profiles: [t.context.profile.id],
    leads: [],
    service: t.context.service.id,
    key: 'minato',
    name: '港区',
    parentKey: 'tokyo',
    parentName: '東京都',
    count: 3,
  })
  t.context.locationRelatedService = await LocationService.create({
    key: 'tokyo',
    name: '東京都',
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    keyPath: 'tokyo',
    isGroup: false,
    profiles: [t.context.profile.id],
    leads: [],
    service: t.context.service2.id,
    count: 3,
  })
  const req = {
    customer: t.context.user.id,
    service: t.context.service.id,
    prefecture: '東京都',
    description: [{
      'type': 'textarea',
      'label': 'プロの方へのメッセージ',
      'answers': [
        {
          'text': '依頼その1',
        },
      ],
    }],
    interview: [],
  }
  await generateRequest(t, req)
  t.context.formattedRequest = await FormattedRequest.create({
    service: t.context.service.id,
    request: t.context.request.id,
    prefecture: '東京都',
    public: true,
  })
})

test.after.always(async () => {
  await postProcess()
})


test('pref, city, town, keyからServiceとCategoryが取得できる', async t => {
  let res = await getServiceCategory({key: t.context.service.key, pref: 'tokyo'})
  t.is(res.service.id, t.context.service.id)
  t.falsy(res.service.pageInformation) // 子ページはpageInformationはない
  t.is(res.service.pageLayout, null) // TODO: check data will change by key,pref,city
  t.is(res.category.id, t.context.category.id)
  t.is(res.relatedServices[0].id, t.context.service.id)

  res = await getServiceCategory({key: t.context.service.key, pref: 'tokyo', city: 'minato'})
  t.is(res.service.id, t.context.service.id)
  t.falsy(res.service.pageInformation) // 子ページはpageInformationはない
  t.is(res.service.pageLayout, null) // TODO: check data will change by key,pref,city
  t.is(res.category.id, t.context.category.id)
  t.is(res.relatedServices[0].id, t.context.service.id)

  res  = await getServiceCategory({key: t.context.service.key})
  t.is(res.service.id, t.context.service.id)
  t.is(res.service.pageInformation.length, 2)
  t.is(res.service.pageLayout, null) // TODO: check data will change by key,pref,city
  t.is(res.category.id, t.context.category.id)
  t.is(res.relatedServices[0].id, t.context.service.id)
})

test('service, pref, city, town, keyPath, parentKeyPathからLocationService, Locationが取得できる', async t => {
  const res = await getLocationService({
    category: t.context.category, service: t.context.service,
    relatedServices: [t.context.service, t.context.service2],
    pref: 'tokyo',
  })
  t.is(res.location.id, t.context.location.id)
  t.is(res.locationService._id.toString(), t.context.locationService.id)
  t.is(res.brothers.length, 2)
  t.is(res.children.length, 1)
  t.is(res.locationRelatedServices.length, 2)
  t.is(res.locationCategories.length, 1)
})

async function createDataForLocationServiceProfiles(t, locationService, numOfProServices) {
  const reviews = []
  const proServices = []
  const uid = uuidv4()
  for (let i = 0; i < 12; i++) {
    const u = await User.create({
      email: `abc${uid}+${i}@smooosy.biz`,
      lastname: `User ${i+1}`,
      bounce: true, // メールを送らない
    })
    const p = await Profile.create({
      name: `Pro ${i+1}`,
      pro: u,
      services: [t.context.service],
      loc: t.context.location.loc,
      description: '共通自己紹介文',
      score: i,
    })
    const r = await Review.create({
      profile: p,
      service: t.context.service,
      rating: 5,
      username: `Reviewer ${i+1}`,
      text: 'A'.repeat(31),
    })
    p.reviews.push(r)
    await p.save()
    reviews.push(r)

    const ps = await ProService.create({
      user: u,
      profile: p,
      service: t.context.service,
      loc: t.context.location.loc,
      description: 'サービス別自己紹介文',
    })
    if (numOfProServices > i) {
      proServices.push(ps)
    }
  }
  locationService.reviews = reviews
  locationService.proServices = proServices
  await locationService.save()
}

// runtime config が他テストに影響するので serial 実行
test.serial('getLocationServiceProfiles: review 12 に満たない場合は切り替えなし', async t => {
  const query = {
    pref: 'tokyo',
  }
  const res = await getLocationServiceProfiles(query, t.context.service)
  t.is(res, null)
})

// runtime config が他テストに影響するので serial 実行
test.serial('getLocationServiceProfiles: review 12 ある場合, reviews と proServices それぞれのデータを持った 24 プロフィール取得できる', async t => {
  await createDataForLocationServiceProfiles(t, t.context.locationService2, 12)
  const rc = await RuntimeConfig.create({
    name: 'newSp',
    isEnabled: true,
    priority: 1,
    serivces: [t.context.service._id],
    rollout: {
      start: 0,
      end: 100,
    },
  })

  const query = {
    pref: 'kanagawa',
  }
  const res = await getLocationServiceProfiles(query, t.context.service)
  t.is(res.profiles.length, 24)
  t.is(res.profiles[0].reviews[0].text, 'A'.repeat(31))
  t.is(res.profiles[0].description, null)
  t.is(res.profiles[0].score, 11)
  t.is(res.profiles[12].reviews.length, 0)
  t.is(res.profiles[12].description, 'サービス別自己紹介文')
  t.is(res.profiles[12].score, 11)
  await rc.remove()
})

// runtime config が他テストに影響するので serial 実行
test.serial('getLocationServiceProfiles: review 12 ある場合, reviews & proServices 両データを持った 12 プロフィール取得できる', async t => {
  await createDataForLocationServiceProfiles(t, t.context.locationService3, 0)
  const rc = await RuntimeConfig.create({
    name: 'newSp',
    isEnabled: true,
    priority: 1,
    serivces: [t.context.service._id],
    rollout: {
      start: 0,
      end: 100,
    },
  })

  const query = {
    pref: 'tokyo',
    city: 'minato',
  }
  const res = await getLocationServiceProfiles(query, t.context.service)
  t.is(res.profiles.length, 12)
  t.is(res.profiles[0].reviews[0].text, 'A'.repeat(31))
  t.is(res.profiles[0].description, 'サービス別自己紹介文')
  t.is(res.profiles[0].score, 11)
  await rc.remove()
})

test('servicePageからservice, category, locationservice, brothers, children, formattedRequest, profilesが取得できる', async t => {
  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${t.context.service.wpId}&pref=tokyo&per_page=6`)
    .reply(200, [])

  let response
  await servicePage({params: {key: t.context.service.key}, query: {pref: 'tokyo'}}, {json: (data) => response = data})
  t.is(response.service._id.toString(), t.context.service.id)
  t.is(response.category._id.toString(), t.context.category.id)
  t.is(response.locationService._id.toString(), t.context.locationService.id)
  t.is(response.brothers.length, 2)
  t.is(response.children.length, 1)
  t.is(response.request._id.toString(), t.context.formattedRequest.id)
  t.is(response.profiles.length, 1)
  t.is(response.locationRelatedServices.length, 2)
  t.is(response.locationCategories.length, 1)
  // TODO: media, lead, reviewInfo
})

test.serial('ServicePageコンテンツを下書き保存&読み込みができる', async t => {
  const service = t.context.service

  const contentData = {
    'id': service.id,
    'pageInformation': [
      {
        'type': 'text',
        'column': 12,
        'title': '結婚式の写真撮影の相場費用',
        'text': '<table class="medium-editor-table" id="medium-editor-table" width="100%"><tbody id="medium-editor-table-tbody"><tr><td>挙式撮影＋披露宴</td><td>40000円～<br></td></tr><tr><td>披露宴撮影のみ</td><td>35000円～<br></td></tr><tr><td>二次会撮影のみ<br></td><td>30000円～<br></td></tr><tr><td>メイクシーン<br></td><td>10000円～<br></td></tr><tr><td>アルバム作成<br>（10ページ10カット）<br></td><td>40000円～<br></td></tr><tr><td>修正・レタッチ<br>※料金に含まれている場合が多い<br></td><td>500円/1ヶ所<br></td></tr><tr><td>集合写真（親族・ゲスト）<br></td><td>5000円～<br></td></tr><tr><td>ひな壇オプション<br>（1段40型3基セット）<br></td><td>1500円/1泊2日<br></td></tr></tbody></table>',
        'image': 'https://smooosy.com/img/pageinformation/5b28b8c87cdbfc2b11236d33.jpg',
      },
      {
        'type': 'zipbox',
        'column': 12,
      },
    ],
  }

  let loadResponses
  await contentDraftSave({user: {lastname: 'テスト', firstname: '太郎'}, params: {id: service.id}, body: contentData}, {json: () => {}})
  await contentDraftLoad({params: {id: service.id}}, {json: (data) => loadResponses = data})
  const loadResponse = loadResponses[0]
  t.deepEqual(contentData.pageInformation, loadResponse.pageInformation)
})

test.serial('ServicePageコンテンツを下書き保存は５件までで古いものから削除される', async t => {
  // redisのspcontentを削除
  const keys = await redis.keysAsync('spcontent-*')
  for (const key of keys) {
    await redis.delAsync(key)
  }

  const service = t.context.service

  const contentDatas = []
  for (let i = 0; i < 6; i++) {
    const contentData = {
      'id': service.id,
      'pageInformation': [
        {
          'type': 'text',
          'column': 12,
          'title': `結婚式の写真撮影の相場費用${i}`,
          'text': '<table class="medium-editor-table" id="medium-editor-table" width="100%"><tbody id="medium-editor-table-tbody"><tr><td>挙式撮影＋披露宴</td><td>40000円～<br></td></tr><tr><td>披露宴撮影のみ</td><td>35000円～<br></td></tr><tr><td>二次会撮影のみ<br></td><td>30000円～<br></td></tr><tr><td>メイクシーン<br></td><td>10000円～<br></td></tr><tr><td>アルバム作成<br>（10ページ10カット）<br></td><td>40000円～<br></td></tr><tr><td>修正・レタッチ<br>※料金に含まれている場合が多い<br></td><td>500円/1ヶ所<br></td></tr><tr><td>集合写真（親族・ゲスト）<br></td><td>5000円～<br></td></tr><tr><td>ひな壇オプション<br>（1段40型3基セット）<br></td><td>1500円/1泊2日<br></td></tr></tbody></table>',
          'image': 'https://smooosy.com/img/pageinformation/5b28b8c87cdbfc2b11236d33.jpg',
        },
        {
          'type': 'zipbox',
          'column': 12,
        },
      ],
    }
    contentDatas.unshift(contentData)

    await contentDraftSave({user: {lastname: 'テスト', firstname: '太郎'}, params: {id: service.id}, body: contentData}, {json: () => {}})
  }

  let loadResponses
  await contentDraftLoad({params: {id: service.id}}, {json: (data) => loadResponses = data})
  t.is(loadResponses.length, 5)
  for (let i = 0; i < 5; i++) {
    t.deepEqual(contentDatas[i].pageInformation, loadResponses[i].pageInformation)
  }
})

test('新規作成テスト', async t => {
  const req = {
    body: {
      key: 'test',
      name: 'テスト',
      tags: ['タグ1', 'タグ2'],
    },
  }
  const admin = t.context.adminUser
  const res = await supertest(server)
    .post('/api/admin/services')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)
  t.is(res.statusCode, 200)
  t.true(res.body.id.length > 0)
  t.is(res.body.key, req.body.key)
  t.is(res.body.name, req.body.name)
  t.deepEqual(res.body.tags, req.body.tags)
  // default values
  t.is(res.body.priority, 0)
  t.is(res.body.enabled, false)
  t.is(res.body.deleted, false)
  t.is(res.body.providerName, 'プロ')
  t.is(res.body.interview, false)
  t.is(res.body.needMoreInfo, false)
  t.is(res.body.eliminateTime, 60)
  t.is(res.body.requestCount, 0)
  t.is(res.body.image, 'https://dev.smooosy.com/img/services/noimage.png?')
  t.deepEqual(res.body.queries, [])
  t.deepEqual(res.body.proQuestions, [])
  t.deepEqual(res.body.pickupMedia, [])
  t.deepEqual(res.body. similarServices, [])
  t.deepEqual(res.body.recommendServices, [])
  t.deepEqual(res.body.pageInformation, [])
})

test('新規作成で重複するキーが重複する場合は 400', async t => {
  const req = {
    body: {
      key: t.context.service.key,
      name: 'テストサービス',
    },
  }
  const admin = t.context.adminUser
  const res = await supertest(server)
    .post('/api/admin/services')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)
  t.is(res.statusCode, 400)
  t.deepEqual(res.body, {
    message: 'already exist',
  })
})

test('サービス削除・統合ができる', async t => {
  let service = t.context.service
  const serviceBase = {
    name: 'テストサービス',
    queries: [],
    tags: ['カテゴリ'],
    description: 'テストサービスの説明',
    imageUpdatedAt: new Date(),
    enabled: true,
    providerName: 'テストサービス',
    priority: 80,
    pageTitle: 'テストサービスのタイトル',
    pageDescription: 'テストサービスページの説明',
    key: t.context.service.key,
    priceComment: '<div></div>',
    similarServices: [],
    recommendServices: [],
  }
  const service2 = await Service.create(Object.assign(serviceBase, {name: 'テスト2', key: 'test-2'}))
  let service3 = await Service.create(Object.assign(serviceBase, {
    name: 'テスト3', key: 'test-3',
    similarServices: [service.id],
    recommendServices: [service.id],
  }))

  let crawl = await Crawl.create({name: 'crawl', services: [service.id]})
  let lead = await Lead.create({name: 'lead', services: [service.id]})

  const medias = await Promise.all([
    Media.create({user: t.context.pro, type: 'image'}),
    Media.create({user: t.context.pro, type: 'image'}),
  ])
  let proService = t.context.proService
  proService.media = medias
  await proService.save()
  let meetTemplate = await MeetTemplate.create({service: service.id, title: 'title', body: 'body'})
  let locationService = await LocationService.create({
    service: service.id,
    key: 'location-key',
    name: 'location',
    parentKey: 'japan',
    parentName: 'Japan',
    keyPath: 'keypath',
    path: 'path',
  })
  let serviceArea = await ServiceArea.create({
    place: 'place',
    key: 'key',
    serviceKey: service.key,
    service: service.id,
  })
  let profileIntroduction = await ProfileIntroduction.create({service: service.id})
  let keyword = await Keyword.create({
    path: 'path',
    word: 'word',
    service: service.id,
  })

  const admin = t.context.adminUser
  await supertest(server)
    .put(`/api/admin/services/delete/${service.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({migrateTo: [service2.id]})
    .expect(200)

  // サービス
  service = await Service.findById(service.id).select('deleted')
  t.is(service.deleted, true)
  service3 = await Service.findById(service3.id)
  t.is(service3.similarServices.length, 1)
  t.is(service3.similarServices[0].toString(), service2.id)
  t.is(service3.recommendServices.length, 1)
  t.is(service3.recommendServices[0].toString(), service2.id)
  // プロフィール
  let profile = await Profile.findById(t.context.profile.id)
  t.is(profile.services.length, 1)
  profile = await Profile.findOne({_id: t.context.profile.id, services: service.id})
  t.is(profile, null)
  profile = await Profile.findOne({_id: t.context.profile.id, services: service2.id})
  t.not(profile, null)
  // クロール
  crawl = await Crawl.findById(crawl.id)
  t.is(crawl.services.length, 1)
  t.is(crawl.services[0].toString(), service2.id)
  // Lead
  lead = await Lead.findById(lead.id)
  t.is(lead.services.length, 1)
  t.is(lead.services[0].toString(), service2.id)
  // ProService
  proService = await ProService.findOne({user: t.context.pro, service: service.id})
  t.is(proService.disabled, true)
  // 削除されるものたち
  meetTemplate = await MeetTemplate.findById(meetTemplate.id)
  t.is(meetTemplate, null)
  locationService = await LocationService.findById(locationService.id)
  t.is(locationService, null)
  serviceArea = await ServiceArea.findById(serviceArea.id)
  t.is(serviceArea, null)
  profileIntroduction = await ProfileIntroduction.findById(profileIntroduction.id)
  t.is(profileIntroduction, null)
  keyword = await Keyword.findById(keyword.id)
  t.is(keyword, null)
})

test('質問項目に対してサービス価格が取得できる（id指定）', async t => {
  const service = t.context.service

  for (let i = 0;i < 20;++i) {
    const chat = await Chat.create({
      user: t.context.pro.id,
      text: 'よろしくお願いします',
      read: false,
    })
    await Meet.create({
      status: 'waiting',
      request: t.context.request.id,
      service: t.context.service.id,
      customer: t.context.user.id,
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      chats: [chat.id],
      price: 10000,
      priceType: 'fixed',
      point: 0,
    })
  }

  const res = await supertest(server)
    .get(`/api/services/priceEstimate?questions=${JSON.stringify([])}&id=${service.id}`)
    .expect(200)

  t.is(res.statusCode, 200)
  t.true(!!res.body.average)
  t.true(!!res.body.high)
  t.true(!!res.body.low)
})

test('質問項目に対してサービス価格が取得できる（key指定）', async t => {
  const service = t.context.service

  for (let i = 0;i < 20;++i) {
    const chat = await Chat.create({
      user: t.context.pro.id,
      text: 'よろしくお願いします',
      read: false,
    })
    await Meet.create({
      status: 'waiting',
      request: t.context.request.id,
      service: t.context.service.id,
      customer: t.context.user.id,
      pro: t.context.pro.id,
      profile: t.context.profile.id,
      chats: [chat.id],
      price: 10000,
      priceType: 'fixed',
      point: 0,
    })
  }

  const res = await supertest(server)
    .get(`/api/services/priceEstimate?questions=${JSON.stringify([])}&key=${service.key}`)
    .expect(200)

  t.is(res.statusCode, 200)
  t.true(!!res.body.average)
  t.true(!!res.body.high)
  t.true(!!res.body.low)
})
