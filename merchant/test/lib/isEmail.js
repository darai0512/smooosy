const test = require('ava')
const { isEmail } = require('@smooosy/config')

test('isEmail function', t => {
  const emails = {
    valid: [
      'foo@bar.com',
      'x@x.au',
      'foo@bar.com.au',
      'foo+bar@bar.com',
      'hans@m端ller.com',
      'test|123@m端ller.com',
      'test+ext@gmail.com',
      'some.dot.exists@gmail.com',
      'some.name.midd.leNa.me.+extension@GoogleMail.com',
      'continuity...dots...dots...@gmail.com',
      '"foobar"@example.com',
      '"foo\\@bar"@example.com',
    ],
    invalid: [
      'invalidemail@',
      'hans.m端ller@test.com',
      'invalid.com',
      '@invalid.com',
      'foo@bar.com.',
      'somename@ｇｍａｉｌ.com',
      'foo@bar.co.uk.',
      'z@co.c',
      'ｇｍａｉｌｇｍａｉｌｇｍａｉｌｇｍａｉｌｇｍａｉｌ@gmail.com',
      'test1@invalid.co m',
      'test2@invalid.co m',
      'test3@invalid.co m',
      'test4@invalid.co m',
      'test5@invalid.co m',
      'test6@invalid.co m',
      'test7@invalid.co m',
      'test8@invalid.co m',
      'test9@invalid.co m',
      'test10@invalid.co m',
      'test11@invalid.co m',
      'test12@invalid.co　m',
      'test13@invalid.co　m',
      '"  foo  m端ller "@example.com',
    ],
  }
  emails.valid.forEach(mail => t.is(isEmail(mail), true))
  emails.invalid.forEach(mail => t.is(isEmail(mail), false))
})
