import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { connect } from 'react-redux'

import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'

import { Hidden } from '@material-ui/core'
import Container from 'components/Container'
import RequestPaper from 'components/RequestPaper'
import UserAvatar from 'components/UserAvatar'
import SelectService from 'components/SelectService'
import PickupProfiles from 'components/PickupProfiles'
import LPButton from 'components/LPButton'
import Footer from 'components/Footer'
import OGPMeta from 'components/OGPMeta'
import ProVoice from 'components/ProVoice'

import { proCategoryPage } from 'modules/category'
import { loadAll as loadServices } from 'modules/service'
import { pickup } from 'modules/profile'
import { webOrigin, imageSizes, payment } from '@smooosy/config'

const ProTop = withStyles(theme => ({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  img: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -1,
  },
  mask: {
    height: '100%',
    background: 'rgba(0, 0, 0, .5)',
    padding: '60px 0 0',
  },
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 0,
    },
  },
  title: {
    marginTop: 20,
    marginRight: 20,
    fontSize: 24,
    display: 'inline-block',
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: 'rgba(0, 0, 0, .8) 1px 1px 8px',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      fontSize: 20,
    },
  },
  smooosy: {
    fontSize: 48,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
  },
  description: {
    fontSize: 20,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: 'rgba(0, 0, 0, .8) 1px 1px 8px',
    textAlign: 'center',
  },
  comment: {
    fontSize: 20,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: 'rgba(0, 0, 0, .8) 1px 1px 8px',
    textAlign: 'center',
    marginTop: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
      marginLeft: 20,
      marginRight: 20,
      marginBottom: 20,
    },
  },
  boxes: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 10,
  },
  freeBox: {
    display: 'flex',
    width: 300,
    height: 200,
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: 'auto',
    },
  },
  proBox: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 20,
    width: 200,
    height: 100,
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
    },
  },
  container: {
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
  lp_list: {
    width: 180,
    height: 180,
    [theme.breakpoints.down('xs')]: {
      width: 120,
      height: 120,
    },
  },
  lp_0yen: {
    width: 210,
    height: 180,
    [theme.breakpoints.down('xs')]: {
      width: 140,
      height: 120,
    },
  },
  num: {
    marginLeft: 5,
    marginRight: 5,
  },
}))(({category, img, classes, LPButton}) => (
    <div className={classes.root}>
      <img layout='fill' src={img + imageSizes.cover} className={classes.img}/>
      <div className={classes.mask}>
        <Container className={classes.container}>
          <div className={classes.wrap}>
            <div className={classes.header}>
              <h1 className={classes.title}>
                <div>{category}の新規案件受注なら</div>
                <div className={classes.smooosy}>SMOOOSY</div>
              </h1>
              <div className={classes.description}>「SMOOOSY」は無料登録だけで案件が届くオンライン集客サービスです</div>
            </div>
            <div className={classes.boxes}>
              <Hidden implementation='css' xsDown>
                <img layout='fixed' width={180} height={180} src='/images/lp_list.png' className={classes.lp_list}/>
                <img layout='fixed' width={210} height={180} src='/images/lp_0yen.png' className={classes.lp_0yen} />
              </Hidden>
              <Hidden implementation='css' smUp>
                <img layout='fixed' width={120} height={120} src='/images/lp_list.png' className={classes.lp_list}/>
                <img layout='fixed' width={140} height={120} src='/images/lp_0yen.png' className={classes.lp_0yen}/>
              </Hidden>
            </div>
            <div className={classes.description}>
              <span>登録プロ数</span>
              <u className={classes.num}>79,262</u>
              <span>人</span>
            </div>
            <div>
              {LPButton}
              <div className={classes.comment}>SMOOOSYは掲載料・成約料・紹介料無料で利用できる集客サービスです</div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  )
)

let ProSubHeader = ({ className, classes, children, invert }) => {
  const rootClasses = [classes.root]
  if (className) rootClasses.push(className)
  return (
    <h2 className={rootClasses.join(' ')}>
      <div className={invert ? classes.headerInvert : classes.header }>{children}</div>
      <div className={invert ? classes.borderInvert : classes.border } />
    </h2>
  )
}

