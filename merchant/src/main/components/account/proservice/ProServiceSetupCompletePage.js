import React from 'react'
import { withStyles } from '@material-ui/core'
import CheckIcon from '@material-ui/icons/Check'

import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice/ProServiceProgress'
import { imageOrigin } from '@smooosy/config'

const ProServiceSetupCompletePage = (props) => {
  const { location: { pathname }, match: { params: { id } }, history, classes } = props

  const submit = (e) => {
    e.preventDefault()
    history.push(`/account/services${id ? `/${id}` : ''}`)
  }

  return (
    <form onSubmit={submit} className={classes.root}>
      <ProServiceContainer stepper={<ProServiceProgress pathname={pathname} />} submitLabel='完了'>
        <div className={classes.container}>
          <div className={classes.contentImage}>
            <img className={classes.contentImageIcon} src={`${imageOrigin}/static/pros/badge_bordered.png`} />
          </div>
          <CheckIcon className={classes.checkIcon} />
          <h3>ご指名方式の設定が完了しました!</h3>
          <div>依頼一覧をよくチェックして依頼者といち早く連絡を取りましょう。</div>
        </div>
      </ProServiceContainer>
    </form>
  )
}

export default withStyles(theme => ({
  root: {
    height: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentImage: {
    backgroundImage: `url(${imageOrigin}/static/pros/dialog_background1.png)`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    display: 'flex',
    justifyContent: 'center',
  },
  contentImageIcon: {
    height: 320,
    [theme.breakpoints.down('xs')]: {
      height: 240,
    },
  },
  checkIcon: {
    width: 80,
    height: 80,
    margin: '50px 0 10px',
    color: theme.palette.secondary.main,
  },
}))(ProServiceSetupCompletePage)
