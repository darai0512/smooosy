import React from 'react'
import qs from 'qs'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  Button,
  DialogActions,
  DialogContent,
} from '@material-ui/core'
import withStyles from '@material-ui/core/styles/withStyles'
import withWidth from '@material-ui/core/withWidth'

import { BQEventTypes, imageOrigin } from '@smooosy/config'

import { getBoolValue } from 'lib/runtimeConfig'

import { paymentInfo } from 'modules/point'
import { starterPack as loadStarterPack } from 'modules/point'
import { sendLog } from 'modules/auth'

import AgreementLinks from 'components/AgreementLinks'
import ResponsiveDialog from 'components/ResponsiveDialog'
import Payment from 'components/Payment'

let StarterProgramMain = ({starterPack, showAction, showPriceDetail, onClick, classes, theme, width}) => {

  // switch CSS for price detail
  const styles = {
    contentWrap: {
      display: 'flex',
      flex: 1,
      flexDirection: width === 'xs' || showPriceDetail ? 'column' : 'row',
    },
    discountWrap: {
      flex: 2,
      display: 'flex',
      backgroundColor: theme.palette.common.white,
      padding: width === 'xs' || showPriceDetail ? '16px 16px 24px' : 16,
      position: 'relative',
      alignItems: 'center',
      flexDirection: width === 'xs' || showPriceDetail ? 'column' : 'row',
    },
    discountTextWrap: {
      padding: width === 'xs' ? 0 : '4px',
      display: 'flex',
      flex: 2,
      flexDirection: showPriceDetail ? 'row' : 'column',
      justifyContent: 'center',
      alignItems: showPriceDetail ? 'baseline' : 'center',
      flexWrap: showPriceDetail ? 'wrap' : 'nowrap',
    },
    discountDivider: {
      width: width === 'xs' || showPriceDetail ? 64 : 0,
      height: width === 'xs' || showPriceDetail ? 0 : '100%',
      borderTop: `1px solid ${theme.palette.grey[300]}`,
      borderLeft: `1px solid ${theme.palette.grey[300]}`,
      marginLeft: width === 'sm' && !showPriceDetail ? 4 : 16,
      marginRight: width === 'sm' && !showPriceDetail ? 4 : 16,
      marginTop: width === 'xs' || showPriceDetail ? 16 : 0,
      marginBottom: width === 'xs' || showPriceDetail ? 14 : 0,
    },
    moreWrap: {
      position: 'absolute',
      backgroundColor: theme.palette.secondary.main,
      borderRadius: 21,
      display: 'flex',
      width: 42,
      height: 42,
      right: width === 'xs' || showPriceDetail ? 'auto' : '-28px',
      bottom: width === 'xs' || showPriceDetail ? '-28px' : 'auto',
    },
    pointbackWrap: {
      flex: 1,
      backgroundColor: theme.palette.common.white,
      display: 'flex',
      marginTop: width === 'xs' || showPriceDetail ? 8 : 0,
      marginLeft: width === 'xs' || showPriceDetail ? 0 : 12,
      padding: width === 'xs' || showPriceDetail ? 24 : 0,
      minWidth: width === 'xs' || showPriceDetail ? 0 : 216,
    },
    pointbackText: {
      margin: 'auto',
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: '150%',
      textAlign: 'center',
      color:  theme.palette.grey.G950,
      display: width !== 'xs' && showPriceDetail ? 'flex' : 'block',
    },
  }

  return (
    <div className={classes.main}>
      <div className={classes.header}>
        <img src={`${imageOrigin}/static/pros/icon-starter-program.png`} width='36px' height='36px'/>
        <div className={classes.headerText}><div>2回目応募前までの事業者限定！</div><div>まずは10回キャンペーン</div></div>
      </div>
      <div className={classes.content}>
        <div style={styles.contentWrap}>
          <div style={styles.discountWrap}>
            <div style={styles.discountTextWrap}>
              <div className={classes.discountTextPre}>約10回分の応募ポイントが</div>
              <div className={classes.discountText}>20%OFF</div>
            </div>
            <div style={styles.discountDivider} />
            {showPriceDetail ?
            <div className={classes.discountPriceWrap}>
              <div style={{display: 'flex', flexDirection: width === 'xs' ? 'column' : 'row', alignItems: width === 'xs' ? 'center' : 'baseline'}}>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginRight: width === 'xs' ? 0: 14}}>
                  <div style={{fontWeight: 'bold', fontSize: 24}}>{starterPack.point}pt</div>
                  <div>({starterPack.point / 10}pt x 10回分)が</div>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline'}}>
                  <div style={{fontSize: 14, fontWeight: 'bold', textDecoration: 'line-through', color: theme.palette.grey.G650}}>{starterPack.price.toLocaleString()}円</div>
                  <div style={{fontSize: 12, color: theme.palette.grey.G650}}>（税込）</div>
                  <div>➡︎</div>
                  <div style={{fontSize: 18, fontWeight: 'bold', color: theme.palette.secondary.sub}}>{starterPack.discountPrice.toLocaleString()}円</div>
                  <div style={{fontSize: 12, color: theme.palette.grey.G650}}>（税込）</div>
                </div>
              </div>
              <div style={{fontSize: 12, color: theme.palette.grey.G650}}>登録時のカテゴリ：{starterPack.signupCategory.name}</div>
            </div>
            :
            <div className={classes.discountPriceWrap}>
              <div className={classes.discountPriceBefore}>{starterPack.price.toLocaleString()}円</div>
              <div className={classes.arrowDown} />
              <div className={classes.discountPriceAfter}>{starterPack.discountPrice.toLocaleString()}円</div>
            </div>
            }
            <div style={styles.moreWrap}><div className={classes.moreText}>さらに</div></div>
          </div>
          <div style={styles.pointbackWrap}>
            <div style={styles.pointbackText}><div>成約に至らなかった場合</div><div>ポイントバック！※</div></div>
          </div>
        </div>
        {showAction && <Button className={classes.action} classes={{root: classes.actionButtonRoot}} variant='contained' color='secondary' onClick={onClick}>詳細を見る</Button>}
      </div>
    </div>
  )
}

