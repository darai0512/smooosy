import React from 'react'
import { Button, CircularProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import QueryCardClose from 'components/cards/QueryCardClose'
import UserAvatar from 'components/UserAvatar'
import { FlowTypes } from '@smooosy/config'

let QueryCardHello = ({ flowType, service, profile, count, onClose, classes, next, prev, loading }) => (
  <div className={classes.root}>
    <QueryCardClose onClose={onClose} className={classes.close} />
    <div className={classes.main}>
      <img alt='SMOOOSYロゴ' src='/images/logo-white-transparent.png' className={classes.logo} />
      {loading ?
        <div className={classes.loading}>
          <CircularProgress size={80} color='secondary' />
        </div>
      : profile ?
        <div className={classes.specialSent}>
          <UserAvatar user={profile.pro} alt={profile.name} className={classes.avatar} />
          <p className={classes.profile}>{profile.name}</p>
          <p>と周辺の{service.providerName}に相談しましょう</p>
        </div>
      :
        <div className={classes.near}>
          {count ? `周辺に${count}人の${service.providerName}がいます` : `お近くの${service.providerName}をお探しします`}
        </div>
      }
      {!loading &&
        <div className={classes.text}>
          {flowType === FlowTypes.PPC ?
            <div>
              <p>このプロに連絡するために</p>
              <p>もう少し依頼情報を入力しましょう</p>
            </div>
            :
            `${service.name}に関するいくつかの質問にお答えください！`
          }
        </div>
      }
    </div>
    {!loading &&
      <div className={classes.buttons}>
        {prev && <Button className={classes.buttonPrev} onClick={prev}>戻る</Button>}
        <Button variant='contained' className={`nextQuery hello ${classes.buttonNext}`} onClick={next}>次へ</Button>
      </div>
    }
  </div>
)


export default withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: theme.palette.secondary.main,
    color: theme.palette.common.white,
    padding: 16,
    height: 600,
    [theme.breakpoints.down('xs')]: {
      padding: 12,
      height: '100%',
    },
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 70,
    margin: 16,
  },
  loading: {
    padding: '56px 0 100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  near: {
    width: '100%',
    textAlign: 'center',
    padding: 16,
    fontSize: 28,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      padding: 8,
      fontSize: 22,
    },
  },
  text: {
    width: '100%',
    textAlign: 'center',
    padding: 16,
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      padding: 8,
      fontSize: 18,
    },
  },
  specialSent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 10,
    fontSize: 14,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonPrev: {
    height: 50,
    flex: 1,
    margin: '0 8px',
    color: theme.palette.common.white,
  },
  buttonNext: {
    height: 50,
    flex: 1,
    maxWidth: '70%',
    margin: '0 8px',
    color: theme.palette.common.black,
    fontSize: 20,
    fontWeight: 'bold',
    background: theme.palette.common.white,
  },
  avatar: {
    width: 60,
    height: 60,
    border: `2px solid ${theme.palette.common.white}`,
  },
  profile: {
    fontSize: 18,
  },
  close: {
    color: 'rgba(255, 255, 255, .3)',
  },
}))(QueryCardHello)

