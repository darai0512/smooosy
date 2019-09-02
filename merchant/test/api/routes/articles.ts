export {}
const test = require('ava')
const nock = require('nock')
const sinon = require('sinon')
const supertest = require('supertest')
const server = require('../../../src/api/server')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')
const { replaceHtmlToModule } = require('../../../src/api/routes/articles')
const { Service } = require('../../../src/api/models')
const { mongoIdToShortId } = require('../../../src/api/lib/mongoid')
const { CloudFront } = require('../../../src/api/lib/aws')
const { wpOrigin } = require('@smooosy/config')

const categoriesResponse = [
  { id: 187, name: 'カメラマン', count: 80, parent: 0 },
  { id: 197, name: '結婚式写真', count: 15, parent: 187 },
  { id: 201, name: 'プロフィール写真', count: 11, parent: 187 },
]

test.beforeEach(async t => {
  await generateServiceUserProfile(t)
  t.context.mediaId = 729
  t.context.errorResponse = {
    response: { status: 404 },
  }
  t.context.notFound = { message: 'not found' }
})

test.after.always(async () => {
  await postProcess()
})

test('ServiceArticlePageのServiceKeyが存在しない場合に404エラー', async t => {
  const mediaId = t.context.mediaId
  const errorResponse = t.context.errorResponse
  const notFound = t.context.notFound
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(404, errorResponse)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  const res = await supertest(server)
    .get(`/api/services/hoge/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)
  t.deepEqual(res.body, notFound)
})

test.serial('ServiceArticlePage APIのMediaIdが存在しない場合に404エラー', async t => {
  const mediaId = t.context.mediaId
  const errorResponse = t.context.errorResponse
  const service = t.context.service
  const notFound = t.context.notFound
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(404, errorResponse)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  const res = await supertest(server)
    .get(`/api/services/${service.key}/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)
  t.deepEqual(res.body, notFound)
})

test.serial('ServiceArticlePage APIのServiceKeyとMediaIdが正しい場合、DOMデータが返却される', async t => {
  const mediaId = t.context.mediaId
  const categoryId = 11
  const response = {
    status: 200,
    title: {
      rendered: 'タイトル',
    },
    content: {
      /* eslint-disable */
      rendered: `
<figure id="attachment_488" class="wp-caption aligncenter"><img class="wp-image-488" src="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-300x200.jpg" alt="結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！" width="601" height="400" srcset="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-300x200.jpg 300w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-768x512.jpg 768w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722.jpg 1000w" sizes="(max-width: 601px) 100vw, 601px" /><figcaption class="wp-caption-text"><strong>結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！</strong></figcaption></figure>
<p>2018/5/21更新</p>
      `,
      /* eslint-enable */
    },
    acf: {},
    article_author: { name: '匿名' },
    categories: [ categoryId ],
    'jetpack-related-posts': [],
    yoast_meta: { yoast_wpseo_title: '' },
  }
  const service = t.context.service
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${categoryId}&pref=all&per_page=6`)
    .reply(200, [], {'x-wp-total': '0'})

  const res = await supertest(server)
    .get(`/api/services/${service.key}/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 200)
  t.not(res.body.doms, undefined)
})

test.serial('ServiceArticlePage: ○選記事が取得できる', async t => {
  const mediaId = t.context.mediaId
  const categoryId = 11
  const response = {
    status: 200,
    title: {
      rendered: 'タイトル',
    },
    content: {
      /* eslint-disable */
      rendered: `
<figure id="attachment_488" class="wp-caption aligncenter"><img class="wp-image-488" src="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-300x200.jpg" alt="結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！" width="601" height="400" srcset="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-300x200.jpg 300w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722-768x512.jpg 768w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_501056722.jpg 1000w" sizes="(max-width: 601px) 100vw, 601px" /><figcaption class="wp-caption-text"><strong>結婚式の持ち込みカメラマン、渾身のおすすめ63選。相場もご紹介！</strong></figcaption></figure>
<p>2018/5/21更新</p>
      `,
      /* eslint-enable */
    },
    acf: {
      marusen: true,
    },
    article_author: { name: '匿名' },
    categories: [ categoryId ],
    'jetpack-related-posts': [],
    yoast_meta: { yoast_wpseo_title: '' },
  }
  const service = t.context.service
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${categoryId}&pref=all&per_page=6`)
    .reply(200, [], {'x-wp-total': '0'})

  const res = await supertest(server)
    .get(`/api/services/${service.key}/pickups/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 200)
  t.not(res.body.doms, undefined)
})

