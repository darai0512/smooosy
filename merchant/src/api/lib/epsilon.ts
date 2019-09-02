export {}
const qs = require('qs')
const axios = require('axios')
const xml2js = require('xml2js')
const config = require('config')
const { ObjectID } = require('mongodb')
const { shiftjis2utf8 } = require('./util')
const { payment } = require('@smooosy/config')

module.exports = {
  orderNetbank,
  orderConveni,
  getOrderInfo,
  post,
  parseXML,
  filterConveniResponse,
  validateNetbank,
  validateConveni,
  validatePhone,
}

function orderNetbank({user, givenPoint, priceInt, netbank, path}) {
  return post('/receive_order3.cgi', {
    user_id: user.id,
    user_name: `${user.lastname}${user.firstname ? ` ${user.firstname}`: ''}`,
    user_mail_add: user.email,
    item_code: `${givenPoint}PT${priceInt}YEN`,
    item_name: `SMOOOSYポイント ${givenPoint}pt`,
    order_number: new ObjectID().toString(),
    st_code: config.get('payment.epsilon.st_codes')[netbank],
    mission_code: 1,
    item_price: priceInt,
    process_code: 1,
    memo1: givenPoint, // 入金後このポイントを付与する
    memo2: path, // 入金後このpathにリダイレクトする
    xml: 1,
    character_code: 'UTF8',
  })
}


function orderConveni({user, givenPoint, priceInt, conveni, phone}) {
  return post('/receive_order3.cgi', {
    user_id: user.id,
    user_name: `${user.lastname}${user.firstname ? ` ${user.firstname}`: ''}`,
    user_mail_add: user.email,
    item_code: `${givenPoint}PT${priceInt}YEN`,
    item_name: `SMOOOSYポイント ${givenPoint}pt`,
    order_number: new ObjectID().toString(),
    st_code: config.get('payment.epsilon.st_codes.conveni'),
    mission_code: 1,
    item_price: priceInt,
    process_code: 1,
    memo1: givenPoint, // 入金後このポイントを付与する
    xml: 1,
    character_code: 'UTF8',
    // コンビニ用のパラメータ
    conveni_code: conveni,
    user_tel: phone,
  })
}

function getOrderInfo(body) {
  return post('/getsales2.cgi', body)
}

async function post(path, data) {
  const xml = await axios.post(`${config.get('payment.epsilon.apiBase')}${path}`, qs.stringify({
    version: 1,
    charset: 'UTF8',
    contract_code: payment.epsilon.contractCode,
    ...data,
  })).then(res => res.data)

  return await parseXML(xml)
}

async function parseXML(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, data) => {
      if (err) {
        console.error('XML PARSE ERROR: ' + err.message)
        reject(err)
      } else {
        const obj = {}
        if (!data.Epsilon_result || !data.Epsilon_result.result) {
          reject(new Error('Invalid response data'))
        }
        for (const result of data.Epsilon_result.result) {
          for (const key in result.$) {
            obj[key] = shiftjis2utf8(unescape(result.$[key].replace(/\+/g, '%20')))
          }
        }
        resolve(obj)
      }
    })
  })
}

function filterConveniResponse(res) {
  return {
    receipt_no: res.receipt_no,
    conveni_code: res.conveni_code,
    item_price: parseInt(res.item_price, 10),
    kigyou_code: res.kigyou_code,
    conveni_limit: res.conveni_limit,
    conveni_time: res.conveni_time,
  }
}

function validateNetbank(netbank) {
  return Object.keys(payment.netbankTypes).includes(netbank)
}

function validateConveni(conveni) {
  return Object.keys(payment.conveniTypes).includes(conveni)
}

function validatePhone({conveni, phone}) {
  return !payment.conveniTypes[conveni].phoneRequired || /^[0-9]{10,11}$/.test(phone)
}