StarterProgramMain = withWidth()(withStyles((theme) => ({
  main: {
    backgroundColor: 'rgba(68, 143, 67, 0.1)',
    padding: 32,
    [theme.breakpoints.down('xs')]: {
      padding: '32px 16px',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
    },
  },
  headerText: {
    display: 'flex',
    flexDirection: 'row',
    marginLeft: 16,
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: '150%',
    color: theme.palette.secondary.sub,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      fontSize: 14,
    },
  },
  content: {
    display: 'flex',
    marginTop: 16,
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
  discountTextPre: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: '150%',
    color:  theme.palette.grey.G950,
    wordBreak: 'keep-all',
  },
  discountText: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    fontSize: 36,
    lineHeight: '100%',
    color: theme.palette.secondary.sub,
    marginLeft: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
    },
  },
  discountPriceWrap: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  discountPriceBefore: {
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '150%',
    textDecorationLine: 'line-through',
    color: theme.palette.grey.G650,
    wordBreak: 'keep-all',
  },
  discountPriceAfter: {
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '150%',
    color: theme.palette.secondary.sub,
    wordBreak: 'keep-all',
  },
  arrowDown: {
    borderRight: `4px solid ${theme.palette.grey.G350}`,
    width: 7,
    height: 5,
    position: 'relative',
    '&:after': {
      position: 'absolute',
      content: '\'\'',
      top: 4,
      borderTop: `5px solid ${theme.palette.grey.G350}`,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
    },
  },
  moreText: {
    color: theme.palette.common.white,
    margin: 'auto',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: '100%',
  },
  pointbackWrap: {
    flex: 1,
    backgroundColor: theme.palette.common.white,
    display: 'flex',
    marginLeft: 12,
    minWidth: 216,
    [theme.breakpoints.down('xs')]: {
      minWidth: 0,
      marginTop: 8,
      marginLeft: 0,
      padding: 24,
    },
  },
  action: {
    marginLeft: 16,
    [theme.breakpoints.down('sm')]: {
      marginTop: 8,
      marginLeft: 0,
    },
    [theme.breakpoints.down('xs')]: {
      margin: '16px auto 0',
      minWidth: 104,
      minHeight: 46,
    },
  },
  actionButtonRoot: {
    backgroundColor: theme.palette.secondary.sub,
    '&:hover': {
      backgroundColor: theme.palette.secondary.subHover,
    },
  },
}), {withTheme: true})(StarterProgramMain))