test.serial('styleが消される', async t => {
  const html = `
<p style="color: red;">aaaa</p>
<p   style="color: red;font-size: 14px;" >bbbb</p>
  `
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms[0].dom, '<p>aaaa</p>')
  t.is(doms[1].dom, '<p>bbbb</p>')
})

test('&nbspはスキップされる', async t => {
  const html = `
<p> </p>
<p><img class="alignnone wp-image-868" src="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_509792062.jpg" alt="" width="302" height="151" srcset="https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_509792062.jpg 1000w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_509792062-300x150.jpg 300w, https://smooosy.com/media/wp-content/uploads/2017/08/shutterstock_509792062-768x384.jpg 768w" sizes="(max-width: 302px) 100vw, 302px" /></p>
  `
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms.length, 1)
  t.true(/<p><img .*><\/p>/.test(doms[0].dom))
})

test('ServiceArticlePage APIの返却DOMにページ最下段スクロール固定バーDOMは含まれない', async t => {
  const html = `
<div class="su-fix">
  <div class="su-fix-wrap">
    <form class="su-form" action="https://smooosy.com/services/wedding-photographers" method="get" target="_top">
      <input type="hidden" name="modal" value="true">
      <input type="hidden" name="utm_source" value="media">
      <input type="hidden" name="utm_medium" value="zipfixed">
      <input name="zip" class="zip" placeholder="郵便番号を入力">
      <button class="button" type="submit" role="button">カメラマンを探す</button>
    </form>
  </div>
</div>
  `
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms.length, 0)
})

test('ServiceArticlePage APIの郵便番号DOMはReactComponentに変換される', async t => {
  const html = `
<form class="su-form" action="https://smooosy.com/services/wedding-photographers" method="get" target="_top">
  <input type="hidden" name="modal" value="true">
  <input type="hidden" name="utm_source" value="media">
  <input type="hidden" name="utm_medium" value="zip">
  <input name="zip" class="zip" placeholder="郵便番号を入力">
  <button class="button" type="submit" role="button">カメラマンを探す</button>
</form>
  `
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms.length, 0)
})

test('ServiceArticlePage APIのプロモジュールDOMはReactComponentに変換される', async t => {
  /* eslint-disable */
  const html = `
<div class="su-pro-align" data-reactroot="">
  <div class="mm-img">
    <img class="su-pro-img" src="https://smooosy.com/img/users/58d239f5b462480e8fdfd681.jpg?1518607372488&amp;w=80&amp;h=80">
  </div>
  <div class="su-pro-rect">
    <a class="mm-name su-pro-title" href="https://smooosy.com/p/WNI59bRiSA6P39aC?utm_source=media&amp;utm_medium=profile">鈴木　英隆<!-- --> - <!-- -->東京都豊島区千早</a>
    <div class="mm-desc su-pro-desc">板橋区</div>
  </div>
</div>
  `
  /* eslint-enable */
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms[0].component, 'pro')
})

test('ServiceArticlePage APIのプロ紹介DOMはReactComponentに変換される', async t => {
  const profile = t.context.profile

  const html = `
  <div class="su-intro">${profile.id}</div>
  <div class="su-intro">${mongoIdToShortId(profile.id)}</div>
  `

  const { doms } = await replaceHtmlToModule(html)
  t.is(doms[0].component, 'intro')
  t.is(doms[1].component, 'intro')
})

test('ServiceArticlePage APIの価格分布DOMはReactComponentに変換される', async t => {
  const service = t.context.service

  const html = `
<div class="su-price">${service.key}</div>
  `
  const { doms } = await replaceHtmlToModule(html)
  t.is(doms[0].component, 'price')
})

test.serial('wpIdがマッチしない場合、エラーになる', async t => {
  const mediaId = t.context.mediaId
  const categoryId = 99
  const response = {
    status: 200,
    title: {
      rendered: 'タイトル',
    },
    content: {
      rendered: '<div>hello</div>',
    },
    acf: {},
    article_author: { name: '匿名' },
    categories: [ categoryId ],
    'jetpack-related-posts': [],
    yoast_meta: { yoast_wpseo_title: '' },
  }
  const service = t.context.service
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${categoryId}&pref=all&per_page=6`)
    .reply(200, [], {'x-wp-total': '0'})

  let res = await supertest(server)
    .get(`/api/services/${service.key}/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)

  await Service.create({
    name: '99サービス',
    key: '99-service',
    wpId: 99,
  })

  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${categoryId}&pref=all&per_page=6`)
    .reply(200, [], {'x-wp-total': '0'})

  res = await supertest(server)
    .get(`/api/services/${service.key}/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)
  t.is(res.body.redirect, `/services/99-service/media/${mediaId}`)

})

