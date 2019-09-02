import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Button, Checkbox, FormControlLabel, FormGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import { grey, red } from '@material-ui/core/colors'
import withTheme from '@material-ui/core/styles/withTheme'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import OKIcon from '@material-ui/icons/Done'
import NGIcon from '@material-ui/icons/Close'

import { update, checkDeactivatable } from 'modules/auth'
import { loadAll as loadAllProfiles, suspend } from 'modules/profile'
import { load as loadPoint } from 'modules/point'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ConfirmDialog from 'components/ConfirmDialog'
import InquiryLink from 'components/InquiryLink'
import Notification from 'components/account/Notification'
import renderTextArea from 'components/form/renderTextArea'


@connect(
  state => ({
    user: state.auth.user,
    deactivatable: state.auth.deactivatable,
    profiles: state.profile.profiles,
    point: state.point.point,
  }),
  { checkDeactivatable, loadAllProfiles, suspend, loadPoint }
)
@withWidth()
@withTheme
export default class DeactivatePage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      suspendProfiles: {},
    }
  }

  componentDidMount() {
    this.props.checkDeactivatable()
    this.props.loadAllProfiles()
    this.props.loadPoint()
  }

  deactivate = () => {
    if (this.props.user.pro) {
      this.props.history.push('/thanks', {from: 'deactivate'})
    } else {
      this.setState({open: true})
    }
  }

  suspend = () => {
    const { suspendProfiles } = this.state
    const suspends = Object.keys(suspendProfiles).filter(p => suspendProfiles[p])
    this.props.suspend(suspends).then(() => this.props.history.push('/account/profiles'))
  }

  openSuspendDialog = () => {
    const { suspendProfiles } = this.state
    const { profiles } = this.props
    profiles.forEach(p => suspendProfiles[p.id] = true)
    this.setState({suspendDialog: true, suspendProfiles})
  }

  handleCheckBox = ({id, bool}) => {
    const { suspendProfiles } = this.state
    suspendProfiles[id] = bool
    this.setState({suspendProfiles})
  }

  render() {
    const { user, deactivatable, profiles, point, theme, width } = this.props
    const { suspendDialog, suspendProfiles } = this.state
    const { secondary, common } = theme.palette
    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      container: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: width === 'xs' ? 'initial': 640,
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'center',
      },
      paper: {
        padding: 20,
        marginBottom: 40,
        width: '100%',
        background: '#fff',
        border: '1px solid #ddd',
        borderWidth: width === 'xs' ? '1px 0' : 1,
        flex: 1,
        alignSelf: 'center',
      },
    }

    if (deactivatable === null) return null

    if (deactivatable === false) {
      return (
        <div style={{margin: 40}}>
          進行中の依頼がある場合は退会できません
          <div>
            <Button variant='contained' color='primary' component={Link} to='/requests'>依頼一覧を確認</Button>
          </div>
        </div>
      )
    }

    const alreadySuspended = profiles.every(p => p.suspend)

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Button onClick={() => this.props.history.goBack()} >
                  <NavigationChevronLeft />
                  戻る
                </Button>
              }
            </div>
            <div>アカウントの退会処理</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>退会</title>
        </Helmet>
        <div style={styles.container}>
          <h2 style={{margin: width === 'xs' ? '20px 10px' : '30px 10px'}}>退会の理由をお聞かせください</h2>
          <h3 style={{padding: 10}}>使い方が分からない</h3>
          <div style={styles.paper}>
            <div style={{padding: '0 0 10px'}}>こちらからよくある質問をご確認できます。</div>
            <a href='https://help.smooosy.com'>よくある質問を見る</a>
            <div style={{padding: '10px 0'}}>またチャットで直接、質問することができます。</div>
            <InquiryLink />
          </div>
          <h3 style={{padding: 10}}>メール・LINEの通知が多すぎる</h3>
          <div style={styles.paper}>
            <div>以下からメール・LINEの通知設定を変更可能です</div>
            <Notification style={{border: 'none', padding: 0, margin: '20px 0 0'}} onSubmit={() => this.props.history.push('/account/notification')} />
          </div>
          {user.pro &&
            <div>
              <h3 style={{padding: 10}}>ポイントが足りない</h3>
              <div style={styles.paper}>
                <h4>現在の所有ポイントは{point ? (point.sum.limited + point.sum.bought) : 0}ptです</h4>
                <div style={{marginTop: 20}}><Link to='/account/points'>こちら</Link>からポイントの無料獲得または購入ができます</div>
              </div>
            </div>
          }
          {!alreadySuspended && user.pro &&
            <div>
              <h3 style={{padding: 10}}>利用をしばらくの間する予定がない</h3>
              <div style={styles.paper}>
                <h4>アカウントを休止することができます</h4>
                <div style={{margin: '10px 0'}}>休止すると・・・</div>
                <div style={{display: 'flex'}}><OKIcon style={{color: secondary.main}}/>ログインは可能です</div>
                <div style={{display: 'flex'}}><OKIcon style={{color: secondary.main}}/>既に応募したお客様とのやり取りは継続できます</div>
                <div style={{display: 'flex'}}><OKIcon style={{color: secondary.main}}/>ポイントやクチコミは維持されます</div>
                <div style={{display: 'flex'}}><NGIcon style={{color: red[500]}}/>新規依頼は受け取れません</div>
                <div style={{display: 'flex'}}><NGIcon style={{color: red[500]}}/>SMOOOSYでのプロフィールの掲載は中断されます</div>
                <p style={{marginTop: 30}}>休止の場合、いつでも利用再開が可能です。</p>
                <p>退会してしまうと、全てのデータにアクセスできなくなってしまいます。</p>
                <Button style={{marginTop: 20, height: 50}} fullWidth variant='contained' color='primary' onClick={() => this.openSuspendDialog()}>利用を休止する</Button>
              </div>
            </div>
          }
          <div style={{margin: '20px 10px'}}>
            {user.pro &&
              <p style={{margin: '20px 0'}}>退会するとポイント({point ? (point.sum.limited + point.sum.bought) : 0}pt)、クチコミ({profiles.reduce((p, c) => p + c.reviews.length, 0)}件)、作成した<Link to='/account/profiles'>プロフィール</Link>がすべてアクセスできなくなります。</p>
            }
            <FormControlLabel
              control={
                <Checkbox
                  color='primary'
                  onChange={(e, bool) => this.setState({confirm: bool})} />
              }
              label={`${user.pro ? 'ポイント、クチコミ、作成したプロフィール' : '依頼のデータ'}にアクセスできなくなることに同意の上、${user.lastname} ${user.firstname || ''}のアカウントを退会処理します`}
            />
            <br/>
            <Button
              variant='contained'
              color='primary'
              disabled={!this.state.confirm}
              onClick={this.deactivate}
            >
              {user.pro ? '退会する' : '退会申請する'}
            </Button>
          </div>
        </div>
        <ConfirmDialog open={!!suspendDialog} title='一時休止してよろしいですか？' onSubmit={this.suspend} onClose={() => this.setState({suspendDialog: false})}>
          <div>休止するプロフィールを選択してください</div>
          <FormGroup>
            {profiles.filter(p => !p.suspend).map(p =>
              <FormControlLabel
                key={p.id}
                control={<Checkbox color='primary' checked={!!suspendProfiles[p.id]} onChange={(e, bool) => this.handleCheckBox({id: p.id, bool})} />}
                label={p.name}
              />
          )}
          </FormGroup>
        </ConfirmDialog>
        <RequestDeactivateDialog
          open={this.state.open}
          onClose={() => this.setState({open: false})}
          requestDeactivate={user.requestDeactivate}
        />
      </AutohideHeaderContainer>
    )
  }
}



