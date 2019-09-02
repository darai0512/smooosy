export {}
const nock = require('nock')
const supertest = require('supertest')
// const uuidv4 = require('uuid/v4')
const server = require('../../../src/api/server')
const { wpOrigin } = require('@smooosy/config')
const geo = require('../../__fixtures__/api/models/geo')
const { createCategory } = require('../../__fixtures__/api/models/category')
const { createService } = require('../../__fixtures__/api/models/service')
const { createProfile } = require('../../__fixtures__/api/models/profile')
const { createProService } = require('../../__fixtures__/api/models/proService')
const { createRequest } = require('../../__fixtures__/api/models/request')
const { createUser } = require('../../__fixtures__/api/models/user')

const { Service } = require('../../../src/api/models')
const { Chat, Crawl, FormattedRequest, Keyword, Lead, Location, LocationService, Media, Meet, MeetTemplate, Profile, ProfileIntroduction, ProService, Review, RuntimeConfig, ServiceArea } = require('../../../src/api/models')
const { getLocationService, getLocationServiceProfiles, getServiceCategory, servicePage, contentDraftLoad, contentDraftSave } = require('../../../src/api/routes/services')
const redis = require('../../../src/api/lib/redis')
const { postProcess } = require('../../../test/api/helpers/testutil')

const context: any = {}
beforeAll(async () => {
  context.location = await Location.create({
    isPublished: true,
    group: [],
    name: '東京都',
    key: 'tokyo',
    distance: 40000,
    loc: geo.points.tokyo,
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    depth: 0,
    keyPath: 'tokyo',
  })

  context.category = await createCategory()
  context.service = await createService({category: context.category})
  context.service2 = await createService({category: context.category})
  context.user = await createUser()
  context.pro = await createUser({pro: true})
  context.profile = await createProfile({
    loc: geo.points.tokyo,
    pro: context.pro,
    services: [ context.service ],
  })
  context.proService = await createProService({
    loc: geo.points.tokyo,
    service: context.service,
    user: context.pro,
    profile: context.profile,
  })

  context.locationService = await LocationService.create({
    key: 'tokyo',
    name: '東京都',
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    keyPath: 'tokyo',
    isGroup: false,
    profiles: [context.profile.id],
    leads: [],
    service: context.service.id,
    count: 3,
  })
  context.locationService2 = await LocationService.create({
    key: 'kanagawa',
    name: '神奈川県',
    parentKey: 'japan',
    parentName: '日本',
    path: '神奈川県',
    keyPath: 'kanagawa',
    isGroup: false,
    profiles: [context.profile.id],
    leads: [],
    service: context.service.id,
    count: 3,
  })
  context.locationService3 = await LocationService.create({
    path: '東京都,港区',
    keyPath: 'tokyo,minato',
    isGroup: false,
    profiles: [context.profile.id],
    leads: [],
    service: context.service.id,
    key: 'minato',
    name: '港区',
    parentKey: 'tokyo',
    parentName: '東京都',
    count: 3,
  })
  context.locationRelatedService = await LocationService.create({
    key: 'tokyo',
    name: '東京都',
    parentKey: 'japan',
    parentName: '日本',
    path: '東京都',
    keyPath: 'tokyo',
    isGroup: false,
    profiles: [context.profile.id],
    leads: [],
    service: context.service2.id,
    count: 3,
  })
  context.request = await createRequest({
    loc: geo.points.tokyo,
    service: context.service,
    customer: context.user,
  })
  context.formattedRequest = await FormattedRequest.create({
    service: context.service.id,
    request: context.request.id,
    prefecture: '東京都',
    public: true,
  })
})

afterAll(async () => {
  await postProcess()
})

