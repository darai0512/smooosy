import React from 'react'
import withWidth from '@material-ui/core/withWidth'

import { line } from '@smooosy/config'

function LineFriendLink({width}) {
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      {width === 'xs' ?
        <a href={line.friendLink} target='_blank' rel='noopener noreferrer' style={{marginTop: 8}}>
          <img style={{border: 0, height: 36}} alt='友だち追加' src='https://scdn.line-apps.com/n/line_add_friends/btn/ja.png' />
        </a>
      : [
        <img key='howto' alt='LINE友だち追加画面' src='/images/line-step-1.jpg' style={{width: 188, height: 165}} />,
        <img key='qr' alt='友だち追加QR' style={{marginLeft: 20, width: 180, height: 180}} src={line.friendQR} />,
      ]}
    </div>
  )
}

export default withWidth()(LineFriendLink)
