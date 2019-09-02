import React from 'react'
import { withStyles } from '@material-ui/core'
import { imageOrigin } from '@smooosy/config'

const Issue = withStyles((theme) => ({
  container: {
    background: '#1A237E',
    padding: '48px 0',
    [theme.breakpoints.down('xs')]: {
      padding: '40px 0 48px 0',
    },
  },
  title: {
    color: theme.palette.common.white,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 49,
  },
  taglines: {
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },
  tagline: {
    color: theme.palette.common.white,
    marginBottom: 27,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      alignItems: 'flex-start',
    },
  },
  check: {
    width: 24,
    height: 24,
  },
  text: {
    display: 'flex',
    alignItems: 'flex-end',
    marginLeft: 19.5,
    lineHeight: 'normal',
    [theme.breakpoints.down('xs')]: {
      display: 'inline-block',
      lineHeight: '150%',
    },
  },
  em: {
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: '21px',
    marginRight: 4,
  },
  phrase: {
    fontSize: 16,
    lineHeight: '19px',
  },
}))(({classes}) => (
  <section className={classes.container} >
    <h2 className={classes.title}>こんなお悩みありませんか？</h2>
    <div className={classes.taglines}>
      <div>
        <div className={classes.tagline}>
          <img src={`images/check.png`} className={classes.check} />
          <span className={classes.text}>
            <span className={classes.em}>ドタキャン</span>
            <span className={classes.phrase}>で人件費が無駄に......</span>
          </span>
        </div>
        <div className={classes.tagline}>
          <img src={`images/check.png`} className={classes.check} />
          <span className={classes.text}>
            <span className={classes.em}>事前決済</span>
            <span className={classes.phrase}>してないから、キャンセル料が取れない</span>
          </span>
        </div>
      </div>
    </div>
  </section>
))

export default Issue