ProSubHeader = withStyles(theme => ({
  root: {
    padding: '24px 0px 16px 0',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 auto',
    padding: '12px 0',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      fontSize: 18,
      padding: '6px 0',
    },
  },
  headerInvert: {
    width: '100%',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 auto',
    padding: '12px 0',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      fontSize: 18,
      padding: '6px 0',
    },
    color: theme.palette.common.white,
  },
  border: {
    width: '20%',
    border: `2px solid ${theme.palette.secondary.main}`,
  },
  borderInvert: {
    width: '20%',
    border: `2px solid ${theme.palette.common.white}`,
  },
}))(ProSubHeader)

let ProSectionHeader = ({ className, classes, children }) => {
  const rootClasses = [classes.root]
  if (className) rootClasses.push(className)
  return (
    <h2 className={rootClasses.join(' ')}>
      <div className={classes.header}>{children}</div>
    </h2>
  )
}

ProSectionHeader = withStyles(theme => ({
  root: {
    padding: '24px 0px 16px 0',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 auto',
    padding: '12px 0',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      fontSize: 16,
      padding: '6px 0',
    },
  },
}))(ProSectionHeader)


let ProHowToModule = ({ classes }) => (
  <div>
    <Hidden implementation='css' xsDown>
      <div className={classes.flowRoot}>
        <div className={classes.userBox}>
          <img layout='fixed' width={150} height={150} src='/images/ic_user.svg' className={classes.user}/>
          <div>お客様</div>
        </div>
        <div className={classes.flowOuter}>
          <div>
            <div className={classes.flow}>
              <span className={classes.number + ' ' + classes.leftMargin}>1</span>
              <img layout='fixed' width={150} height={150} src='/images/ic_list.svg' className={classes.list}/>
              <div className={classes.flowText}>
                <div className={classes.text + ' ' + classes.marginLeft}>
                  <div>SMOOOSY上で</div>
                  <div>お仕事依頼を提出</div>
                </div>
                <div className={classes.arrow}>
                  <img layout='fixed' width={380} height={65} src='/images/ic_line.svg' className={classes.line}/>
                  <img layout='fixed' width={50} height={65} src='/images/ic_rightArrowEnd.svg' className={classes.arrowRight} />
                </div>
              </div>
            </div>
          </div>
          <div className={classes.flowBorder} />
          <div>
            <div className={classes.flow}>
              <div className={classes.flowText + ' ' + classes.marginBottom}>
                <div className={classes.flex}>
                  <span className={classes.number + ' ' + classes.leftMargin}>2</span>
                  <div className={classes.text}>
                    <div>案件を選び</div>
                    <div>メッセージを送信</div>
                  </div>
                </div>
                <div className={classes.flexRight}>
                  <div className={classes.flexColumn}>
                    <div className={classes.arrow}>
                      <img layout='fixed' width={50} height={65} src='/images/ic_leftArrowEnd.svg' className={classes.arrowLeft} />
                      <img layout='fixed' width={380} height={65} src='/images/ic_line.svg' className={classes.line} />
                    </div>
                  </div>
                  <img layout='fixed' width={150} height={150} src='/images/ic_email.svg' className={classes.email} />
                </div>
                <div className={classes.payment} >
                  <div className={classes.en}>¥</div>
                  <div className={classes.marginLeft}>ここで手数料が発生します</div>
                </div>
              </div>
            </div>
          </div>
          <div className={classes.flowBorder} />
          <div>
            <div className={classes.flow}>
              <div className={classes.flexColumn}>
                <span className={classes.number + ' ' + classes.leftMargin}>3</span>
                <img layout='fixed' width={150} height={150} src='/images/ic_hands.svg' className={classes.hands} />
              </div>
              <div className={classes.flowText + ' ' + classes.flexCenter}>
                <div className={classes.text + ' ' + classes.marginLeft}>
                  <div>どの業者に頼むか選び</div>
                  <div>成約ボタンを押す</div>
                </div>
                <div className={classes.arrow + ' ' + classes.marginBottom}>
                  <img layout='fixed' width={380} height={65} src='/images/ic_line.svg' className={classes.line} />
                  <img layout='fixed' width={50} height={65} src='/images/ic_rightArrowEnd.svg' className={classes.arrowRight} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={classes.proBox}>
          <img layout='fixed' width={150} height={150} src='/images/ic_pro.svg' className={classes.pro} />
          <div>事業者様</div>
        </div>
      </div>
    </Hidden>
    <Hidden implementation='css' smUp>
      <div className={classes.mobile}>
        <div className={classes.flowRoot}>
          <div>
            <span className={classes.number + ' ' + classes.leftMargin}>1</span>
            <div>お客様がSMOOOSY上で</div>
            <div>見積もり依頼を提出</div>
          </div>
          <div className={classes.icons}>
            <img layout='fixed' width={100} height={100} src='/images/ic_list.svg' className={classes.list} />
            <img layout='fixed' width={100} height={100} src='/images/ic_user.svg' className={classes.user} />
          </div>
        </div>
        <div className={classes.flowBorder} />
        <div className={classes.flowRoot}>
          <div>
            <span className={classes.number + ' ' + classes.leftMargin}>2</span>
            <div>案件を選び</div>
            <div>メッセージを送信</div>
            <div className={classes.payment} >
              <div className={classes.en}>¥</div>
              <div className={classes.marginLeft}>ここで手数料が発生します</div>
            </div>
          </div>
          <div className={classes.icons}>
            <img layout='fixed' width={100} height={100} src='/images/ic_email.svg' className={classes.email} />
            <img layout='fixed' width={100} height={100} src='/images/ic_pro.svg' className={classes.pro} />
          </div>
        </div>
        <div className={classes.flowBorder} />
        <div className={classes.flowRoot}>
          <div>
            <span className={classes.number + ' ' + classes.leftMargin}>3</span>
            <div>どの業者に頼むか選び</div>
            <div>成約ボタンを押す</div>
          </div>
          <img layout='fixed' width={100} height={100} src='/images/ic_hands.svg' className={classes.hands} />
        </div>
      </div>
    </Hidden>
  </div>
)

