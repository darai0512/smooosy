export {}
const supertest = require('supertest')
const server = require('../../../src/api/server')
const test = require('ava')
const uuidv4 = require('uuid/v4')
const { findExistingUserByEmail, getUserByEmail } = require('../../../src/api/routes/users')
const { CSTask, User } = require('../../../src/api/models')
const { generateServiceUserProfile, postProcess } = require('../helpers/testutil')

test.after.always(async () => {
  await postProcess()
})

test('一致するメールがある場合findExistingUserByEmailが存在する', async t => {
  await User.create({
    email: 'test@smooosy.com',
    lastname: 'lastname',
    bounce: true,
  })

  t.false(!!await findExistingUserByEmail('no@smooosy.com'))
  t.true(!!await findExistingUserByEmail('test@smooosy.com'))
})

test('ドット無視して一致するGmailがある場合findExistingUserByEmailが存在する', async t => {
  await User.create({
    email: 'krsw.f.m.y@gmail.com',
    lastname: 'lastname',
    bounce: true,
  })

  t.true(!!await findExistingUserByEmail('krswfmy@gmail.com'))
  t.true(!!await findExistingUserByEmail('krsw.fmy@gmail.com'))
})

test('本人確認書類をアップロードするとCSタスクが作成される', async t => {
  await generateServiceUserProfile(t)
  const user = t.context.user

  const token = user.token
  const body = {
    identification: {
      status: 'pending',
    },
  }
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${token}`)
    .send(body)
    .expect(200)

  const count = await CSTask.countDocuments({user: user.id, type: 'identification'})
  t.is(count, 1)
})

test('退会申請するとCSタスクが作成される', async t => {
  await generateServiceUserProfile(t)
  const user = t.context.user

  const token = user.token
  const body = {
    requestDeactivate: new Date,
    deactivateReason: 'hoge',
  }
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${token}`)
    .send(body)
    .expect(200)

  const count = await CSTask.countDocuments({user: user.id, type: 'deactivate'})
  t.is(count, 1)
})

