const test = require('ava')
const youtube = require('../../src/lib/youtube')

test('youtube video id parser', t => {
  t.is(
    youtube.parseVideoId('https://www.youtube.com/watch?v=iN8zmmCRqUA'),
    'iN8zmmCRqUA',
  )
  t.is(
    youtube.parseVideoId('https://www.youtube.com/watch?v=iN8zmmCRqUA&t=91'),
    'iN8zmmCRqUA',
  )
  t.is(
    youtube.parseVideoId('https://youtu.be/iN8zmmCRqUA?t=97'),
    'iN8zmmCRqUA',
  )
  t.is(
    youtube.parseVideoId('https://youtu.be/iN8zmmCRqUA'),
    'iN8zmmCRqUA',
  )
})