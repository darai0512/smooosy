import React from 'react'
import Avatar from '@material-ui/core/Avatar'
import { withStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import GAEventTracker from 'components/GAEventTracker'

const MediaPro = ({ currentPath, src, label, desc, size, gaEvent, hideButton, buttonProps, profileId, classes }) => {
  return (
    <section>
      <form className={classes.root} action={currentPath} method='get' onSubmit={e => e.preventDefault()} target='_top'>
        <Avatar classes={{root: classes.img}} src={src} imgProps={{ width: size, height: size }} style={{width: size, height: size}} />
        <div className={classes.rect}>
          <p className={classes.title}>{label}</p>
          <div className={classes.desc}>{desc}</div>
          {!hideButton &&
            <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label}>
              <Button variant='contained' color='primary' type='submit' className={['zipButton', classes.zipButton].join(' ')} {...buttonProps(profileId)}>
                SMOOOSYでプロを探す
              </Button>
            </GAEventTracker>
          }
        </div>
      </form>
    </section>
  )
}

export default withStyles(() => ({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  img: {
    marginRight: 10,
  },
  rect: {
    flex: 1,
    background: '#f3f3f3',
    padding: 16,
    borderRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  desc: {
    marginTop: 10,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontSize: 18,
  },
  zipButton: {
    marginTop: 20,
    fontSize: 18,
  },
}))(MediaPro)
