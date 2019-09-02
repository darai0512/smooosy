import React from 'react'
import { Paper, LinearProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'

const FindingPro = ({ service, classes }) => (
  <div className={`submitting ${classes.root}`}>
    <img alt='SMOOOSYロゴ' src='/images/logo-white-transparent.png' className={classes.logo} />
    <div className={classes.header}>
      あなたにぴったりの{service.providerName}を探しています。しばらくお待ちください。
    </div>
    <div className={classes.papers}>
      {
        [...Array(3)].map((_, i) => (
          <Paper key={i} className={classes.paper}>
            <UserAvatar user={{_id: '4'}} />
            <div className={classes.rating}>
              <div className={classes.stars}>
                <RatingStar />
              </div>
              <div className={classes.border} />
              <div className={`${classes.border} ${classes.borderWidth}`} />
            </div>
            <div className={classes.flex} />
            <p className={classes.en}>¥</p>
          </Paper>
        ))
      }
    </div>
    <LinearProgress color='secondary' className={classes.loading} />
  </div>
)

export default withStyles(theme => ({
  root: {
    background: theme.palette.secondary.main,
    color: theme.palette.common.white,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  logo: {
    width: 280,
    height: 70,
    margin: 16,
  },
  header: {
    width: '100%',
    padding: 16,
    fontSize: 28,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      padding: 0,
      fontSize: 24,
    },
  },
  papers: {
    margin: '20px -400px',
    display: 'flex',
    justifyContent: 'center',
    overflowX: 'hidden',
  },
  paper: {
    width: 220,
    margin: 10,
    padding: 20,
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 10,
  },
  stars: {
    width: 65,
  },
  border: {
    background: theme.palette.grey[500],
    margin: 5,
    height: 5,
  },
  borderWidth: {
    width: '50%',
  },
  flex: {
    flex: 1,
  },
  en: {
    fontSize: 30,
    color: theme.palette.grey[500],
  },
  loading: {
    width: '100%',
    margin: '30px 0',
  },
}))(FindingPro)
