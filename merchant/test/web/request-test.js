const test = require('ava')
const puppeteer = require('puppeteer')
const moment = require('moment')

const context = {}
test.before('setup context', async t => {
  const { TEST_GMAIL, TEST_ORIGIN, HEADLESS } = process.env
  t.regex(TEST_GMAIL, /^[0-9a-z.]+@(gmail|smooosy)\.com$/, '環境変数TEST_GMAILにGmailアドレスを設定してください')

  context.emailHost = TEST_GMAIL.split('@')[1]
  context.username = `${TEST_GMAIL.split('@')[0]}+${Math.floor(Date.now() / 1000)}`
  context.username2 = `${TEST_GMAIL.split('@')[0]}+${Math.floor(Date.now() / 1000) + 1}`
  context.password = 'password'
  context.address = '港区赤坂'
  context.phone = '09011112222'
  context.origin = TEST_ORIGIN || 'http://localhost:3000'
  context.browser = await puppeteer.launch({
    headless: !!HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })
  context.page = await context.browser.newPage()
  await context.page.setUserAgent('smooosy-web-test')
})

test.serial('依頼（未登録ユーザー）', async t => {
  await postRequest('wedding-photographers', context.username).catch(err => t.fail(err.message))
  t.pass()
})

test.serial('依頼（ログインユーザー）', async t => {
  await postRequest('house-cleaning', context.username).catch(err => t.fail(err.message))
  t.pass()
})

test.serial('ログアウト', async t => {
  const { page, origin } = context
  await page.goto(`${origin}/logout`)
  // XXX TODO: 本当にログアウトできてるかチェックする
  t.pass()
})

test.serial('ユーザー登録', async t => {
  const { page, origin, emailHost, username2, password } = context
  const email = `${username2}@${emailHost}`

  await page.goto(`${origin}/signup`)
  await page.waitFor('.signupEmail')
  await page.type('.signupEmail', email)
  await page.type('.signupPassword', password)
  await page.type('.signupLastname', username2)
  await page.click('.signupSubmit')
  t.pass()
})

test.serial('ログアウト（after ユーザー登録）', async t => {
  const { page, origin } = context
  await page.goto(`${origin}/logout`)
  // XXX TODO: 本当にログアウトできてるかチェックする
  t.pass()
})

test.serial('依頼（未ログインの登録済ユーザー）', async t => {
  await postRequest('drone-aerial-photographers', context.username2).catch(err => t.fail(err.message))
  t.pass()
})

test.after('cleanup', async () => {
  await context.browser.close()
})

// XXX TODO: 対応してないqueryがきたときにテスト通過してしまうので、QueryThanksにちゃんと対応する
async function getQueryType(page) {
  await page.waitFor(500)
  if (await page.$('.select')) return 'select'
  if (await page.$('.hello')) return 'hello'
  if (await page.$('.queryLabel')) return 'common'
  if (await page.$('.priceLabel')) return 'price'
  if (await page.$(`.day_${moment().format('YYYYMMDD')}`)) return 'calendar'
  if (await page.$('.timeSelect')) return 'calendar-time'
  if (await page.$('.timeSelect-multi')) return 'calendar-time-multi'
  if (await page.$('.googleMapInput')) return 'location'
  if (await page.$('.textareaField')) return 'textarea'
  if (await page.$('.emailInput')) return 'email'
  if (await page.$('.lastnameField')) return 'lastname'
  if (await page.$('.submitting')) return 'submitting'
  if (await page.$('.setPasswordField')) return 'password'
  if (await page.$('.phoneInputField')) return 'phone'
  if (await page.$('.phoneRequireInputField')) return 'phoneRequire'
  if (await page.$('.skip.line')) return 'line'
  if (await page.$('.loginPassword')) return 'login'
  if (await page.$('.nextQuery.image')) return 'image'
  if (await page.$('.nextQuery.number')) return 'number'
  if (await page.$('.userRequestPage')) return 'created'
  return 'default'
}