ProHowToModule = withStyles(theme => ({
  flowRoot: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
  },
  userBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
    marginBottom: -32,
  },
  proBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
  },
  number: {
    color: orange[500],
    fontSize: 60,
  },
  leftMargin: {
    marginRight: 50,
  },
  flowOuter: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  flow: {
    display: 'flex',
    marginBottom: 20,
  },
  flowText: {
    display: 'flex',
    flexDirection: 'column',
  },
  flowBorder: {
    width: '100%',
    height: 2,
    minHeight: 2,
    borderBottom: `1px dashed ${orange[500]}`,
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
    },
  },
  payment: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
      marginTop: 0,
      fontSize: 10,
    },
  },
  en: {
    background: theme.palette.secondary.main,
    color: theme.palette.common.white,
    width: 24,
    height: 24,
    fontSize: 20,
    textAlign: 'center',
    borderRadius: 12,
    [theme.breakpoints.down('xs')]: {
      width: 18,
      height: 18,
      fontSize: 14,
    },
  },
  user: {
    width: 200,
    height: 200,
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 100,
      marginTop: -10,
      marginBottom: 0,
    },
    [theme.breakpoints.down('xs')]: {
      marginBottom: -10,
      width: 100,
      height: 100,
    },
  },
  pro: {
    width: 200,
    height: 200,
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 100,
    },
    [theme.breakpoints.down('xs')]: {
      width: 100,
      height: 100,
    },
  },
  list: {
    marginLeft: 10,
    width: 150,
    height: 150,
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 100,
      marginLeft: -10,
      marginRight: -15,
    },
    [theme.breakpoints.down('xs')]: {
      width: 100,
      height: 100,
      marginLeft: -20,
      marginRight: 0,
      marginBottom: -90,
    },
  },
  email: {
    width: 150,
    height: 150,
    marginTop: -50,
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 150,
    },
    [theme.breakpoints.down('xs')]: {
      width: 100,
      height: 100,
      marginTop: 0,
      marginLeft: -20,
      marginBottom: -90,
    },
  },
  hands: {
    width: 150,
    height: 150,
    [theme.breakpoints.down('sm')]: {
      width: 100,
      height: 150,
    },
    [theme.breakpoints.down('xs')]: {
      width: 100,
      height: 100,
    },
  },
  line: {
    width: '100%',
  },
  arrow: {
    display: 'flex',
  },
  arrowRight: {
    marginLeft: -40,
  },
  arrowLeft: {
    marginRight: -40,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 24,
    color: theme.palette.grey[800],
    marginTop: 20,
    marginBottom: -20,
    [theme.breakpoints.down('sm')]: {
      fontSize: 15,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  marginLeft: {
    marginLeft: 20,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 10,
    },
    [theme.breakpoints.down('xs')]: {
      marginLeft: 5,
    },
  },
  marginBottom: {
    marginBottom: 20,
  },
  flex: {
    display: 'flex',
  },
  flexRight: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 20,
  },
  mobile: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  icons: {
    width: 100,
  },
}))(ProHowToModule)

