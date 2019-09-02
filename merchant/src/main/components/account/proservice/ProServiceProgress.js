import React from 'react'
import { withRouter } from 'react-router'
import { withStyles, withWidth, LinearProgress, Button, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import ConfirmDialog from 'components/ConfirmDialog'

@withStyles(theme => ({
  header: {
    background: theme.palette.common.white,
    padding: '10px 20px',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progress: {
    width: 300,
    [theme.breakpoints.down('xs')]: {
      width: 250,
    },
  },
  headerLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 20,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('xs')]: {
      marginBottom: 0,
    },
  },
  iconButton: {
    width: 36,
    height: 36,
  },
}))
@withWidth()
@withRouter
export default class ProServiceProgress extends React.Component {
  constructor(props) {
    super(props)
    const { location: { pathname } } = props
    if (/bulk/.test(pathname)) {
      this.steps = [
        {path: '/introduction', label: '設定開始'},
        {path: '/business-hour', label: '営業時間'},
        {path: '/locations', label: '仕事エリア'},
        {path: '/job-requirements', label: '仕事条件'},
        {path: '/prices', label: '価格設定'},
        {path: '/promo', label: 'ラクラクお得モード'},
        {path: '/budgets', label: '予算設定'},
        {path: '/complete', label: '完了'},
      ]
    } else {
      this.steps = [
        {path: '/introduction', label: '設定開始'},
        {path: '/business-hour', label: '営業時間'},
        {path: '/descriptions', label: 'サービスごとの自己紹介'},
        {path: '/locations', label: '仕事エリア'},
        {path: '/job-requirements', label: '仕事条件'},
        {path: '/prices', label: '価格設定'},
        {path: '/promo', label: 'ラクラクお得モード'},
        {path: '/budgets', label: '予算設定'},
        {path: '/complete', label: '完了'},
      ]
    }
    this.label = '保存して終了'
    this.state = {}
  }

  render() {
    const {pathname, saveAndExit, classes, width, label} = this.props
    const idx = this.steps.findIndex(s => pathname.indexOf(s.path) !== -1)

    const buttonLabel = label || this.label

    return (
      <div className={classes.header}>
        <div className={classes.progress}>
          <div className={classes.headerInfo}>
            <div className={classes.headerLabel}>{this.steps[idx].label}</div>
            {idx !== this.steps.length - 1 && <div className={classes.step}>{idx + 1} / {this.steps.length - 1}</div>}
          </div>
          <LinearProgress variant='determinate' value={Math.min(100, 100 * (idx + 1) / (this.steps.length - 1))} />
        </div>
        {!saveAndExit ?
          null
        : width === 'xs' ?
          <IconButton className={classes.iconButton} onClick={() => this.setState({confirm: true})}><CloseIcon /></IconButton>
        :
          <Button onClick={() => this.setState({confirm: true})}>{buttonLabel}</Button>
        }
        <ConfirmDialog
          open={this.state.confirm}
          onSubmit={() => this.setState({confirm: false})}
          disableBackdropClick
          onBackdropClick={() => this.setState({confirm: false})}
          onClose={saveAndExit}
          title='本当に終了しますか？'
          cancelLabel={buttonLabel}
          label='設定を続ける'
        >
          残りの設定はあと少しだけです。設定を続けませんか？
        </ConfirmDialog>
      </div>
    )
  }
}