describe('getServiceCategory', () => {
  test('pref, keyからServiceとCategoryが取得できる', async () => {
    const res = await getServiceCategory({key: context.service.key, pref: 'tokyo'})
    expect(res.service.id).toBe(context.service.id)
    expect(res.service.pageInformation).toBeFalsy() // 子ページはpageInformationはない
    expect(res.service.pageLayout).toBe(null) // TODO: check data will change by key,pref,city
    expect(res.category.id).toBe(context.category.id)
    expect(res.relatedServices[0].id).toBe(context.service.id)
  })
  test('pref, city, keyからServiceとCategoryが取得できる', async () => {
    const res = await getServiceCategory({key: context.service.key, pref: 'tokyo', city: 'minato'})
    expect(res.service.id).toBe(context.service.id)
    expect(res.service.pageInformation).toBeFalsy() // 子ページはpageInformationはない
    expect(res.service.pageLayout).toBe(null) // TODO: check data will change by key,pref,city
    expect(res.category.id).toBe(context.category.id)
    expect(res.relatedServices[0].id).toBe(context.service.id)
  })
  test('keyからServiceとCategoryが取得できる', async () => {
    const res = await getServiceCategory({key: context.service.key})
    expect(res.service.id).toBe(context.service.id)
    expect(res.service.pageInformation.length).toBe(2)
    expect(res.service.pageLayout).toBe(null) // TODO: check data will change by key,pref,city
    expect(res.category.id).toBe(context.category.id)
    expect(res.relatedServices[0].id).toBe(context.service.id)
  })
})

describe('getLocationService', () => {
  test('service, pref, city, town, keyPath, parentKeyPathからLocationService, Locationが取得できる', async () => {
    const res = await getLocationService({
      category: context.category, service: context.service,
      relatedServices: [context.service, context.service2],
      pref: 'tokyo',
    })
    expect(res.location.id).toBe(context.location.id)
    expect(res.locationService._id.toString()).toBe(context.locationService.id)
    expect(res.brothers.length).toBe(2)
    expect(res.children.length).toBe(1)
    expect(res.locationRelatedServices.length).toBe(2)
    expect(res.locationCategories.length).toBe(1)
  })
})

