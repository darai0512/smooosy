import React from 'react'
import { withStyles } from '@material-ui/core/styles'

const ThreeStep = withStyles(theme => ({
  steps: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '16px 0',
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  icon: {
    display: 'block',
    width: 64,
    height: 64,
    [theme.breakpoints.down('xs')]: {
      width: 50,
      height: 50,
    },
  },
  text: {
    fontSize: 14,
    padding: '0px 12px',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      padding: '0px 4px',
    },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontWeight: 'normal',
      fontSize: 16,
    },
  },
  sub: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
}))(
  ({ classes, className }) => {
    return (
      <section className={[classes.steps, className].join(' ')}>
        <div className={classes.step}>
          <img alt='見積もりアイコン' src='/images/ic_flow1.svg' className={classes.icon} width='44' height='44' />
          <div className={classes.text}>
            <h3 className={classes.title}>2分で依頼</h3>
            <p className={classes.sub}>選択肢をクリックするだけ！たった2分で気軽に相談できます。</p>
          </div>
        </div>
        <div className={classes.step}>
          <img alt='提案アイコン' src='/images/ic_flow2.svg' className={classes.icon} width='44' height='44' />
          <div className={classes.text}>
            <h3 className={classes.title}>見積が届く</h3>
            <p className={classes.sub}>最大5人のプロから、あなたのための提案と見積もりが届きます。</p>
          </div>
        </div>
        <div className={classes.step}>
          <img alt='プロアイコン' src='/images/ic_flow3.svg' className={classes.icon} width='44' height='44' />
          <div className={classes.text}>
            <h3 className={classes.title}>プロを選ぶ</h3>
            <p className={classes.sub}>チャットをして依頼するプロを決めましょう。</p>
          </div>
        </div>
      </section>
    )
  }
)

export default ThreeStep
