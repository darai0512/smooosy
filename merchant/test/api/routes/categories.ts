export {}
const test = require('ava')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const uuidv4 = require('uuid/v4')

const { contentDraftLoad, contentDraftSave } = require('../../../src/api/routes/categories')
const { Category } = require('../../../src/api/models')
const redis = require('../../../src/api/lib/redis')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')

const runTestCases = require('../models/helpers/runTestCases')

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
})

test.after.always(async () => {
  await postProcess()
})

test.serial('CategoryPageコンテンツを下書き保存&読み込みができる', async t => {
  const category = t.context.category

  const contentData = {
    'id': category.id,
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
  await contentDraftSave({user: {lastname: 'テスト', firstname: '太郎'}, params: {id: category.id}, body: contentData}, {json: () => {}})
  await contentDraftLoad({params: {id: category.id}}, {json: (data) => loadResponses = data})
  const loadResponse = loadResponses[0]
  t.deepEqual(contentData.pageInformation, loadResponse.pageInformation)
})

test.serial('CategoryPageコンテンツを下書き保存は５件までで古いものから削除される', async t => {
  // redisのcpcontentを削除
  const keys = await redis.keysAsync('cpcontent-*')
  for (const key of keys) {
    await redis.delAsync(key)
  }

  const category = t.context.category

  const contentDatas = []
  for (let i = 0; i < 6; i++) {
    const contentData = {
      'id': category.id,
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

    await contentDraftSave({user: {lastname: 'テスト', firstname: '太郎'}, params: {id: category.id}, body: contentData}, {json: () => {}})
  }

  let loadResponses
  await contentDraftLoad({params: {id: category.id}}, {json: (data) => loadResponses = data})
  t.is(loadResponses.length, 5)
  for (let i = 0; i < 5; i++) {
    t.deepEqual(contentDatas[i].pageInformation, loadResponses[i].pageInformation)
  }
})

test('新規作成テスト', async t => {
  const uid = uuidv4()
  const req = {
    body: {
      key: `test_${uid}`,
      name: 'テスト',
      parent: 'lifestyle',
      pageDescription: '説明\nテスト',
      description: 'テスト',
      priority: 99,
    },
  }

  const admin = t.context.adminUser
  const res = await supertest(server)
    .post('/api/admin/categories')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 200)
  t.true(res.body.id.length > 0)
  t.is(res.body.description, req.body.description)
  t.is(res.body.priority, req.body.priority)
  t.is(res.body.pageDescription, req.body.pageDescription)
  t.is(res.body.name, req.body.name)
  t.is(res.body.parent, req.body.parent)
})

test('新規作成で重複するキーが重複する場合は 400', async t => {
  const req = {
    body: {
      key: t.context.category.key,
      name: 'カテゴリ名',
      parent: 'lifestyle',
      pageDescription: '説明\nテスト',
      description: 'テスト',
      priority: 99,
    },
  }

  const admin = t.context.adminUser
  const res = await supertest(server)
    .post('/api/admin/categories')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 400)
  t.deepEqual(res.body, {
    message: 'already exist',
  })
})

test('更新パラメータが１つでもあればupdateできる', async t => {
  const id = t.context.category.id
  const req: any = {
    body: {
      pageInformation: [
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
    },
  }

  const admin = t.context.adminUser
  const res = await supertest(server)
    .put(`/api/admin/categories/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 200)

  const category = await Category.findOne({_id: id})
  const pageInformation: any = Array.from(category.pageInformation.toObject())
  t.is(pageInformation.length, 2)
  for (let i = 0; i < pageInformation.length; i++) {
    // to use deepEqual copy ObjectID
    req.body.pageInformation[i]._id = pageInformation[i]._id
    t.deepEqual(pageInformation[i], req.body.pageInformation[i])
  }

  t.is(category.description, t.context.category.description)
  t.is(category.priority, t.context.category.priority)
  t.is(category.pageDescription, t.context.category.pageDescription)
  t.is(category.name, t.context.category.name)
  t.is(category.parent, t.context.category.parent)
})

test('更新パラメータが複数updateできる', async t => {
  const id = t.context.category.id
  const uid = uuidv4()
  const req: any = {
    body: {
      name: `テスト_${uid}`,
      parent: 'lifestyle',
      pageDescription: '説明\nテスト',
      description: 'テスト',
      priority: 99,
      pageInformation: [
        {
          'type': 'zipbox',
          'column': 12,
        },
      ],
    },
  }

  const admin = t.context.adminUser
  const res = await supertest(server)
    .put(`/api/admin/categories/${id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send(req.body)

  t.is(res.statusCode, 200)

  const category = await Category.findOne({_id: id})
  t.is(category.description, req.body.description)
  t.is(category.priority, req.body.priority)
  t.is(category.pageDescription, req.body.pageDescription)
  t.is(category.name, req.body.name)
  t.is(category.parent, req.body.parent)

  const pageInformation: any = Array.from(category.pageInformation.toObject())
  t.is(pageInformation.length, 1)
  for (let i = 0; i < pageInformation.length; i++) {
    // to use deepEqual copy ObjectID
    req.body.pageInformation[i]._id = pageInformation[i]._id
    t.deepEqual(pageInformation[i], req.body.pageInformation[i])
  }
})

const showForInsightTestCases = [
  {
    name: 'profile showForInsight: 200',
    modifiers: async function(context) {
      context.category.key = 'photographers'
      await context.category.save()
    },
    expected: {
      status: 200,
      body: {
        averageRating: 4.88,
        averageTimeToMeet: 152,
        proAnswerCount: 3.6,
        reviewCount: 5.4,
      },
    },
  },
  {
    name: 'profile showForInsight: 200 no category data',
    expected: {
      status: 200,
      body: {
        averageRating: 4.89,
        averageTimeToMeet: 173,
        proAnswerCount: 2.4,
        reviewCount: 4.2,
      },
    },
  },
  {
    name: 'profile showForInsight: 404 category not found',
    modifiers: async function(context) {
      context.category.name = 'xxx'
      // don't save for not found.
    },
    expected: {
      status: 404,
      body: {
        message: 'not found',
      },
    },
  },
]

async function runRequestsForNewProTestRunner(t, tc) {
  // run modifiers on input
  if (tc.modifiers) {
    await tc.modifiers(t.context)
  }

  const res = await supertest(server)
    .get(`/api/categories/${encodeURIComponent(t.context.category.name)}/insights`)
    .set('Authorization', `Bearer ${t.context.pro.token}`)
    .expect(tc.expected.status)

  t.deepEqual(res.body, tc.expected.body)
}

runTestCases(test, showForInsightTestCases, runRequestsForNewProTestRunner)