let ProFeature = ({ classes }) => (
  <div>
    <Hidden implementation='css' xsDown>
      <div className={classes.root}>
        <div className={classes.featureBox}>
          <h2 className={classes.featureHeader}>業界最安値級の集客費用</h2>
          <img layout='fixed' width={100} height={100} src='/images/ic_money.svg' className={classes.featureImg} />
          <div className={classes.featureText}>チラシやリスティング広告の10分の１〜半額程度の集客費用</div>
        </div>
        <div className={classes.featureBox}>
          <h2 className={classes.featureHeader}>無料でホームページを作成</h2>
          <img layout='fixed' width={100} height={100} src='/images/ic_web.svg' className={classes.featureImg}/>
          <div className={classes.featureText}>実績や口コミを掲載できるホームページを無料で作れる</div>
        </div>
        <div className={classes.featureBox}>
          <h2 className={classes.featureHeader}>受注可能性の高い見込み顧客</h2>
          <img layout='fixed' width={100} height={100} src='/images/ic_hands.svg' className={classes.featureImg}/>
          <div className={classes.featureText}>チラシやリスティング広告と違い、発注を考えている顧客にだけ出会える</div>
        </div>
      </div>
    </Hidden>
    <Hidden implementation='css' smUp>
      <div className={classes.root}>
        <div className={classes.featureBox}>
          <img layout='fixed' width={100} height={100} src='/images/ic_money.svg' className={classes.featureImg} />
          <div className={classes.description}>
            <h2 className={classes.featureHeader}>業界最安値級の集客費用</h2>
            <div className={classes.featureText}>チラシやリスティング広告の10分の１〜半額程度の集客費用</div>
          </div>
        </div>
        <div className={classes.flowBorder} />
        <div className={classes.featureBox}>
          <div className={classes.description}>
            <h2 className={classes.featureHeader}>無料でホームページを作成</h2>
            <div className={classes.featureText}>実績や口コミを掲載できるホームページを無料で作れる</div>
          </div>
          <img layout='fixed' width={100} height={100} src='/images/ic_web.svg' className={classes.featureImg}/>
        </div>
        <div className={classes.flowBorder} />
        <div className={classes.featureBox}>
          <img layout='fixed' width={100} height={100} src='/images/ic_hands.svg' className={classes.featureImg}/>
          <div className={classes.description}>
            <h2 className={classes.featureHeader}>受注可能性の高い見込み顧客</h2>
            <div className={classes.featureText}>チラシやリスティング広告と違い、発注を考えている顧客にだけ出会える</div>
          </div>
        </div>
      </div>
    </Hidden>
  </div>
)

ProFeature = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      marginLeft: 10,
      marginRight: 10,
    },
  },
  featureImg: {
    width: 100,
    height: 100,
    minWidth: 100,
  },
  featureBox: {
    width: 260,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      flexDirection: 'row',
      marginTop: 20,
      justifyContent: 'space-between',
    },
  },
  featureHeader: {
    fontSize: 18,
    color: theme.palette.common.white,
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      textAlign: 'start',
      fontSize: 15,
    },
  },
  featureText: {
    fontSize: 15,
    marginTop: 20,
    color: theme.palette.common.white,
    [theme.breakpoints.down('xs')]: {
      marginTop: 5,
    },
  },
  flowBorder: {
    width: '100%',
    minHeight: 1,
    borderBottom: `1px dashed ${theme.palette.common.white}`,
    marginTop: 20,
  },
  description: {
    paddingLeft: 10,
    paddingRight: 10,
  },
}))(ProFeature)

let Rect = ({ classes, children, ...custom }) => {

  const rootClasses = [ classes.root ]
  custom && custom.className && rootClasses.push(custom.className)

  return (
    <div className={rootClasses.join(' ')} >
      {children}
    </div>
  )
}