@connect(
  () => ({}),
  { update }
)
@reduxForm({
  form: 'exitRequest',
  validate: values => {
    const errors = {}
    if (!values.deactivateReason) {
      errors.deactivateReason = '必須項目です'
    }
    if (values.deactivateReason && values.deactivateReason.length < 20) {
      errors.deactivateReason = '20文字以上必須です'
    }
    // 数字以外の連続文字が５文字以上
    if (/(\D)\1{4}/.test(values.deactivateReason)) {
      errors.deactivateReason = '不適切な入力です'
    }
    return errors
  },
})
class RequestDeactivateDialog extends React.Component {

  submit = (values) => {
    const datas = {
      requestDeactivate: this.props.requestDeactivate ? null : new Date(),
      deactivateReason: !this.props.requestDeactivate ? values.deactivateReason : '',
    }
    this.props.update(datas)
      .then(() => {
        this.props.reset()
        this.props.onClose()
      })
  }

  render () {
    const { handleSubmit, open, onClose, requestDeactivate } = this.props

    return (
      <Dialog open={!!open} onClose={() => onClose()}>
        <form onSubmit={handleSubmit(this.submit)}>
          <DialogTitle>退会申請フォーム</DialogTitle>
          <DialogContent>
            {
              requestDeactivate ?
                '申請中です'
              :
                <Field textareaStyle={{height: 100}} name='deactivateReason' component={renderTextArea} label='退会理由を教えてください' type='text' />
            }
          </DialogContent>
          <DialogActions><Button type='submit' size='small' variant='contained' color='primary'>{!requestDeactivate ? '送信する': '退会をやめる'}</Button></DialogActions>
        </form>
      </Dialog>
    )
  }
}
