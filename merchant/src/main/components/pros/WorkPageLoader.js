import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { withStyles } from '@material-ui/core/styles'

import { loadForPro as loadMeet, unload as unloadMeet, update as updateMeet } from 'modules/meet'
import { open as openSnack } from 'modules/snack'
import ChangeAccountLink from 'components/ChangeAccountLink'
import WorkPage from 'components/pros/WorkPage'
import ProResponsePage from 'components/pros/ProResponsePage'
import { calcTab } from 'lib/status'

@withStyles({
  root: {
    padding: 40,
  },
  title: {
    fontSize: 20,
  },
  text: {
    marginTop: 20,
  },
})
@connect(
  state => ({
    meet: state.meet.meet,
  }),
  { loadMeet, unloadMeet, updateMeet, openSnack }
)
@withRouter
export default class WorkPageLoader extends React.Component {
  state = {
    error: null,
  }

  componentDidMount() {
    this.load(this.props.id)
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.load(this.props.id)
    }
  }

  componentWillUnmount() {
    this.props.unloadMeet()
  }

  load = id => {
    this.props.loadMeet(id)
      .then(() => this.autoArchive())
      .catch(err => this.setState({error: err.status}))
  }

  autoArchive = () => {
    const { status, meet } = this.props

    if (meet.proResponseStatus === 'tbd') return

    const tab = calcTab(meet)
    if (tab !== status) {
      this.props.history.replace(`/pros/${tab}/${meet.id}`)
      return
    }

    // archive === falseの時は自動ではゴミ箱に移動しない
    if (meet.archive !== undefined) return

    if (meet.customer.deactivate || meet.request.deleted) {
      meet.archive = true
      this.props.updateMeet(meet.id, {archive: true}).then(() => {
        this.props.openSnack(
          `ゴミ箱に移動しました${meet.refund ? ' ポイントは返還済みです' : ''}`,
          {anchor: {vertical: 'bottom', horizontal: 'left'}}
        )
        const newStatus = calcTab(meet)
        this.props.history.push(`/pros/${newStatus}/${meet.id}`)
      })
    }
  }

  render() {
    const { meet, status, classes } = this.props
    const { error } = this.state

    if (error === 404) {
      return (
        <div className={classes.root}>
          <div className={classes.title}>依頼が存在しません</div>
        </div>
      )
    } else if (error === 403) {
      return (
        <div className={classes.root}>
          <div className={classes.title}>表示する権限がありません</div>
          <div className={classes.text}>
            別のアカウントでログインしている場合は、再度<ChangeAccountLink>ログイン</ChangeAccountLink>してください。
          </div>
        </div>
      )
    }

    if (!meet) return null

    if (meet.customer.deactivate) {
      return (
        <div className={classes.root}>
          <div className={classes.title}>
            {meet.status === 'waiting' ? 'この依頼はキャンセルされました' : 'この依頼者は退会しました'}
          </div>
        </div>
      )
    }

    const request = meet.request
    if (request.deleted) {
      return (
        <div className={classes.root}>
          <div className={classes.title}>この依頼は削除されました（{request.suspendReason}）</div>
          {meet.refund &&
            <div className={classes.text}>
              応募に消費したポイントは返還されています。
            </div>
          }
        </div>
      )
    }

    if (meet.isCreatedByUser) {
      if (meet.proResponseStatus === 'tbd') {
        return (
          <ProResponsePage status={status} />
        )
      } else if (meet.proResponseStatus === 'decline') {
        return (
          <div className={classes.root}>
            <div className={classes.title}>この依頼は断りました</div>
          </div>
        )
      }
    }

    return (
      <WorkPage status={status} />
    )
  }
}
