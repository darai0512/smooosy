import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import { withAMP } from 'contexts/amp'
import FacebookButton from './FacebookButton'
import FacebookShareButton from './FacebookShareButton'
import TwitterButton from './TwitterButton'
import HatenaButton from './HatenaButton'

export {
  FacebookButton,
  FacebookShareButton,
  TwitterButton,
  HatenaButton,
}

let SocialButtons = (props) => {
  const { size, classes, isAMP } = props
  return (
    <aside className={classes.root}>
      <div className={classes.buttons}><FacebookButton share={false} size={size || 'small'} isAMP={isAMP} /></div>
      <div className={classes.buttons}><TwitterButton size={size || 'small'} isAMP={isAMP} /></div>
      <div className={classes.buttons}><HatenaButton size={size || 'small'} isAMP={isAMP} /></div>
    </aside>
  )
}

SocialButtons = withAMP(SocialButtons)

SocialButtons = withStyles(() => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  buttons: {
    margin: '0 5px',
  },
}))(SocialButtons)

export default SocialButtons