async function createDataForLocationServiceProfiles(context, locationService, numOfProServices) {
  const reviews = []
  const proServices = []
  for (let i = 0; i < 12; i++) {
    const u = await createUser({pro: true})
    const p = await createProfile({
      loc: geo.points.tokyo,
      service: context.service,
      pro: u,
      score: i,
      description: '共通自己紹介文',
    })
    const r = await Review.create({
      profile: p,
      service: context.service,
      rating: 5,
      username: `Reviewer ${i+1}`,
      text: 'A'.repeat(31),
    })
    p.reviews.push(r)
    await p.save()
    reviews.push(r)

    const ps = await createProService({
      user: u,
      profile: p,
      service: context.service,
      loc: context.location.loc,
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

describe('getLocationServiceProfiles', () => {
  // runtime config が他テストに影響するので serial 実行
  test('getLocationServiceProfiles: review 12 に満たない場合は切り替えなし', async () => {
    const query = {
      pref: 'tokyo',
    }
    const res = await getLocationServiceProfiles(query, context.service)
    expect(res).toBe(null)
  })

  // runtime config が他テストに影響するので serial 実行
  test('getLocationServiceProfiles: review 12 ある場合, reviews と proServices それぞれのデータを持った 24 プロフィール取得できる', async () => {
    await createDataForLocationServiceProfiles(context, context.locationService2, 12)
    const rc = await RuntimeConfig.create({
      name: 'newSp',
      isEnabled: true,
      priority: 1,
      serivces: [context.service._id],
      rollout: {
        start: 0,
        end: 100,
      },
    })

    const query = {
      pref: 'kanagawa',
    }
    const res = await getLocationServiceProfiles(query, context.service)
    expect(res.profiles.length).toBe(24)
    expect(res.profiles[0].reviews[0].text).toBe('A'.repeat(31))
    expect(res.profiles[0].description).toBe(null)
    expect(res.profiles[0].score).toBe(11)
    expect(res.profiles[12].reviews.length).toBe(0)
    expect(res.profiles[12].description).toBe('サービス別自己紹介文')
    expect(res.profiles[12].score).toBe(11)
    await rc.remove()
  })

  // runtime config が他テストに影響するので serial 実行
  test('getLocationServiceProfiles: review 12 ある場合, reviews & proServices 両データを持った 12 プロフィール取得できる', async () => {
    await createDataForLocationServiceProfiles(context, context.locationService3, 0)
    const rc = await RuntimeConfig.create({
      name: 'newSp',
      isEnabled: true,
      priority: 1,
      serivces: [context.service._id],
      rollout: {
        start: 0,
        end: 100,
      },
    })

    const query = {
      pref: 'tokyo',
      city: 'minato',
    }
    const res = await getLocationServiceProfiles(query, context.service)
    expect(res.profiles.length).toBe(12)
    expect(res.profiles[0].reviews[0].text).toBe('A'.repeat(31))
    expect(res.profiles[0].description).toBe('サービス別自己紹介文')
    expect(res.profiles[0].score).toBe(11)
    await rc.remove()
  })
})

describe('servicePage', () => {
  test('servicePageからservice, category, locationservice, brothers, children, formattedRequest, profilesが取得できる', async () => {
    nock(wpOrigin)
      .get(`/wp-json/custom/v1/posts?type=customer&category=${context.service.wpId}&pref=tokyo&per_page=6`)
      .reply(200, [])

    let response
    await servicePage({params: {key: context.service.key}, query: {pref: 'tokyo'}}, {json: (data) => response = data})
    expect(response.service._id.toString()).toBe(context.service.id)
    expect(response.category._id.toString()).toBe(context.category.id)
    expect(response.locationService._id.toString()).toBe(context.locationService.id)
    expect(response.brothers.length).toBe(2)
    expect(response.children.length).toBe(1)
    expect(response.request._id.toString()).toBe(context.formattedRequest.id)
    expect(response.profiles.length).toBe(1)
    expect(response.locationRelatedServices.length).toBe(2)
    expect(response.locationCategories.length).toBe(1)
    // TODO: media, lead, reviewInfo
  })
})

describe('contentDraftLoad', () => {
  test('ServicePageコンテンツを下書き保存&読み込みができる', async () => {
    const service = context.service

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
    expect(contentData.pageInformation).toEqual(loadResponse.pageInformation)
  })

  test('ServicePageコンテンツを下書き保存は５件までで古いものから削除される', async () => {
    // redisのspcontentを削除
    const keys = await redis.keysAsync('spcontent-*')
    for (const key of keys) {
      await redis.delAsync(key)
    }

    const service = context.service

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
    expect(loadResponses.length).toBe(5)
    for (let i = 0; i < 5; i++) {
      expect(contentDatas[i].pageInformation).toEqual(loadResponses[i].pageInformation)
    }
  })
})

describe('create API', () => {
  beforeEach(async () => {
    context.adminUser = await createUser({admin: 10})
  })

  test('新規作成テスト', async () => {
    const req = {
      body: {
        key: 'test',
        name: 'テスト',
        tags: ['タグ1', 'タグ2'],
      },
    }
    const admin = context.adminUser
    const res = await supertest(server)
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(req.body)

    expect(res.statusCode).toBe(200)
    expect(res.body.id.length > 0).toBe(true)
    expect(res.body.key).toBe(req.body.key)
    expect(res.body.name).toBe(req.body.name)
    expect(res.body.tags).toEqual(req.body.tags)
    // default values
    expect(res.body.priority).toBe(0)
    expect(res.body.enabled).toBe(false)
    expect(res.body.deleted).toBe(false)
    expect(res.body.providerName).toBe('プロ')
    expect(res.body.interview).toBe(false)
    expect(res.body.needMoreInfo).toBe(false)
    expect(res.body.eliminateTime).toBe(60)
    expect(res.body.requestCount).toBe(0)
    expect(res.body.image).toBe('https://dev.smooosy.com/img/services/noimage.png?')
    expect(res.body.queries).toEqual([])
    expect(res.body.proQuestions).toEqual([])
    expect(res.body.pickupMedia).toEqual([])
    expect(res.body. similarServices).toEqual([])
    expect(res.body.recommendServices).toEqual([])
    expect(res.body.pageInformation).toEqual([])
  })

  test('新規作成で重複するキーが重複する場合は 400', async () => {
    const req = {
      body: {
        key: context.service.key,
        name: 'テストサービス',
      },
    }
    const admin = context.adminUser
    const res = await supertest(server)
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(req.body)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      message: 'already exist',
    })
  })
})

describe('delete API', () => {
  test('サービス削除・統合ができる', async () => {
    let service = context.service
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
      key: context.service.key,
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
      Media.create({user: context.pro, type: 'image'}),
      Media.create({user: context.pro, type: 'image'}),
    ])
    let proService = context.proService
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

    const admin = context.adminUser
    await supertest(server)
      .put(`/api/admin/services/delete/${service.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({migrateTo: [service2.id]})
      .expect(200)

    // サービス
    service = await Service.findById(service.id).select('deleted')
    expect(service.deleted).toBe(true)
    service3 = await Service.findById(service3.id)
    expect(service3.similarServices.length).toBe(1)
    expect(service3.similarServices[0].toString()).toBe(service2.id)
    expect(service3.recommendServices.length).toBe(1)
    expect(service3.recommendServices[0].toString()).toBe(service2.id)
    // プロフィール
    let profile = await Profile.findById(context.profile.id)
    expect(profile.services.length).toBe(1)
    profile = await Profile.findOne({_id: context.profile.id, services: service.id})
    expect(profile).toBe(null)
    profile = await Profile.findOne({_id: context.profile.id, services: service2.id})
    expect(profile).not.toBe(null)
    // クロール
    crawl = await Crawl.findById(crawl.id)
    expect(crawl.services.length).toBe(1)
    expect(crawl.services[0].toString()).toBe(service2.id)
    // Lead
    lead = await Lead.findById(lead.id)
    expect(lead.services.length).toBe(1)
    expect(lead.services[0].toString()).toBe(service2.id)
    // ProService
    proService = await ProService.findOne({user: context.pro, service: service.id})
    expect(proService.disabled).toBe(true)
    // 削除されるものたち
    meetTemplate = await MeetTemplate.findById(meetTemplate.id)
    expect(meetTemplate).toBe(null)
    locationService = await LocationService.findById(locationService.id)
    expect(locationService).toBe(null)
    serviceArea = await ServiceArea.findById(serviceArea.id)
    expect(serviceArea).toBe(null)
    profileIntroduction = await ProfileIntroduction.findById(profileIntroduction.id)
    expect(profileIntroduction).toBe(null)
    keyword = await Keyword.findById(keyword.id)
    expect(keyword).toBe(null)
  })
})

describe('priceEstimate API', () => {
  test('質問項目に対してサービス価格が取得できる（id指定）', async () => {
    const service = context.service

    for (let i = 0;i < 20;++i) {
      const chat = await Chat.create({
        user: context.pro.id,
        text: 'よろしくお願いします',
        read: false,
      })
      await Meet.create({
        status: 'waiting',
        request: context.request.id,
        service: context.service.id,
        customer: context.user.id,
        pro: context.pro.id,
        profile: context.profile.id,
        chats: [chat.id],
        price: 10000,
        priceType: 'fixed',
        point: 0,
      })
    }

    const res = await supertest(server)
      .get(`/api/services/priceEstimate?questions=${JSON.stringify([])}&id=${service.id}`)
      .expect(200)

    expect(res.statusCode).toBe(200)
    expect(!!res.body.average).toBe(true)
    expect(!!res.body.high).toBe(true)
    expect(!!res.body.low).toBe(true)
  })

  test('質問項目に対してサービス価格が取得できる（key指定）', async () => {
    const service = context.service

    for (let i = 0;i < 20;++i) {
      const chat = await Chat.create({
        user: context.pro.id,
        text: 'よろしくお願いします',
        read: false,
      })
      await Meet.create({
        status: 'waiting',
        request: context.request.id,
        service: context.service.id,
        customer: context.user.id,
        pro: context.pro.id,
        profile: context.profile.id,
        chats: [chat.id],
        price: 10000,
        priceType: 'fixed',
        point: 0,
      })
    }

    const res = await supertest(server)
      .get(`/api/services/priceEstimate?questions=${JSON.stringify([])}&key=${service.key}`)
      .expect(200)

    expect(res.statusCode).toBe(200)
    expect(!!res.body.average).toBe(true)
    expect(!!res.body.high).toBe(true)
    expect(!!res.body.low).toBe(true)
  })
})
