const test = require('ava')
const epsilonResponse = require('../helpers/epsilonResponse')
const epsilon = require('../../../src/api/lib/epsilon')

test('parse epsilon normal response', async t => {
  const response = await epsilon.parseXML(epsilonResponse.order.conveni)
  t.is(response.result, '1')
  t.is(response.trans_code, '711561')
  t.is(response.user_id, '58ccc7a7e94aa8b63054ffac')
  t.is(response.user_name, '柄澤 史也')
  t.is(response.item_price, '2916')
  t.is(response.memo1, '20')
  t.is(response.item_name, 'SMOOOSYポイント 20pt')
  t.is(response.payment_code, '3')
  t.is(response.receipt_no, '004538')
})

test('parse epsilon error response', async t => {
  const response = await epsilon.parseXML(epsilonResponse.order.error)
  t.is(response.result, '9')
  t.is(response.trans_code, '')
  t.is(response.err_code, '908')
  t.is(response.err_detail, 'このCGIを実行する権限がありません')
})

test('不適切なxmlは例外処理', async t => {
  await t.throwsAsync(async () => {
    await epsilon.parseXML('')
  }, {message: 'Cannot read property \'Epsilon_result\' of null'})

  await t.throwsAsync(async () => {
    await epsilon.parseXML('<xml></xxx>')
  }, {message: /Unexpected close tag/})
})

test('filterConveniResponse filter correct fields', t => {
  const response = {
    receipt_no: 'a',
    conveni_code: 'b',
    item_price: 'c',
    kigyou_code: 'c',
    conveni_limit: 'd',
    customField: 'free comment',
  }
  const filtered = epsilon.filterConveniResponse(response)

  t.true('conveni_code' in filtered)
  t.true('item_price' in filtered)
  t.true('kigyou_code' in filtered)
  t.true('conveni_limit' in filtered)
  t.false('customField' in filtered)
  t.false('notExists' in filtered)
})

test('validateNetbank', t => {
  t.true(epsilon.validateNetbank('rakuten'))
  t.true(epsilon.validateNetbank('jnb'))
  t.true(epsilon.validateNetbank('payeasy'))
  t.false(epsilon.validateNetbank('sbi'))
})

test('validateConveni', t => {
  t.true(epsilon.validateConveni('21'))
  t.true(epsilon.validateConveni('31'))
  t.true(epsilon.validateConveni('32'))
  t.true(epsilon.validateConveni('33'))
  t.false(epsilon.validateConveni('20'))
  t.false(epsilon.validateConveni('34'))
})

test('validatePhone', t => {
  t.true(epsilon.validatePhone({conveni: '21'}))
  t.true(epsilon.validatePhone({conveni: '31', phone: '0312345678'}))
  t.false(epsilon.validatePhone({conveni: '31', phone: '(03)12345678'}))
  t.false(epsilon.validatePhone({conveni: '31', phone: '03-1234-5678'}))
})