@withRouter
@withStyles((theme) => ({
  caution: {
    fontSize: '12px',
    lineHeight: '100%',
    textAlign: 'right',
    color: theme.palette.grey.G650,
    marginTop: 12,
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
    },
  },
}))
@connect(state => ({
  starterPack: state.point.starterPack,
  showStarterProgram: getBoolValue(
    'showStarterProgram',
    state.runtimeConfig.runtimeConfigs
  ),
}), { loadStarterPack, sendLog })
export default class StarterProgramBanner extends React.Component {

  constructor(props) {
    super(props)
    const search = qs.parse(props.location.search.slice(1))
    this.state = { openDialog: search.utm_campaign ==='10th_meets_campaign'}
  }

  componentDidMount() {
    if (!this.props.starterPack) {
      this.props.loadStarterPack()
    }
  }

  onClick = () => {
    this.setState({openDialog: true})

    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'open',
      key: 'campaign',
      component: 'dialog',
    })
  }

  onDialogClose = () => {
    this.setState({openDialog: false})

    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'close',
      key: 'campaign',
      component: 'dialog',
    })
  }

  render () {
    const { starterPack, showStarterProgram, classes } = this.props
    const { openDialog } = this.state

    if (!showStarterProgram || !starterPack || !starterPack.isTarget) {
      return null
    }

    return (
      <div className={classes.root}>
        <StarterProgramMain starterPack={starterPack} showAction onClick={this.onClick} />
        <div className={classes.caution}>※詳細をご確認ください</div>
        {openDialog && <StarterProgramDialog open={openDialog} onClose={this.onDialogClose} onPaid={this.onDialogClose} showChargeButton />}
      </div>
    )
  }
}

@withWidth()
@withStyles(() => ({
  banner: {
    width: '100%',
    cursor: 'pointer',
  },
}))
@connect(state => ({
  starterPack: state.point.starterPack,
  showStarterProgram: getBoolValue(
    'showStarterProgram',
    state.runtimeConfig.runtimeConfigs
  ),
}), { loadStarterPack, sendLog })
export class StarterProgramBannerMini extends React.Component {
  state = {
    openDialog: false,
  }

  componentDidMount() {
    if (!this.props.starterPack) {
      this.props.loadStarterPack()
    }
  }

  onClick = () => {
    this.setState({openDialog: true})

    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'open',
      key: 'campaign',
      component: 'dialog',
    })
  }

  onDialogClose = () => {
    this.setState({openDialog: false})

    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'close',
      key: 'campaign',
      component: 'dialog',
    })
  }

  render () {
    const { starterPack, showStarterProgram, style, classes, width } = this.props
    const { openDialog } = this.state

    if (!showStarterProgram || !starterPack || !starterPack.isTarget) {
      return null
    }

    return (
      <div style={style}>
        {/* TODO: Responsive にするため、画像に仮置きしているのをやめる */}
        <img className={classes.banner} onClick={this.onClick} src={width === 'xs' ? `${imageOrigin}/static/pros/banner-starter-program-m-small.png` : `${imageOrigin}/static/pros/banner-starter-program.png`} />
        {openDialog && <StarterProgramDialog open={openDialog} onClose={this.onDialogClose} onPaid={this.onDialogClose} showChargeButton />}
      </div>
    )
  }
}

