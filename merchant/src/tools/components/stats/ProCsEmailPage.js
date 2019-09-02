import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import { open as openSnack } from 'modules/snack'
import { load as loadProfile } from 'tools/modules/profile'

import Loading from 'components/Loading'
import CsEmailTemplateSelect from 'tools/components/CsEmailTemplateSelect'
import CsEmailTemplateForm from 'tools/components/CsEmailTemplateForm'

@withStyles({
  root: {
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
  },
  title: {
    margin: 'auto',
    textAlign: 'center',
    fontWeight: 'bold',
  },
})
@connect(
  state => ({
    profile: state.profile.profile,
  }),
  { loadProfile, openSnack }
)
export default class ProCsEmailPage extends React.Component {

  state = {
    csEmailTemplate: null,
  }

  componentDidMount() {
    const id = this.props.match.params.id

    this.props.loadProfile(id)
  }

  backToProfile = () => {
    this.props.history.replace(this.props.location.pathname.replace(/\/[^\/]+$/, ''))
  }

  back = () => {
    const { csEmailTemplate } = this.state
    if (csEmailTemplate) {
      this.setState({csEmailTemplate: null})
    } else {
      this.backToProfile()
    }
  }

  onTemplateClick = (csEmailTemplate) => {
    this.setState({csEmailTemplate})
  }

  onSend = () => {
    this.backToProfile()
    this.props.openSnack('送信しました。送信履歴は「メール」タブで確認してください。')
  }

  onError = (err) => {
    this.props.openSnack(err.message || '想定外のエラーが発生しました。')
  }

  render() {
    const { profile, classes } = this.props
    const { csEmailTemplate } = this.state

    if (!profile) {
      return <Loading />
    }

    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <Button variant='outlined' onClick={this.back}><NavigationChevronLeft />戻る</Button>
          <div className={classes.title}>{profile.name}様へメール送信 {csEmailTemplate && `：${csEmailTemplate.title}`}</div>
        </div>
        {csEmailTemplate
          ? <CsEmailTemplateForm
              onSend={this.onSend}
              onError={this.onError}
              initialValues={{
                profileId: profile.id,
                email: profile.pro.email,
                template: csEmailTemplate.key,
                subject: csEmailTemplate.subject,
                html: csEmailTemplate.html,
              }}
            />
          : <CsEmailTemplateSelect
              profile={profile}
              onClick={this.onTemplateClick}
            />
        }
      </div>
    )
  }
}