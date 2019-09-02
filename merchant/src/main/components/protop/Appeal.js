import React from 'react'
import { withStyles } from '@material-ui/core'
import Mechanism from 'components/protop/Mechanism'

const Appeal = withStyles((theme) => ({
  root: {
    paddingTop: 48,
    paddingBottom: 96,
    background: '#F9FCF4',
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 48,
    },
  },
  contents: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  appeal: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 43,
    marginRight: 43,
    marginBottom: 32,
  },
  circle: {
    width: 156,
    height: 156,
    borderRadius: '100%',
    position: 'relative',
    backgroundColor: '#F9FCF4',
    marginBottom: 16,
  },
  hello: {
    position: 'absolute',
    width: 100,
    height: 100,
    left: 'calc(50% - 50px)',
    top: 'calc(50% - 50px)',
  },
  money: {
    position: 'absolute',
    width: 60,
    height: 55.19,
    left: 'calc(50% - 30px)',
    top: 'calc(50% - 27.595px)',
  },
  handshake: {
    position: 'absolute',
    width: 78.27,
    height: 68.27,
    left: 'calc(50% - 39.135px)',
    top: 'calc(50% - 34.135px)',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: '27px',
  },
}))(({classes}) => (
  <section className={classes.root}>
    <Balloon />
    <div className={classes.contents}>
      <div className={classes.appeal}>
        <div className={classes.circle}>
          <img src={`/images/handshake.png`} className={classes.hello} />
        </div>
        <div className={classes.text}>
          <span>お店近くの見込み客に募集するから</span>
          <span>成約率が高い。</span>
        </div>
      </div>
      <div className={classes.appeal}>
        <div className={classes.circle}>
          <img src={`/images/money.png`} className={classes.money} />
        </div>
        <div className={classes.text}>
          <span>SMOOOSYが決済を代行、</span>
          <span>キャンセルされても料金を取れます。</span>
        </div>
      </div>
    </div>
    <Mechanism />
  </section>
))

const Balloon = withStyles((theme) => ({
  balloon: {
    position: 'relative',
  },
  triangle: {
    top: 52,
    left: 'calc(50% - 14px)',
    width: 0,
    height: 0,
    margin: '0 auto',
    position: 'absolute',
    borderStyle: 'solid',
    borderWidth: '14px 14px 0px 14px',
    borderColor: '#438A42 transparent transparent transparent',
  },
  message: {
    padding: 20,
    textAlign: 'center',
    backgroundColor: '#438A42',
    color: theme.palette.common.white,
    width: 200,
    borderRadius: 40,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: '100%',
    margin: '0 auto',
  },
}))(({classes}) => (
  <div className={classes.balloon}>
    <div className={classes.triangle} />
    <div className={classes.message}>
      SMOOOSYなら...
    </div>
  </div>
))

export default Appeal
