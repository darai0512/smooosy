import React from 'react'
import { Avatar } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

const HowToModule = withWidth()(withTheme(({ style, width, theme }) => {
  const { common, secondary } = theme.palette

  const styles = {
    root: {
      ...style,
    },
    desc: {
      padding: '20px 0',
      fontSize: width === 'xs' ? 17 : 22,
      fontWeight: 'bold',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    steps: {
      margin: width === 'xs' ? '10px auto' : '20px auto',
      display: 'flex',
      flexDirection: width === 'xs' ? 'column' : 'row',
      justifyContent: 'space-around',
      alignItems: 'strech',
    },
    step: {
      flex: 1,
      margin: 5,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    number: {
      backgroundColor: secondary.main,
      color: common.white,
      margin: 10,
      textShadow: '0px 2px 2px rgba(0, 0, 0, .4)',
      borderBottom: '2px solid rgba(0, 0, 0, .4)',
      width: 60,
      height: 60,
      fontSize: 28,
    },
    text: {
      textAlign: 'center',
      fontSize: width === 'xs' ? 16 : width === 'sm' ? 14 : 18,
    },
    subtitle: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 2,
    },
    stepIcon: {
      flex: 1,
      width: width === 'xs' ? 70 : 120,
      margin: 8,
    },
    highlight: {
      background: 'linear-gradient(transparent 40%, #ffff66 60%)',
    },
  }

  return (
    <div style={styles.root}>
      <div style={styles.desc}>
        <p style={styles.highlight}>あなたのスキルを求めているお客様に、</p>
        <p style={styles.highlight}>かんたんに出会えるサービスです。</p>
        <p style={{height: 20}} />
        <p style={styles.highlight}>担当したいお客様を選ぶことができ、</p>
        <p style={styles.highlight}>選ぶまで料金はかかりません。</p>
      </div>
      <div style={styles.steps}>
        <div style={styles.step}>
          <Avatar style={styles.number}>1</Avatar>
          <div style={styles.text}>
            <h3 style={styles.subtitle}>登録</h3>
            <p>登録すると、ユーザーからの</p>
            <p>依頼がメールで送られてきます。</p>
          </div>
        </div>
        <div style={styles.step}>
          <Avatar style={styles.number}>2</Avatar>
          <div style={styles.text}>
            <h3 style={styles.subtitle}>依頼に応募</h3>
            <p>あなたが担当したい依頼に対しては</p>
            <p>見積もりとメッセージを送りましょう。</p>
          </div>
        </div>
        <div style={styles.step}>
          <Avatar style={styles.number}>3</Avatar>
          <div style={styles.text}>
            <h3 style={styles.subtitle}>案件獲得</h3>
            <p>依頼主とチャットで詳細を話し合い</p>
            <p>案件の獲得を目指しましょう。</p>
          </div>
        </div>
      </div>
      <div style={{height: 30}} />
    </div>
  )
}))

export default HowToModule
