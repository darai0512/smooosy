import test from 'ava'
import { sortReviews, getBestReview } from '../../../src/api/lib/review'

const testData = [{
  rating: 0,
  text: 'aaa',
  username: 'name',
  service: 'service1',
  profile: 'xxxxx',
  details: [],
  id: 0,
}, {
  rating: 2,
  text: 'aaa',
  username: 'name',
  service: 'service1',
  profile: 'xxxxx',
  details: [],
  id: 1,
}, {
  rating: 2,
  text: 'aaaaaaaaa',
  username: 'name',
  service: 'service1',
  profile: 'xxxxx',
  details: [],
  id: 2,
}, {
  rating: 2,
  text: 'aaaaaaaaa',
  username: 'name',
  service: 'service2',
  profile: 'xxxxx',
  details: [],
  id: 3,
}, {
  rating: 2,
  text: 'aaaaaaaaaaaaaaaaaa',
  username: 'name',
  service: 'service2',
  profile: 'xxxxx',
  details: [],
  id: 5,
}, {
  rating: 2,
  text: 'aaaaaaaaaaaaaaaaaa',
  username: 'name',
  service: null,
  profile: 'xxxxx',
  details: [],
  id: 6,
}]


test('highest rating review is the best', async t => {
  const reviews= [{
    rating: 0,
    text: 'aaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 0,
  }, {
    rating: 1,
    text: 'aaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 1,
  }, {
    rating: 2,
    text: 'aaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 2,
  }]
  const sorted = sortReviews(reviews)
  t.deepEqual(sorted.map(r => r.id), [2, 1, 0])
})

test('longer text is better when there are some reviews having same rating', async t => {
  const reviews = [{
    rating: 0,
    text: 'aaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 0,
  }, {
    rating: 2,
    text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 1,
  }, {
    rating: 2,
    text: 'aaaaaa',
    username: 'name',
    profile: 'xxxxx',
    details: [],
    id: 2,
  }]
  const sorted = sortReviews(reviews)
  t.deepEqual(sorted.map(r => r.id), [1, 2, 0])
})

test('return best review', t => {
  const best = getBestReview(testData)
  t.is(best.id, 5)
})

test('return null when there is no review in same service', t => {
  const best = getBestReview(testData, {service: 'service3'})
  t.is(best, null)
})

test('get best review in same service', t => {
  const best = getBestReview(testData, {service: 'service1'})
  t.is(best.id, 2)
})

test('return best review in other service when there is no review in same service', t => {
  const reviews = [{
    rating: 0,
    text: 'aaa',
    username: 'name',
    service: 'service1',
    profile: 'xxxxx',
    details: [],
    id: 0,
  }, {
    rating: 2,
    text: 'aaaaaaa',
    username: 'name',
    profile: 'xxxxx',
    service: 'service1',
    details: [],
    id: 1,
  }, {
    rating: 2,
    text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    username: 'name',
    service: 'service1',
    profile: 'xxxxx',
    details: [],
    id: 2,
  }]
  const best = getBestReview(reviews, {service: 'service2', includeOtherService: true})
  t.is(best.id, 2)
})