async function postRequest(service, username) {
  const { page, emailHost, password, address, phone, origin } = context

  page.waitForWithTimeout = (selector, timeout) => new Promise((resolve, reject) => {
    setTimeout(reject, timeout)
    page.waitFor(selector).then(resolve).catch(reject)
  })
  const timeoutError = () => {
    throw new Error('timeout error')
  }

  await page.goto(`${origin}/services/${service}`)
  await page.waitFor('.zipButton').catch(timeoutError)

  // 依頼ボタン
  await page.click('.zipButton').catch(() => {
    throw new Error('not published service')
  })

  await page.waitForSelector('.nextQuery')

  let tryCount = 0
  let doing = true
  for (let i = 1, queryType; doing && (queryType = await getQueryType(page)); i++) {
    console.log('QueryCard:', queryType)
    try {
      switch (queryType) {
        case 'select':
          await page.click('.nextQuery')
          break
        case 'hello':
          await page.click('.nextQuery')
          break
        case 'common':
          await page.click('.queryLabel')
          await page.click('.nextQuery.common')
          break
        case 'price':
          await page.click('.priceLabel')
          await page.click('.nextQuery.price')
          break
        case 'number':
          await page.click('.nextQuery.number')
          break
        case 'calendar':
          await page.click(`.day_${moment().format('YYYYMMDD')}`)
          await page.click('.nextQuery.calendar')
          break
        case 'calendar-time':
          await page.click('.time')
          await page.waitFor('.time_0')
          await page.click('.time_0')
          await page.waitFor('.time_0', { hidden: true })
          await page.click('.nextQuery.calendar')
          break
        case 'calendar-time-multi':
          await page.click('.nextQuery.calendar')
          break
        case 'location':
          await page.click('.googleMapInput')
          await page.type('.googleMapInput', address, { delay: 100 })
          await page.waitFor(2000)
          await page.waitForXPath('//div[@class="address" and contains(text(), "周辺")]')
          await page.click('.nextQuery.location')
          break
        case 'textarea':
          await page.type('.textareaField', '事業者へのコメント')
          await page.click('.nextQuery.textarea')
          break
        case 'email':
          // retry で無限に入力されるため、毎回リセットする
          await page.evaluate(selector => {
            document.querySelector(selector).value = ''
          }, '.emailInput')
          await page.type('.emailInput', `${username}@${emailHost}`)
          await page.click('.nextQuery.email')
          break
        case 'lastname':
          // retry で無限に入力されるため、毎回リセットする
          await page.evaluate(selector => {
            document.querySelector(selector).value = ''
          }, '.lastnameField')
          await page.type('.lastnameField', username)
          await page.click('.nextQuery.name')
          await page.waitFor(2000)
          break
        case 'submitting':
          await page.waitFor(3000)
          break
        case 'password':
          await page.type('.setPasswordField', password)
          await page.click('.next.password')
          break
        case 'phone':
          await page.click('.next.phone')
          // TODO: remove when AB test end
          if (await page.$('.phoneInputSkip')) {
            await page.click('.phoneInputSkip')
          }
          break
        case 'phoneRequire':
          await page.type('.phoneRequireInputField', phone)
          await page.click('.nextQuery.phone')
          break
        case 'line':
          await page.click('.skip.line')
          break
        case 'image':
          await page.click('.nextQuery.image')
          break
        case 'login':
          await page.type('.loginPassword', password)
          await page.click('.loginSubmit')
          await page.waitFor(2000)
          break
        case 'created':
          console.log('Request created.')
          doing = false
          break
        default:
          throw new Error('No target elements found.')
      }
    } catch (e) {
      tryCount++
      console.error(`${tryCount} times error.`)
      console.error(e)
      if (tryCount > 5) {
        console.error('maximum try count.')
        throw new Error('Too much error.')
      }
      await page.waitFor(2000)
    }
  }

}