test.serial('articles API で○選記事にアクセスした場合は redirect になる', async t => {
  const service = await Service.create({
    name: '100サービス',
    key: '100-service',
    category: t.context.category,
    tags: [ t.context.category.name ],
    wpId: 100,
  })

  const mediaId = t.context.mediaId
  const categoryId = 100
  const response = {
    status: 200,
    title: {
      rendered: 'タイトル',
    },
    content: {
      rendered: '<div>hello</div>',
    },
    acf: {
      marusen: true,
    },
    article_author: { name: '匿名' },
    categories: [ categoryId ],
    'jetpack-related-posts': [],
    yoast_meta: { yoast_wpseo_title: '' },
  }
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  const res = await supertest(server)
    .get(`/api/services/${service.key}/articles/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)
  t.is(res.body.redirect, `/services/${service.key}/pickups/${mediaId}`)
})

test.serial('pickups API で通常記事にアクセスした場合は redirect になる', async t => {
  const service = await Service.create({
    name: '101サービス',
    key: '101-service',
    category: t.context.category,
    tags: [ t.context.category.name ],
    wpId: 101,
  })

  const mediaId = t.context.mediaId
  const categoryId = 101
  const response = {
    status: 200,
    title: {
      rendered: 'タイトル',
    },
    content: {
      rendered: '<div>hello</div>',
    },
    acf: {},
    article_author: { name: '匿名' },
    categories: [ categoryId ],
    'jetpack-related-posts': [],
    yoast_meta: { yoast_wpseo_title: '' },
  }
  nock(wpOrigin)
    .get(`/wp-json/wp/v2/posts/${mediaId}`)
    .reply(200, response)

  nock(wpOrigin)
    .get('/wp-json/custom/v1/categories')
    .reply(200, categoriesResponse)

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/posts?type=customer&category=${categoryId}&pref=all&per_page=6`)
    .reply(200, [], {'x-wp-total': '0'})

  const res = await supertest(server)
    .get(`/api/services/${service.key}/pickups/${mediaId}`)
  nock.cleanAll()

  t.is(res.status, 404)
  t.is(res.body.redirect, `/services/${service.key}/media/${mediaId}`)
})

test.serial('categoryのメディアページのキャッシュが正常に削除できる', async t => {
  const category = t.context.category
  const mediaId = t.context.mediaId
  const responseBody = {Invalidation: {Id: 'IABCDEFG12345'}}

  const cloudFrontMock = sinon.mock(CloudFront)
  cloudFrontMock.expects('cacheInvalidation').once()
    .withArgs(sinon.match.array.deepEquals([
      `/media/wp-json/wp/v2/posts/${mediaId}`,
      `/t/${category.key}/media/${mediaId}`,
      `/api/categories/${category.key}/articles/${mediaId}`,
    ]))
    .returns(responseBody)

  const wpToken = 1234567

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/is_wploggedin?wptoken=${encodeURIComponent(wpToken)}`)
    .reply(200, true)

  const res = await supertest(server)
    .post(`/media/cacheInvalidation/${mediaId}`)
    .set('Cookie', [`wordpress_logged_in_1234567=${wpToken}`])
    .send({category: category.key})

  t.is(res.status, 200)
  t.deepEqual(res.body, responseBody)

  cloudFrontMock.verify()
  cloudFrontMock.restore()
})

test.serial('serviceのメディアページのキャッシュが正常に削除できる', async t => {
  const service = t.context.service
  const mediaId = t.context.mediaId
  const responseBody = {Invalidation: {Id: 'IABCDEFG12345'}}
  const cloudFrontMock = sinon.mock(CloudFront)
  cloudFrontMock.expects('cacheInvalidation').once()
    .withArgs(sinon.match.array.deepEquals([
      `/media/wp-json/wp/v2/posts/${mediaId}`,
      `/services/${service.key}/media/${mediaId}`,
      `/api/services/${service.key}/articles/${mediaId}`,
    ]))
    .returns(responseBody)

  const wpToken = 1234567

  nock(wpOrigin)
    .get(`/wp-json/custom/v1/is_wploggedin?wptoken=${encodeURIComponent(wpToken)}`)
    .reply(200, true)

  const res = await supertest(server)
    .post(`/media/cacheInvalidation/${mediaId}`)
    .set('Cookie', [`wordpress_logged_in_1234567=${wpToken}`])
    .send({service: service.key})

  t.is(res.status, 200)
  t.deepEqual(res.body, responseBody)

  cloudFrontMock.verify()
  cloudFrontMock.restore()
})
