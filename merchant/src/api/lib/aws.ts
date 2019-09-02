export {}
const util = require('util')
const moment = require('moment')
const config = require('config')
const AWS = require('aws-sdk')
AWS.config.setPromisesDependency()
AWS.config.update({region: 'ap-northeast-1'})

if (['production', 'dev'].indexOf(process.env.NODE_ENV) === -1) {
  AWS.config.update(config.get('aws'))
}

const isTest = process.env.NODE_ENV === 'test'
if (isTest) {
  const AWSMock = require('aws-sdk-mock')
  AWSMock.setSDKInstance(AWS)
  // AWSのメソッドのスタブを作成する
  AWSMock.mock('S3', 'putObject', '')
  AWSMock.mock('S3', 'deleteObject', '')
  AWSMock.mock('S3', 'getSignedUrl', function(_, params, callback) {
    const { Key, ContentType, Expires } = params
    const date = new Date()
    const url = `${config.get('s3Origin')}/media/${Key}?AWSAccessKeyId=ACCESS&Content-Type=${encodeURIComponent(ContentType)}&Expires=${date.getTime() + Expires}&Signature=L9srRYT681S9oohxlnW1IUn0CwI%3D&x-amz-storage-class=REDUCED_REDUNDANCY`
    callback(null, url)
  })
  AWSMock.mock('CloudFront', 'createInvalidation', '')
}

const SSM = {
  self: new AWS.SSM(),

  getParameter: async (Name) => {
    const data = await SSM.self.getParameter({
      Name,
      WithDecryption: true,
    }).promise()

    return data.Parameter.Value
  },
}

const S3 = {
  self: new AWS.S3(),
  StorageClass: process.env.NODE_ENV === 'production' ? 'STANDARD' : 'REDUCED_REDUNDANCY',

  putObject: async (option) => {
    const { key, body } = option

    await S3.self.putObject({
      Bucket: config.get('bucket'),
      Key: key,
      Body: body,
      StorageClass: S3.StorageClass,
    }).promise()
  },

  deleteObject: async (option) => {
    const { key } = option

    await S3.self.deleteObject({
      Bucket: config.get('bucket'),
      Key: key,
    }).promise()
  },

  getSignedUrl: async (option) => {
    let { key, contentType, method } = option
    contentType = contentType || 'image/jpeg'
    method = method || 'putObject'

    const params: any = {
      Bucket: config.get('bucket'),
      Key: key,
      Expires: 60*60,
    }
    if (method === 'putObject') {
      params.ContentType = contentType
      params.StorageClass = S3.StorageClass
    }

    const getSignedUrl = util.promisify(S3.self.getSignedUrl.bind(S3.self))
    return await getSignedUrl(method, params)
  },
}

const CloudFront = {
  self: new AWS.CloudFront(),
  cacheInvalidation: async path => {
    return await CloudFront.self.createInvalidation({
      DistributionId: config.get('aws.DistributionId'),
      InvalidationBatch: {
        CallerReference: moment().format('YYYYMMDDHHmmss'),
        Paths: {
          Quantity: path.length,
          Items: path,
        },
      },
    }).promise()
  },
}

AWS.config.update({region: 'us-east-1'})
const SES = {
  self: new AWS.SES(),
  sendEmail: (...params) => SES.self.sendEmail(...params),
}

module.exports = {
  SSM,
  S3,
  CloudFront,
  SES,
}