@withStyles((theme) => ({
  caution: {
    marginTop: 16,
    fontSize: '14px',
    color: theme.palette.grey.G950,
  },
  cautionTitle: {
    fontWeight: 'bold',
    lineHeight: '100%',
  },
  cautionText: {
    lineHeight: '150%',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
  },
  action: {
    width: '100%',
  },
}))
@connect(state => ({
  starterPack: state.point.starterPack,
  showStarterProgram: getBoolValue(
    'showStarterProgram',
    state.runtimeConfig.runtimeConfigs
  ),
}), { loadStarterPack, paymentInfo, sendLog })
export class StarterProgramDialog extends React.Component {

  componentDidMount() {
    this.props.loadStarterPack()
    this.props.paymentInfo()
  }

  onPaymentClick = () => {
    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'open',
      key: 'campaign',
      component: 'payment',
    })
  }

  onPaymentClose = () => {
    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'close',
      key: 'campaign',
      component: 'payment',
    })
  }

  onPaid = () => {
    this.props.loadStarterPack() // update isTarget
    if (this.props.onPaid()) this.props.onPaid()

    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'bought',
      key: 'campaign',
      component: 'payment',
    })
  }

  render() {
    const { starterPack, showStarterProgram, showChargeButton, open, onClose, classes } = this.props

    if (!showStarterProgram || !starterPack) {
      return null
    }

    const payment = {
      price: starterPack.price,
      point: starterPack.point,
      discountPrice: starterPack.discountPrice,
    }

    return (
      <div>
        {/*
          TODO: 応募導線で Dialog on Dialog になる場合があり、その場合はバツボタンではなく、戻るにしたいが、
                ResponsiveDialog 再実装 or 出し分けできるようにしないといけなく、やるとしても最後
        */}
        <ResponsiveDialog open={open} onClose={onClose}>
          <DialogContent>
            <StarterProgramMain starterPack={starterPack} showPriceDetail />
            <div className={classes.caution}>
              <div className={classes.cautionTitle}>※ポイント購入時の注意事項</div>
              <ul>
                <li>ポイント購入はクレジットカードのみ利用可能です。</li>
                <li>初回応募前にクレジットカード登録した場合、初回応募無料の特典も付与されます。</li>
              </ul>
            </div>
            <div className={classes.caution}>
              <div className={classes.cautionTitle}>※ポイントバックの注意事項</div>
              <ul>
                <li>まずは10回キャンペーンで購入したポイントを全て消費後、成約0件の状態が{starterPack.pointBackDays}日以上経過した場合が対象です。</li>
                <li>ポイントは<a href='mailto:info@smooosy.biz'>SMOOOSY運営事務局への連絡</a>・審査の後付与されます。※審査には3営業日程度かかります。</li>
                <li>まずは10回キャンペーンにて購入したポイントと同額のポイントが付与されます。</li>
                <li>ポイントバックは1回のみとなります。</li>
              </ul>
            </div>
          </DialogContent>
          <DialogActions className={classes.actions}>
            {showChargeButton ?
              <>
                <AgreementLinks label='まずは10回キャンペーンを購入する' point={true} style={{marginBottom: 5}} />
                <Payment completeMsg='詳細は「アカウント設定」→「SMOOOSYポイント」画面を参照ください' label='まずは10回キャンペーンを購入する' style={{margin: 10}} type='creditcard' payment={payment} onClick={this.onPaymentClick} onClose={this.onPaymentClose} onPaid={this.onPaid} />
              </>
            :
              <Button style={{margin: 10}} fullWidth size='large' variant='contained' color='primary' onClick={onClose} >閉じる</Button>
            }
          </DialogActions>
        </ResponsiveDialog>
      </div>
    )
  }
}
