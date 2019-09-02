import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { Button, RadioGroup, Radio, FormControlLabel, Divider } from '@material-ui/core'
import { Tabs, Tab } from '@material-ui/core'
import { ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, ExpansionPanelActions } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { withApiClient } from 'contexts/apiClient'
import { loadAdmin, update } from 'tools/modules/auth'
import { open as openSnack } from 'tools/modules/snack'
import UserAvatar from 'components/UserAvatar'
import renderTextInput from 'components/form/renderTextInput'
import CacheInvalidationForm from 'tools/components/CacheInvalidationForm'
import EditUser from 'tools/components/stats/EditUser'

@withApiClient
@connect(
  state => ({
    users: state.auth.users,
  }),
  { loadAdmin, update, openSnack }
)
@withTheme
export default class AdminPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tab: 'users',
    }
  }

  componentDidMount() {
    this.load()
  }

  load = () => {
    this.setState({editUser: false})
    this.props.loadAdmin()
  }

  findUserByEmail = values => {
    const email = values.email.trim()
    return this.props.apiClient
      .get('/api/admin/users/search', { params: { email } })
      .then(res => {
        this.setState({editUser: res.data})
      })
  }

  rebuildIndex = index => {
    this.setState({submitting: true})
    this.props.apiClient
      .post('/api/admin/search/rebuild', {index})
      .then(() => {
        this.setState({submitting: false})
        this.props.openSnack('完了しました')
      })
  }

  changeAdminStatus = (user, admin) => {
    user.admin = admin
    this.props.update({id: user.id, admin}).then(this.load)
  }

  render() {
    const { tab, submitting } = this.state
    const { users, theme } = this.props

    const { grey } = theme.palette

    const styles = {
      root: {
        background: grey[100],
        padding: 20,
        minHeight: '100%',
      },
      users: {
        margin: '10px 0',
      },
      bar: {
        display: 'flex',
        alignItems: 'flex-start',
      },
      search: {
        flex: 1,
        marginRight: 10,
      },
      es: {
        margin: '10px 0',
        display: 'flex',
        flexDirection: 'column',
      },
    }

    return (
      <div style={styles.root}>
        <Tabs
          value={tab}
          onChange={(e, tab) => this.setState({tab})}
        >
          <Tab style={{minWidth: 'auto', width: 120}} value='users' label='User管理' />
          <Tab style={{minWidth: 'auto', width: 120}} value='es' label='検索index' />
          <Tab style={{minWidth: 'auto', width: 120}} value='cf' label='CloudFront' />
        </Tabs>
        {tab === 'users' ?
          <div style={styles.users}>
            <div style={styles.bar}>
              <EmailForm style={styles.search} onSubmit={this.findUserByEmail} />
              <Button variant='contained' color='secondary' onClick={() => this.setState({editUser: {}})}>
                ユーザー作成
              </Button>
            </div>
            <div style={{marginTop: 10}}>
              {users.map(user =>
                <UserPanel
                  key={user._id}
                  form={`adminUser_${user._id}`}
                  user={user}
                  load={this.load}
                />
              )}
            </div>
          </div>
        : tab === 'es' ?
          <div style={styles.es}>
            <Button
              variant='contained'
              color='secondary'
              disabled={submitting}
              onClick={() => this.rebuildIndex('users')}
            >
              User index 再構築
            </Button>
            <div style={{height: 20}} />
            <Button
              variant='contained'
              color='secondary'
              disabled={submitting}
              onClick={() => this.rebuildIndex('services')}
            >
              Service index 再構築
            </Button>
          </div>
        : tab === 'cf' ?
          <div>
            <h3>キャッシュInvalidations</h3>
            <CacheInvalidationForm />
          </div>
        : null}
        <EditUser
          showAdmin
          open={!!this.state.editUser}
          onUpdate={this.load}
          initialValues={this.state.editUser || {}}
          onClose={() => this.setState({editUser: false})}
        />
      </div>
    )
  }
}

@reduxForm({
  form: 'emailform',
  validate: values => values.email ? {} : {email: '入力してください'},
})
class EmailForm extends React.Component {
  render() {
    const { onSubmit, style, handleSubmit } = this.props
    return (
      <form onSubmit={handleSubmit(onSubmit)} style={style}>
        <Field name='email' component={renderTextInput} placeholder='メールアドレス' />
      </form>
    )
  }
}

@withApiClient
@connect(
  () => ({}),
  { update }
)
@reduxForm({
  // no `form` parameter, given by props
})
@withTheme
class UserPanel extends React.Component {
  constructor(props) {
    super(props)
    props.initialize({
      admin: props.user.admin + '',
      tools: props.user.tools || {},
    })
  }

  updateUser = values => {
    this.props.update({
      id: this.props.user._id,
      admin: values.admin ? parseInt(values.admin) : 0,
    }).then(() => this.props.load())
  }

  createWorker = user => {
    this.props.apiClient.post('/api/callCenter/workers', {user: user._id})
      .then(() => this.props.load())
  }

  removeWorker = user => {
    this.props.apiClient.delete(`/api/callCenter/workers/${user._id}`)
      .then(() => this.props.load())
  }

  render() {
    const { user, theme, handleSubmit } = this.props
    const { grey } = theme.palette

    return (
      <ExpansionPanel key={user._id} component='form' onSubmit={handleSubmit(this.updateUser)}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <UserAvatar user={user} size={40} />
          <div style={{marginLeft: 10, fontSize: 14}}>
            <div style={{fontWeight: 'bold'}}>{`${user.lastname} ${user.firstname} <${user.email}>`}</div>
            <div style={{color: grey[500]}}>
              {{1: 'プロ紹介のみ', 2: 'プロフィール編集', 3: '閲覧編集'}[user.admin] || '管理者'}
              {user.tools && user.tools.twilioWorkerSid && ` Twilio SID:${user.tools.twilioWorkerSid}`}
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div>
            {user.admin < 10 &&
              <Field name='admin' component={({input}) =>
                <RadioGroup
                  name={input.name}
                  value={input.value}
                  onChange={e => input.onChange(e.target.value)}
                  style={{flexDirection: 'row'}}
                  disabled={input.value === '10'}
                >
                  <FormControlLabel value='3' label='閲覧編集' control={<Radio color='primary' />} />
                  <FormControlLabel value='2' label='プロフィール編集' control={<Radio color='primary' />} />
                  <FormControlLabel value='1' label='プロ紹介のみ' control={<Radio color='primary' />} />
                </RadioGroup>
              } />
            }
            {user.tools && user.tools.twilioWorkerSid ?
              <div>
                <Button
                  color='secondary'
                  onClick={() => this.removeWorker(user)}
                >
                  オペレータ解除
                </Button>
                <span style={{marginLeft: 10}}>Twilio SID: {user.tools.twilioWorkerSid}</span>
              </div>
            :
              <Button
                variant='contained'
                color='secondary'
                onClick={() => this.createWorker(user)}
              >
                オペレータに設定
              </Button>
            }
          </div>
        </ExpansionPanelDetails>
        <Divider />
        <ExpansionPanelActions>
          <Button size='small' variant='contained' color='secondary' onClick={() => this.updateUser({})}>
            権限削除
          </Button>
          <div style={{flex: 1}} />
          <Button size='small' variant='contained' color='primary' type='submit'>
            更新
          </Button>
        </ExpansionPanelActions>
      </ExpansionPanel>
    )
  }
}
