import React from 'react'
import { storiesOf } from '@storybook/react'
import { text } from '@storybook/addon-knobs'
import HireDialog from 'components/HireDialog'

storiesOf('HireDialog', module)
  .add('成約ダイアログを開く', () => {
    const image = text('image', 'https://picsum.photos/300/300/?random')
    return <HireDialog open={true} image={image} onClose={() => {}} onSubmit={() => {}} />
  })
