import React from 'react'
import { storiesOf } from '@storybook/react'
import { text } from '@storybook/addon-knobs'
import { MemoryRouter } from 'react-router'
import PickupProAnswer from 'components/PickupProAnswer'

storiesOf('PickupProAnswer', module)
  .addDecorator(story => (
    <MemoryRouter>{story()}</MemoryRouter>
  ))
  .add('よくある質問', () => {
    const proQuestions = [
      {
        id: '5b0cbbc5a45d0816618f10ca',
        text: '結婚式のカメラマンを選ぶ上で、候補の方に確認しておいた方がいいことは何ですか？',
        answers: [],
      },
    ]

    for (let i = 0; i < 3; i++) {
      proQuestions[0].answers.push({
        id: '588357fb6a94bc0d69b6a2ca',
        text: `回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。回答${i}が入ります。`,
        pro: {
          id: '5caff92202ca9e93e6c51367',
          shortId: 'XK_5IgLKnpPmxRNn',
          image: text(`image${i}`, `https://picsum.photos/300/300/?random${i}`),
          imageUpdatedAt: '2018-07-10T08:08:40.697Z',
          intercomHash: null,
        },
        profile: {
          id: '5b0ea67bea260a0773358050',
          shortId: 'Ww6me-omCgdzNYBQ',
          name: `テスト事業者${i}`,
          prefecture: '東京都',
          city: '港区',
        },
      })
    }

    return (
      <PickupProAnswer
        proQuestions={proQuestions}
        className={{root: ''}}
      />
    )
  })