test('ユーザー登録が小文字でされる', async t => {
  const uuid = uuidv4()
  const userData = {
    lastname: `user_${uuid}`,
    email: `TEST_${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)
  const user = await User.findOne({email: userData.email.toLowerCase()})
  t.not(user, null)
})

test('小文字にして同じメールアドレスは登録エラー', async t => {
  const uuid = uuidv4()
  const user1 = {
    lastname: `user_${uuid}`,
    email: `Test_${uuid}@smooosy.com`,
    token: `token_${uuid}`,
    bounce: true, // メールを送らない
  }
  await User.create(user1)
  const userData = {
    lastname: `user_${uuid}`,
    email: `TEST_${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  // 被りエラー
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(409)
  t.pass()
})

test('大文字小文字を無視して同じメアドが存在する時、findExistingUserByEmailが存在する', async t => {
  const uuid = uuidv4()
  const user1 = {
    lastname: `user_${uuid}`,
    email: `Test_${uuid}@smooosy.com`,
    token: `token_${uuid}`,
    bounce: true,
  }
  await User.create(user1)
  t.true(!!await findExistingUserByEmail(user1.email.toUpperCase()))
  t.true(!!await findExistingUserByEmail(user1.email.toLowerCase()))
  t.false(!!await findExistingUserByEmail('no@smooosy.com'))
})

test('大文字小文字を無視して同じメアドが存在する時、getUserByEmailがuserを返す', async t => {
  const uuid = uuidv4()
  const user1 = {
    lastname: `user_${uuid}`,
    email: `test_${uuid}@smooosy.com`,
    token: `token_${uuid}`,
    bounce: true,
  }
  await User.create(user1)
  const user = await getUserByEmail(user1.email.toUpperCase())
  t.is(user.email, user1.email)
})

test('ログイン時にメールアドレスの大文字小文字が区別されない', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `TEST_${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)
  // ログインできたら区別されていない
  await supertest(server)
    .post('/api/login')
    .send({email: userData.email, password: userData.password})
    .expect(200)
  t.pass()
})

test('getUserByEmailの正規表現が他のユーザーとマッチしない', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `Test_${uuid}@smooosy.com`,
    token: `token_${uuid}`,
    bounce: true,
  }
  await User.create(userData)
  let user = await getUserByEmail('a' + userData.email)
  t.is(user, null)
  user = await getUserByEmail(userData.email.slice(1))
  t.is(user, null)
})


test('メールアドレスを変更しても同じパスワードでUser.verifyがtrue', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)

  let user = await User.findOne({email: userData.email}).select('token')
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({email: `new_${userData.email}`})
    .expect(200)

  user = await User.findById(user.id)
  t.true(await user.verify(userData.password))
})

test('パスワードを変更した時、新しいパスワードでUser.verifyがtrue', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)
  let user = await User.findOne({email: userData.email}).select('token')
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({newpassword: 'newpassword'})
    .expect(200)
  user = await User.findById(user.id)
  t.true(await user.verify('newpassword'))
})

test('メールアドレスとパスワードを同時に変更した時、新しいメールアドレスとパスワードでログインできる', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)
  const user = await User.findOne({email: userData.email}).select('token')
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({email: `new_${userData.email}`, newpassword: 'newpassword'})
    .expect(200)
  // ログイン
  await supertest(server)
    .post('/api/login')
    .send({email: `new_${userData.email}`, password: 'newpassword'})
    .expect(200)
  t.pass()
})

test('メールアドレス変更で大文字小文字を区別せずに既存のメールアドレスと被る場合409', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)

  const user = await User.findOne({email: userData.email}).select('token')
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({email: userData.email.toUpperCase(), password: userData.password})
    .expect(409)

  t.pass()
})

test('メールアドレス・パスワード変更で大文字小文字を区別せずに既存のメールアドレスと被る場合409', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)

  const user = await User.findOne({email: userData.email}).select('token')
  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({email: userData.email.toUpperCase(), newpassword: 'newpassword'})
    .expect(409)

  t.pass()
})

test('ログインした時passwordがidベースでない場合書き換える', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)

  // emailベースに書き換え
  let user = await User.findOne({email: userData.email}).select('token password')
  const password = User.cipher(userData.password, userData.email)
  user = await User.findByIdAndUpdate(user.id, {$set: {password}}).select('password')
  t.true(user.password === User.cipher(userData.password, userData.email))

  await supertest(server)
    .post('/api/login')
    .send({email: userData.email, password: userData.password})
    .expect(200)

  user = await User.findById(user.id).select('password')
  t.true(user.password !== User.cipher(userData.password, userData.email))
  t.true(user.password === User.cipher(userData.password, user.id))
})

test('passwordがidベースの場合、isIdBaseがtrue', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `test${uuid}@smooosy.com`,
    password: `pass_${uuid}`,
  }
  await supertest(server)
    .post('/api/signup')
    .send(userData)
    .expect(200)

  let user = await User.findOne({email: userData.email}).select('isIdBase')
  t.true(user.isIdBase)

  const password = User.cipher(userData.password, userData.email)
  user = await User.findByIdAndUpdate(user.id, {$set: {password}, $unset: {isIdBase: true}}).select('isIdBase')

  t.falsy(user.isIdBase)

  await supertest(server)
    .post('/api/login')
    .send({email: userData.email, password: userData.password})
    .expect(200)

  user = await User.findById(user.id).select('isIdBase')
  t.true(user.isIdBase)
})

test('空の画像をアップロード', async t => {
  const uuid = uuidv4()
  const userData =  {
    lastname: `user_${uuid}`,
    email: `Test_${uuid}@smooosy.com`,
    token: `token_${uuid}`,
    bounce: true,
  }
  let user = await User.create(userData)

  await supertest(server)
    .put('/api/users/@me')
    .set('Authorization', `Bearer ${user.token}`)
    .send({identification: { image: [ null, 'id/123.jpg' ] } })
    .expect(200)

  user = await User.findById(user.id)
  t.is(user.identification.image.length, 1)
})