Rect = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.palette.secondary.main,
    borderRadius: 20,
    color: theme.palette.common.white,
    fontSize: 30,
    padding: 20,
  },
}))(Rect)

let ProPriceModule = ({ classes }) => (
  <div className={classes.root}>
    <div className={classes.align}>
      <Rect className={classes.rect}>利用登録する</Rect>
      <div className={classes.text}>無料</div>
    </div>
    <img layout='fixed' width={60} height={80} src='/images/ic_bigarrow.svg' className={classes.arrowImg} />
    <div className={classes.align}>
      <Rect className={classes.rect}>案件紹介メールを受け取る</Rect>
      <div className={classes.text}>無料</div>
    </div>
    <img layout='fixed' width={60} height={80} src='/images/ic_bigarrow.svg' className={classes.arrowImg} />
    <div className={classes.align}>
      <Rect className={classes.rect}>気に入った案件に応募する</Rect>
      <div className={classes.text}>
        <div>{payment.pricePerPoint.withTax}円〜</div>
        <div className={classes.small}>案件による</div>
      </div>
    </div>
    <img layout='fixed' width={60} height={80} src='/images/ic_bigarrow.svg' className={classes.arrowImg + ' ' + classes.arrowLastImg} />
    <div className={classes.align}>
      <Rect className={classes.rect}>成約する</Rect>
      <div className={classes.text}>無料!</div>
    </div>
  </div>
)

ProPriceModule = withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  align: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    width: '25%',
    [theme.breakpoints.down('xs')]: {
      width: '95%',
      maxWidth: 400,
      margin: '0 auto',
    },
  },
  arrowImg: {
    width: 60,
    height: 80,
    marginTop: 30,
    marginLeft: -5,
    marginRight: -20,
    zIndex: 1,
    [theme.breakpoints.down('xs')]: {
      transform: 'rotateZ(90deg)',
      marginTop: -35,
      marginBottom: -5,
      marginLeft: 0,
      marginRight: 0,
    },
  },
  arrowLastImg: {
    [theme.breakpoints.down('xs')]: {
      marginTop: -50,
    },
  },
  text: {
    fontSize: 30,
    color: orange[500],
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: 20,
      textAlign: 'right',
    },
  },
  small: {
    fontSize: 15,
    [theme.breakpoints.down('xs')]: {
      fontSize: 10,
    },
  },
  rect: {
    height: 150,
    fontSize: 30,
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: 60,
      fontSize: 20,
    },
  },
}))(ProPriceModule)

let ProFreeModule = ({ classes }) => (
  <div>
    <ProSectionHeader>今だけ！応募手数料も完全無料</ProSectionHeader>
    <Hidden implementation='css' xsDown>
      <div className={classes.root}>
        <div>通常なら応募時にかかる手数料も、今なら完全無料で</div>
        <div>返信ポイントを払わずにSMOOOSYをお試しいただけます！</div>
        <div>この機会にぜひお試しください！！</div>
      </div>
    </Hidden>
    <Hidden implementation='css' smUp>
      <div className={classes.root}>通常なら案件応募時にかかる手数料も、今なら完全無料でお試しいただけます！この機会にぜひお試しください！！</div>
    </Hidden>
  </div>
)


ProFreeModule = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
      marginLeft: 10,
      marginRight: 10,
    },
  },
}))(ProFreeModule)

let ProMeetPapers = ({ meets, service, customer, classes }) => {
  if (!meets) return null

  // shuffle
  for (let i = meets.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    let tmp = meets[i]
    meets[i] = meets[r]
    meets[r] = tmp
  }
  const meet = meets[0]

  return (
    <div>
      <div className={classes.meets}>
        <div className={classes.padding}>
          <div className={classes.meet}>
            <div className={classes.center}>
              <UserAvatar alt={`${service.providerName + String.fromCharCode(65)}`} className={classes.socialIcon} />
            </div>
            <div className={classes.provider}>
              {service.providerName}{String.fromCharCode(65)}
            </div>
            <div className={classes.message}>
              {meet.chats[0].text.replace(/UUU/g, customer).replace(/PPP/g, String.fromCharCode(65))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

ProMeetPapers = withStyles(theme => ({
  meets: {
    margin: '20px 0',
  },
  padding: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    overflowX: 'initial',
    padding: 0,
    WebkitOverflowScrolling: 'touch',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-start',
      overflowX: 'auto',
      padding: '0 10px',
    },
  },
  meet: {
    minWidth: 230,
    width: '100%',
    textAlign: 'center',
    padding: '20px 20px 0',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
      marginRight: 0,
      padding: '12px 12px 0',
    },
  },
  message: {
    position: 'relative',
    margin: '10px 0 0',
    padding: '10px 0 10px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    fontSize: 12,
    maxHeight: 500,
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
  },
  provider: {
    margin: 10,
    fontWeight: 'bold',
  },
  socialIcon: {
    width: 64,
    height: 64,
  },
  socialSize: {
    width: 58,
    height: 58,
  },
}))(ProMeetPapers)

