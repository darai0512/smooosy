import React from 'react'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'

import { load, prefetchWithQueries } from 'modules/service'
import QueryCard from 'components/cards/QueryCard'
import Loading from 'components/Loading'
import ResponsiveDialog from 'components/ResponsiveDialog'
import { hideIntercom, showIntercom } from 'lib/intercom'
import { setFixedOnIOS, removeFixedOnIOS } from 'lib/fixedSafariDialog'

@connect(
  (state, props) => ({
    user: state.auth.user,
    service: state.service.serviceMapWithQueries[props.serviceKey],
  }),
  { load, prefetchWithQueries }
)
@withStyles(theme => ({
  root: {
    [theme.breakpoints.down('xs')]: {
      position: 'fixed', // iOS Safariで背景スクロールする不具合の対策
    },
  },
  paper: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    borderRadius: 4,
    width: 600,
    minWidth: 'auto',
    maxWidth: '90vw',
    overflowX: 'hidden',
    [theme.breakpoints.down('xs')]: {
      borderRadius: 0,
      maxWidth: '100vw',
      height: '100%',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
  },
}))
export default class QueryDialog extends React.Component {

  load = props => {
    const { serviceKey, noSimilarSelect } = props
    if (!serviceKey) return

    this.props.load(serviceKey)
      .then(({service}) => {
        // 類似サービスがある場合は類似サービスから選択する
        if (!noSimilarSelect && service.similarServices && service.similarServices.length > 0) {
          // 類似サービスの質問項目もあらかじめ取得しておく
          for (let similar of service.similarServices) {
            this.props.prefetchWithQueries(similar.key)
          }
          return
        }
      })
      .catch(() => this.handleClose())
  }

  onOpened = () => {
    setFixedOnIOS()
    hideIntercom()
  }

  handleClose = () => {
    const { onClose } = this.props
    removeFixedOnIOS()
    showIntercom()
    onClose()
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if ((!this.props.open && nextProps.open) || this.props.serviceKey !== nextProps.serviceKey)  {
      this.load(nextProps)
    }
  }

  componentDidMount() {
    this.load(this.props)
    // ブラウザの戻るボタン時に背景スクロール解除
    // レガシーなブラウザのために念の為存在チェック、https://qiita.com/nenokido2000/items/2dd8da77d06837c8a510
    history.pushState && history.state !== undefined && window.addEventListener('popstate', this.removeFixedOnIOS)
  }

  componentWillUnmount() {
    removeFixedOnIOS()
    history.pushState && history.state !== undefined && window.removeEventListener('popstate', this.removeFixedOnIOS)
    showIntercom()
  }

  render() {
    let { open, noSimilarSelect, service, dialogInfo, specialSent, initialZip, user, classes, flowType, onEnd, postRequestCreate } = this.props

    if (!open) {
      return null
    }

    // 自分にはスペシャルを送らない
    if (specialSent && user.profiles && user.profiles.indexOf(specialSent) !== -1) {
      specialSent = null
    }

    const similarServices = service && !noSimilarSelect ? service.similarServices : []

    return (
      <div>
        <ResponsiveDialog hideHeader={true} muiClasses={{root: classes.root, paper: classes.paper}} open={open} onOpened={this.onOpened}>
          {service &&
            <QueryCard onClose={this.handleClose} service={service} dialogInfo={dialogInfo} specialSent={specialSent} initialZip={initialZip} similarServices={similarServices} flowType={flowType} onEnd={onEnd} postRequestCreate={postRequestCreate} />
          }
        </ResponsiveDialog>
        {!service && <Loading style={{position: 'fixed', top: 0, left: 0, zIndex: 11, background: 'rgba(0, 0, 0, .5)'}} progressStyle={{color: '#fff'}} />}
      </div>
    )
  }
}
