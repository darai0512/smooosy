import React from 'react'
import { withWidth, withStyles } from '@material-ui/core'

import { FacebookShareButton, TwitterButton } from 'components/SocialButtons'

@withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.grey[50],
    padding: '10px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  title: {
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      marginBottom: 5,
    },
  },
}))
@withWidth()
export default class ShareRequestBar extends React.Component {

  render() {
    const { meet, title, url, text, width, classes } = this.props

    if (!meet || !meet.review) {
      return null
    }
    if (meet.review.rating !== 5) {
      return null
    }

    return (
      <div className={classes.root}>
        <div className={classes.title}>{title}</div>
        <div style={{flex: 1}} />
        <div style={{display: 'flex'}}>
          <div style={{flex: 1}} />
          <div style={{marginLeft: 10}}><FacebookShareButton size={width === 'xs' ? 'small' : 'large'} url={url} /></div>
          <div style={{marginLeft: 10}}><TwitterButton size={width === 'xs' ? 'small' : 'large'} url={url} text={text} /></div>
        </div>
      </div>
    )
  }
}