let RequestSample = ({ request, service, classes }) => (
  <div className={classes.root}>
    <div className={classes.request}>
      <div className={classes.person}>
        <img layout='fixed' width={100} height={100} src='/images/ic_user.svg' className={classes.img} />
        <div className={classes.col}>
          <div>お客様からの依頼例</div>
        </div>
      </div>
      <div className={classes.paper}>
        <RequestPaper request={request} />
      </div>
    </div>
    <div className={classes.meet}>
      <div className={classes.person}>
        <img layout='fixed' width={100} height={100} src='/images/ic_pro.svg' className={classes.img} />
        <div className={classes.col}>
          <div>事業者様の</div>
          <div>返信例</div>
        </div>
      </div>
      <ProMeetPapers meets={request.meets} service={service} customer={request.customer} />
    </div>
  </div>
)

RequestSample = withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  request: {
    width: '70%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  meet: {
    width: '30%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  person: {
    display: 'flex',
    fontSize: 22,
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
      fontSize: 18,
      marginLeft: '2.5%',
      marginRight: '2.5%',
    },
  },
  col: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
  img: {
    width: 100,
    height: 100,
  },
  paper: {
    [theme.breakpoints.down('xs')]: {
      marginLeft: '2.5%',
      marginRight: '2.5%',
    },
  },
}))(RequestSample)

let LPButtonIcon = ({ classes }) => (
  <div className={classes.root}>
    <img layout='fixed' width={30} height={30} src='/images/start.png' className={classes.icon} />
  </div>
)

LPButtonIcon = withStyles(theme => ({
  root: {
    position: 'absolute',
    right: 20,
    top: 20,
    [theme.breakpoints.down('xs')]: {
      right: 10,
      top: 8,
    },
  },
  icon: {
    width: 30,
    height: 30,
  },
}))(LPButtonIcon)

@withStyles(theme => ({
  root: {
    padding: '24px 0px 16px 0',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
  },
  invert: {
    background: theme.palette.secondary.main,
  },
  lpButton: {
    background: '#fb6458',
    fontSize: 30,
    width: '100%',
    height: 80,
    borderRadius: 10,
    '&:hover': {
      background: '#db4438',
      boxShadow: 'none',
      top: 5,
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 20,
    },
    [theme.breakpoints.down('xs')]: {
      width: '95%',
      height: 50,
      fontSize: 16,
    },
  },
  lpButtonBorder: {
    border: `2px solid ${theme.palette.common.white}`,
  },
  lpButtonMargin: {
    marginTop: 30,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
    [theme.breakpoints.down('xs')]: {
      marginLeft: '2.5%',
      marginRight: '2.5%',
    },
  },
  lpButtonSmall: {
    width: 'auto',
  },
  checkbox: {
    color: theme.palette.secondary.main,
  },
  serviceHeader: {
    fontSize: 18,
    margin: '0 10px 20px',
  },
}))
@connect(
  state => ({
    category: state.category.category,
    servicesInCategory: state.category.services,
    request: state.category.request,
    pickup: state.profile.pickup,
  }),
  { loadServices, proCategoryPage, pickup }
)
export default class ProCategoryPage extends React.Component {

  constructor(props) {
    super(props)
    const query = qs.parse(this.props.location.search.slice(1))
    const category = props.category
    this.state = {
      open: !!query.modal,
      category: category ? category.name : null,
    }
  }

  componentDidMount() {
    let categoryKey = this.props.match.params.category

    this.props.proCategoryPage(categoryKey)
      .then(({category}) => {
        this.props.pickup({category: category.name})
        this.setState({category: category.name})
      })
    this.props.loadServices()
  }

