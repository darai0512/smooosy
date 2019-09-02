const test = require('ava')
const puppeteer = require('puppeteer')

const sel = className => `.${className}`
const DEFAULT_TIMEOUT = 3000
const timeoutError = () => {
  throw new Error('timeout error')
}

const context = {}
test.before('setup context', async t => {
  const { TEST_GMAIL, TEST_ORIGIN, HEADLESS } = process.env
  t.regex(TEST_GMAIL, /^[0-9a-z.]+@(gmail|smooosy)\.com$/, '環境変数TEST_GMAILにGmailアドレスを設定してください')

  const now = Math.floor(Date.now() / 1000)
  const emailHost = TEST_GMAIL.split('@')[1]
  const username = `${TEST_GMAIL.split('@')[0]}+${now}`
  context.user = {
    email: `${username}@${emailHost}`,
    lastname: 'SMOOOSY',
    phone: '07012345678',
    password: 'password',
  }
  context.profile = {
    name: 'テスト事業者',
    address: '港区赤坂',
    description: `自己紹介テスト1234567
あいうえおかきくけこ
さしすせそたちつてと
なにぬねのはひふへほ
まみむめもやいゆえよ
らりるれろわをん、。
`, // 70 letters
    image: `${__dirname}/../../../../smooosy/src/static/images/icon-xhdpi.png`,
  }

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
  context.page.waitForWithTimeout = (selector, timeout) => new Promise((resolve, reject) => {
    setTimeout(reject, timeout)
    context.page.waitFor(selector).then(resolve).catch(reject)
  })
  context.testService = '結婚式の写真撮影'
})

test.after('cleanup', async () => {
  await context.browser.close()
})

test.serial('プロ（未登録ユーザー）', async t => {
  await signup('wedding-photographers', context.username).catch(err => t.fail(err.message))
  await context.page.waitForWithTimeout(sel('goToSetup'), 5000).catch(timeoutError)
  await context.page.click(sel('goToSetup'))
  await setup('wedding-photographers', context.username).catch(err => t.fail(err.message))
  await context.page.waitFor(3000)
  t.pass()
})

async function signup() {
  const { page, user, profile, origin, testService } = context

  await page.goto(`${origin}/pro`)

  // サービス検索
  await page.waitForWithTimeout(sel('search'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.type(sel('search'), testService)
  await page.waitForWithTimeout(sel('suggests'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('suggest_0'))
  await page.click(sel('LPButton'))

  // SignupAsPro: User 設定
  await page.waitForWithTimeout(sel('userSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.type(sel('profileNameInput'), profile.name)
  await page.type(sel('lastnameInput'), user.lastname)
  await page.type(sel('phoneInput'), user.phone)
  await page.type(sel('emailInput'), user.email)
  await page.type(sel('passwordInput'), user.password)
  await page.click(sel('userSubmitButton'))

  // SignupAsPro: SMOOOSYの仕組み
  await page.waitForWithTimeout(sel('flowPageSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('flowPageSubmitButton'))

  // SignupAsPro: サービス設定
  await page.waitForWithTimeout(sel('serviceSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click('input[type=checkbox]')  // TODO: remove after fix bug of SignupAsProPage
  await page.click('input[type=checkbox]')  // TODO: remove after fix bug of SignupAsProPage
  await page.click(sel('serviceSubmitButton'))

  // SignupAsPro: Location 設定
  await page.waitForWithTimeout(sel('locationSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('googleMapInput'))
  await page.type(sel('googleMapInput'), profile.address, { delay: 100 })
  await page.waitFor(3000)
  await page.click(sel('locationSubmitButton'))
}

async function setup() {
  const { page, profile } = context

  // Setup: クッションページ
  await page.waitForWithTimeout(sel('profileSetupFlowSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await context.page.click(sel('profileSetupFlowSubmitButton'))
  await page.waitForWithTimeout(sel('profileQuizSubitButtonA'), DEFAULT_TIMEOUT).catch(timeoutError)
  await context.page.click(sel('profileQuizSubitButtonA'))
  await page.waitForWithTimeout(sel('profileAnswerSubitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await context.page.click(sel('profileAnswerSubitButton'))

  // Setup: 自己紹介
  await page.waitForWithTimeout(sel('profileDescriptionSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.type(sel('profileDescriptionTextArea'), profile.description)
  await page.click(sel('profileDescriptionSubmitButton'))

  // Setup: アイコン設定
  await page.waitForWithTimeout(sel('avatarCropperFileHandler'), DEFAULT_TIMEOUT).catch(timeoutError)
  const fileHandler = await page.$(sel('avatarCropperFileHandler'))
  await fileHandler.uploadFile(profile.image)
  await page.waitForWithTimeout(sel('avatarCropperButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('avatarCropperButton'))
  await page.waitFor(1000)
  await page.waitForWithTimeout(sel('avatarSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('avatarSubmitButton'))

  // Setup: クチコミ
  await page.waitForWithTimeout(sel('reviewSkipButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('reviewSkipButton'))

  // Setup: 完了
  await page.waitForWithTimeout(sel('finishSubmitButton'), DEFAULT_TIMEOUT).catch(timeoutError)
  await page.click(sel('finishSubmitButton'))

}
