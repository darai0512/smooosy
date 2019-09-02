export {}
const test = require('ava')
const nock = require('nock')
const supertest = require('supertest')
const server = require('../../../src/api/server')

const { webOrigin } = require('@smooosy/config')

const runTestCases = require('../models/helpers/runTestCases')

const WP_ORIGIN = 'https://public-api.wordpress.com'
const WP_SITE_ID = 123456789

const indexTestCases = [
  {
    name: 'index: 200',
    input: {
      query: 'fields=ID%2Cdate%2Ctitle%2Ccategories&number=10',
      status: 200,
      response: {
        found: 3,
        posts: [
          {
            ID: 12183,
            date: '2018-09-28T19:02:55+09:00',
            title: '日刊自動車新聞掲載　CEO/石川のインタビュー　～修理希望者と整備業者をマッチング～',
            categories: {
              'media-publication': {
                ID: 681269897,
                name: 'media-publication',
                slug: 'media-publication',
                description: 'メディア掲載',
                post_count: 3,
                parent: 103,
                meta: {
                  links: {
                    self: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:media-publication',
                    help: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:media-publication/help',
                    site: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580',
                  },
                },
              },
            },
          },
          {
            ID: 12192,
            date: '2018-07-05T22:44:16+09:00',
            title: '地域版クラウドソーシング「SMOOOSY」とBSサミットが自動車整備領域で提携',
            categories: {
              'press-release': {
                ID: 6672,
                name: 'press-release',
                slug: 'press-release',
                description: 'プレスリリース',
                post_count: 2,
                parent: 103,
                meta: {
                  links: {
                    self: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:press-release',
                    help: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:press-release/help',
                    site: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580',
                  },
                },
              },
            },
          },
          {
            ID: 22156,
            date: '2017-03-08T19:58:00+09:00',
            title: 'SMOOOSYメディアが始まりました！',
            categories: {
              'service-info': {
                ID: 681269857,
                name: 'service-info',
                slug: 'service-info',
                description: 'お知らせ',
                post_count: 5,
                parent: 103,
                meta: {
                  links: {
                    self: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:service-info',
                    help: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:service-info/help',
                    site: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580',
                  },
                },
              },
            },
          },
        ],
        meta: {
          links: {
            counts: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/post-counts/post',
          },
          wpcom: true,
        },
      },
    },
    expected: {
      status: 200,
      body: {
        total: 3,
        posts: [
          {
            id: 12183,
            date: '2018-09-28T19:02:55+09:00',
            title: '日刊自動車新聞掲載　CEO/石川のインタビュー　～修理希望者と整備業者をマッチング～',
            url: `${webOrigin}/company/news/12183`,
            category: {
              id: 681269897,
              key: 'media-publication',
              name: 'メディア掲載',
            },
          },
          {
            id: 12192,
            date: '2018-07-05T22:44:16+09:00',
            title: '地域版クラウドソーシング「SMOOOSY」とBSサミットが自動車整備領域で提携',
            url: `${webOrigin}/company/news/12192`,
            category: {
              id: 6672,
              key: 'press-release',
              name: 'プレスリリース',
            },
          },
          {
            id: 22156,
            date: '2017-03-08T19:58:00+09:00',
            title: 'SMOOOSYメディアが始まりました！',
            url: `${webOrigin}/company/news/22156`,
            category: {
              id: 681269857,
              key: 'service-info',
              name: 'お知らせ',
            },
          },
        ],
      },
    },
  },
  {
    name: 'index: 200 no category',
    input: {
      query: 'fields=ID%2Cdate%2Ctitle%2Ccategories&number=10',
      status: 200,
      response: {
        found: 1,
        posts: [
          {
            ID: 22156,
            date: '2017-03-08T19:58:00+09:00',
            title: 'SMOOOSYメディアが始まりました！',
            categories: {
            },
          },
        ],
        meta: {
          links: {
            counts: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/post-counts/post',
          },
          wpcom: true,
        },
      },
    },
    expected: {
      status: 200,
      body: {
        total: 1,
        posts: [
          {
            id: 22156,
            date: '2017-03-08T19:58:00+09:00',
            title: 'SMOOOSYメディアが始まりました！',
            url: `${webOrigin}/company/news/22156`,
            category: null,
          },
        ],
      },
    },
  },
]

async function runIndexTestRunner(t, tc) {
  nock(WP_ORIGIN)
    .get(`/rest/v1.1/sites/${WP_SITE_ID}/posts?${tc.input.query}`)
    .reply(tc.input.status, tc.input.response)

  const res = await supertest(server)
    .get('/api/news')
    .expect(tc.expected.status)

  t.deepEqual(res.body, tc.expected.body)
}

runTestCases(test, indexTestCases, runIndexTestRunner)



const showTestCases = [
  {
    name: 'show: 200',
    input: {
      params: {
        id: 22156,
      },
      query: 'fields=ID%2Cdate%2Ctitle%2Ccategories%2Cmodified%2Ccontent',
      status: 200,
      response: {
        ID: 22156,
        date: '2017-03-08T19:58:00+09:00',
        modified: '2019-06-13T23:27:40+09:00',
        title: 'SMOOOSYメディアが始まりました！',
        content: '<p>SMOOOSYメディアでは、SMOOOSYで事業者を探したい人・SMOOOSYで事業者として活躍したい人への記事を配信していきます。</p> <p>SMOOOSYで、見積もりを、もっと簡単に。</p> <p>見つけるのを、もっと楽しく。</p> <p>出会う、もっと沢山の人と。</p> <p>SMOOOSYは、圧倒的に簡単で、この上なくぴったりな、ローカルサービス全てのプラットフォームを目指し、進化し続けます。</p> ',
        categories: {
          'service-info': {
            ID: 681269857,
            name: 'service-info',
            slug: 'service-info',
            description: 'お知らせ',
            post_count: 5,
            parent: 103,
            meta: {
              links: {
                self: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:service-info',
                help: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580/categories/slug:service-info/help',
                site: 'https://public-api.wordpress.com/rest/v1.1/sites/162710580',
              },
            },
          },
        },
      },
    },
    expected: {
      status: 200,
      body: {
        id: 22156,
        date: '2017-03-08T19:58:00+09:00',
        title: 'SMOOOSYメディアが始まりました！',
        url: `${webOrigin}/company/news/22156`,
        category: {
          id: 681269857,
          key: 'service-info',
          name: 'お知らせ',
        },
        content: '<p>SMOOOSYメディアでは、SMOOOSYで事業者を探したい人・SMOOOSYで事業者として活躍したい人への記事を配信していきます。</p> <p>SMOOOSYで、見積もりを、もっと簡単に。</p> <p>見つけるのを、もっと楽しく。</p> <p>出会う、もっと沢山の人と。</p> <p>SMOOOSYは、圧倒的に簡単で、この上なくぴったりな、ローカルサービス全てのプラットフォームを目指し、進化し続けます。</p> ',
      },
    },
  },
]

async function runShowTestRunner(t, tc) {
  nock(WP_ORIGIN)
    .get(`/rest/v1.1/sites/${WP_SITE_ID}/posts/${tc.input.params.id}?${tc.input.query}`)
    .reply(tc.input.status, tc.input.response)

  const res = await supertest(server)
    .get(`/api/news/${tc.input.params.id}`)
    .expect(tc.expected.status)

  t.deepEqual(res.body, tc.expected.body)
}

runTestCases(test, showTestCases, runShowTestRunner)
