import React from 'react'
import { storiesOf } from '@storybook/react'
import { MemoryRouter } from 'react-router'
import PickupProfiles from 'components/PickupProfiles'

storiesOf('PickupProfiles', module)
  .addDecorator(story => (
    <MemoryRouter>{story()}</MemoryRouter>
  ))
  .add('○選プロフィール', () => {
    const profiles = [{
      id: '5c4fd4608262a01a89b78b08',
      shortId: 'XE_UYIJioBqJt4sI',
      name: 'テスト事業者',
      address: '東京都港区赤坂',
      description: '自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。',
      reviewCount: 1,
      averageRating: 4,
      pro: {
        imageUpdatedAt: '2019-01-29T04:21:38.493Z',
        image: 'https://picsum.photos/80/80/?random',
      },
      reviews: [{
        username: 'テスト依頼者',
        text: 'レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。レビューが入ります。',
        rating: 4,
      }],
    }]
    const leads = [{
      id: '5c4fd4608262a01a89b78b09',
      name: 'あんかけ事業者',
      address: '東京都渋谷区神宮前',
      description: '自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。自己紹介が入ります。',
    }]

    return (
      <PickupProfiles
        profiles={profiles}
        leads={leads}
        buttonProps={() => {}}
        />
    )
  })
