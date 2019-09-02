import React from 'react'
import {Card} from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import { imageSizes } from '@smooosy/config'

const pros = [
  {
    name: 'ガレージウィズユー',
    address: '兵庫県伊丹市',
    image: 'https://smooosy.com/img/users/59ba0d7ef86fe77d931975c7.jpg?1505370039214',
    description: 'SMOOOSYは他のプラットフォームに比べ効率がいい。成約した金額に対してのSMOOOSYの手数料はわずか2.6％でした。',
    category: '自動車整備業者',
  },
  {
    name: 'エアテクノ北海道',
    address: '北海道札幌市',
    image: 'https://smooosy.com/img/users/59efc93f2dd180583d12ee50.jpg?1508888214197',
    description: 'SMOOOSYは成約までとてもスムーズでした。未開拓のお客さまとこんな風に繋がれて、とても良かったと思います。',
    category: 'リフォーム業者',
  },
  {
    name: '鈴木英隆',
    address: '東京都板橋区',
    image: 'https://smooosy.com/img/users/58d239f5b462480e8fdfd681.jpg?1518607372488',
    description: 'SMOOOSYに登録してから短期間で、ピアノの発表会、セミナー撮影、プロフィール撮影など、いろいろな案件を受注できました。',
    category: 'カメラマン',
  },
  {
    name: '税理士法人タックスケア',
    address: '神奈川県平塚市',
    image: 'https://smooosy.com/img/users/5a306ff91c64c9410c54e50a.jpg?1513131118520',
    description: 'SMOOOSY登録早々に、確定申告の案件を受注しました。最初はポイント制や見積もり方法に戸惑いましたが、慣れると意外と簡単でした。',
    category: '税理士',
  },
  {
    name: '川越相続行政書士事務所',
    address: '埼玉県川越市',
    image: 'https://smooosy.com/img/users/594874fe61b154456e25dbe6.jpg?1497920860526',
    description: 'SMOOOSYは、困っている人に、タイムラグなしにアプローチできるのがよい。配置薬販売の許可取得に関して、トントン拍子に話が進みました。',
    category: '行政書士',
  },
  {
    name: '株式会社 bird and insect',
    address: '東京都世田谷区',
    image: 'https://smooosy.com/img/users/59e71bf254ece50a75ffdb28.jpg?1508321449920',
    description: '予算も高い法人案件がネット上で見つかることに驚きました。受注したのは、安達学園グループのプロモーションビデオの依頼でした。',
    category: 'ビデオグラファー',
  },
]

const ProVoice = withStyles(theme => ({
  root: {
    display: 'flex',
    flex: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  cardWrap: {
    width: '33%',
    height: '100%',
    padding: 10,
    [theme.breakpoints.down('xs')]: {
      width: '95%',
    },
  },
  card: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  image: {
    width: 80,
    height: 80,
  },
  description: {
    flex: 1,
    lineHeight: 1.6,
    fontSize: 15,
    padding: 30,
    position: 'relative',
    textShadow: `2px 2px 2px ${theme.palette.common.white}`,
  },
  descriptionBefore: {
    position: 'absolute',
    lineHeight: 1,
    top: 10,
    left: 10,
    fontSize: 30,
    color: theme.palette.grey[600],
  },
  descriptionAfter: {
    position: 'absolute',
    lineHeight: 1,
    bottom: 10,
    right: 15,
    fontSize: 30,
    color: theme.palette.grey[600],
  },
  pro: {
    display: 'flex',
    background: theme.palette.grey[100],
  },
  name: {
    color: theme.palette.grey[800],
    fontSize: 14,
  },
  sub: {
    color: theme.palette.grey[600],
    fontSize:  12,
  },
  text: {
    padding: 10,
  },
}))(({classes}) =>
  <div className={classes.root}>
    {pros.map((p, idx) =>
      <div key={idx} className={classes.cardWrap}>
        <Card className={classes.card}>
          <div className={classes.description}>
            {p.description}
            <div className={classes.descriptionBefore}>“</div>
            <div className={classes.descriptionAfter}>”</div>
          </div>
          <div className={classes.pro}>
            <img className={classes.image} src={p.image + imageSizes.c80} alt={p.name} width={80} height={80} />
            <div className={classes.text}>
              <h3 className={classes.name}>{p.name}</h3>
              <h4 className={classes.sub}>{p.address}</h4>
              <h4 className={classes.sub}>{p.category}</h4>
            </div>
          </div>
        </Card>
      </div>
    )}
  </div>
)

export default ProVoice
