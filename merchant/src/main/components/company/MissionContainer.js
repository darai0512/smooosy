import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { imageOrigin } from '@smooosy/config'

import AccentContainer from 'components/AccentContainer'

let MissionContainer = ({ containerRef, classes }) => (
  <AccentContainer title='私たちのミッション' containerRef={containerRef} classes={{root: classes.root}}>
    <div className={classes.wrap}>
      <div className={classes.header}>
        <img className={classes.title} src={`${imageOrigin}/static/company/mission-black-pc.png`}/>
      </div>
      <div className={classes.main}>
        <p className={classes.paragraph}>カメラマン、リフォーム業者、レッスン、士業など、サービスの事業者を見つけるのに困った経験はありませんか？SMOOOSYは、こうした様々な事業者と出会える、サービスのプラットフォームです。</p>
        <p className={classes.paragraph}>電話帳やチラシでの集客が減り、インターネットでの集客がより重要になる時代、地域密着型のサービスを提供する事業者の多くは集客に苦戦しています。たくさんのすばらしい事業者が、集客ノウハウがないというだけの理由で、資本力のある企業に負けてしまうのです。そんな事業者の中に、顧客一人ひとりが探している、ユニークでぴったりな事業者があるかもしれません。</p>
        <p className={classes.paragraph}>日本には380万の中小企業があり、そこで3000万人以上の人々が働いています。SMOOOSYはこの多様性を生かし、事業者にも依頼者にも「ぴったり」なマッチングを、技術の力で提供したいと考えています。事業者の集客や営業にかける時間が減り、役務提供にかける時間や余暇の時間が増えれば、日本のGDPは増え、また人生の楽しみ方も広がります。すべての人が自分らしい人生を歩めるのが、SMOOOSYの願いです。</p>
        <p className={classes.paragraph}>SMOOOSYで、見積もりを、もっと簡単に。見つけるのを、もっと楽しく。SMOOOSYは、圧倒的に簡単で、この上なくぴったりな、ローカルサービス全てのプラットフォームを目指し、進化し続けます。</p>
      </div>
    </div>
  </AccentContainer>
)

export default MissionContainer = withWidth()(withStyles((theme) => ({
  root: {
    backgroundImage: `url('${imageOrigin}/static/company/mission-background.png');`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right center',
    marginBottom: 40,
  },
  wrap: {
    width: '90%',
    maxWidth: 640,
    margin: '0 auto',
    padding: '0px 10px 60px',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      padding: '0 28px',
    },
  },
  header: {
    margin: '0px auto',
    textAlign: 'center',
    maxWidth: 576,
  },
  title: {
    width: '100%',
  },
  main: {
    paddingTop: 40,
    // [theme.breakpoints.down('xs')]: {
    //   marginTop: 40,
    // },
  },
  paragraph: {
    padding: '4px 0px',
    textIndent: '1em',
  },
}))(MissionContainer))