  onSelect = (selected) => {
    if (selected.length === 0) return
    let query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    selected = selected.map(s => s.id)
    query = qs.stringify(Object.assign(query, {selected}))
    this.props.history.push(`/signup-pro?${query}`)
  }

  openDialog = () => {
    this.setState({open: true})
  }

  closeDialog = () => {
    this.setState({open: false})
  }

  render() {
    const { category, open } = this.state
    let { history, classes, servicesInCategory, request, pickup } = this.props

    if (!servicesInCategory || !category) {
      return null
    } else if (servicesInCategory.length === 0) {
      history.push('/pro')
      return null
    }

    const service = servicesInCategory[0]
    const cover = servicesInCategory.filter(s => s.imageUpdatedAt)
    const img = cover.length ? cover[0].image : '/images/pro-top.jpg?'


    const title = `${category}の顧客を無料で探す`
    const keywords = category + ',SMOOOSY,見積もり'
    const description = `SMOOOSYで新しい顧客とつながりましょう。${category}の仕事依頼を無料でお送りします。あとは依頼を選びメッセージを送信するだけです。${category}の仕事はSMOOOSYで。`
    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const currentURL = webOrigin + currentPath

    return (
      <div>
        <Helmet>
          <title>{title}</title>
          <meta name='description' content={description} />
          <meta name='keywords' content={keywords} />
        </Helmet>
        <OGPMeta
          title={title}
          description={description}
          url={currentURL}
          shareImage={img + imageSizes.ogp}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='Product'
        />
        <ProTop category={category} img={img} LPButton={<LPButton className={classes.lpButton + ' ' + classes.lpButtonBorder + ' ' + classes.lpButtonMargin} onClick={this.openDialog}>まずは無料で依頼を見てみる<LPButtonIcon /></LPButton>} />
        <Container>
          <ProSubHeader>SMOOOSYの仕組み</ProSubHeader>
          <ProHowToModule />
        </Container>
        <Container className={classes.invert}>
          <ProSubHeader invert>SMOOOSYの特徴</ProSubHeader>
          <ProFeature />
          <LPButton className={classes.lpButton + ' ' + classes.lpButtonBorder + ' ' + classes.lpButtonMargin} onClick={this.openDialog}>無料登録して依頼を見てみる<LPButtonIcon /></LPButton>
        </Container>
        <Container>
          <ProSubHeader>SMOOOSYの料金</ProSubHeader>
          <ProPriceModule />
          <ProFreeModule />
          <LPButton className={classes.lpButton + ' ' + classes.lpButtonMargin} onClick={this.openDialog}>完全無料で依頼を受け取る<LPButtonIcon /></LPButton>
        </Container>
        {pickup.length > 0 &&
          <Container className={classes.invert}>
            <ProSubHeader invert>多くの事業者がSMOOOSYで活躍しています</ProSubHeader>
            <PickupProfiles profiles={pickup.slice(0, 6)} />
          </Container>
        }
        <Container>
          <ProSubHeader>事業者からの声</ProSubHeader>
          <ProVoice />
          <LPButton className={classes.lpButton + ' ' + classes.lpButtonMargin} onClick={this.openDialog}>無料で事業者登録する<LPButtonIcon /></LPButton>
        </Container>
        {request && service &&
          <Container>
            <ProSubHeader>実際の依頼例</ProSubHeader>
            <RequestSample request={request} service={service} />
            <LPButton className={classes.lpButton + ' ' + classes.lpButtonMargin} onClick={this.openDialog}>登録して依頼を見る<LPButtonIcon /></LPButton>
          </Container>
        }
        <Container>
          <ProSubHeader>早速登録しましょう</ProSubHeader>
          <div className={classes.selectService}>
            <h3 className={classes.serviceHeader}>提供するサービスを選んでください</h3>
            <SelectService className={{button: classes.lpButton + ' ' + classes.lpButtonSmall, checkbox: classes.checkbox}} multi={true} services={servicesInCategory} label='次へ' onClose={this.closeDialog} onSelect={this.onSelect} inline={true} />
          </div>
        </Container>
        <Footer />
        <SelectService className={{checkbox: classes.checkbox}} open={open} multi={true} services={servicesInCategory} title='提供できるサービスを選んでください' label='次へ' onClose={this.closeDialog} onSelect={this.onSelect} />
      </div>
    )
  }
}
