import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, Field } from 'redux-form'
import {
  AppBar,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider,
  FormControlLabel,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Toolbar,
  TextField,
  Typography,
} from '@material-ui/core'
import MenuIcon from '@material-ui/icons/FilterList'
import SortIcon from '@material-ui/icons/Sort'
import { withTheme } from '@material-ui/core'
import moment from 'moment'

import { withApiClient } from 'contexts/apiClient'
import LicenceLink from 'components/LicenceLink'
import ConfirmDialog from 'components/ConfirmDialog'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'

import DeactivateDialog from 'tools/components/DeactivateDialog'

import { loadAll, update, assign, cancelAssign, create, sort } from 'tools/modules/cstask'
import { loadAdmin, update as updateUser } from 'tools/modules/auth'
import { update as updateProfile } from 'tools/modules/profile'
import { relativeTime } from 'lib/date'
import { interviewDescription, idInvalidReason } from '@smooosy/config'

const filters = {
  all: '全て',
  own: '自分のみ',
}

@connect(state => ({
  licences: state.cstask.licences,
  deactivates: state.cstask.deactivates,
  identifications: state.cstask.identifications,
  interviews: state.cstask.interviews,
  negativeChats: state.cstask.negativeChats,
  others: state.cstask.others,
  id: state.auth.id,
}), { loadAll, loadAdmin, create, sort })
@withTheme
export default class CSTaskPage extends React.Component {
  state = {
    taskDialog: false,
    filter: 'all',
    desc: true,
    menu: null,
  }

  componentDidMount() {
    this.props.loadAll()
    this.props.loadAdmin()
  }

  sort = () => {
    const { desc } = this.state
    this.props.sort({target: 'createdAt', direction: desc ? 1 : -1})
    this.setState({desc: !desc})
  }

  createTask = values => {
    return this.props.create(values)
      .then(() => {
        this.props.loadAll()
        this.setState({taskDialog: false})
      })
  }

  render() {
    const { id, theme: { palette: { grey, common } } } = this.props
    let { licences, deactivates, identifications, interviews, negativeChats, others } = this.props
    const { filter, desc, menu } = this.state
    if (filter === 'own') {
      licences = licences.filter(l => l.assignee && l.assignee.id === id)
      deactivates = deactivates.filter(l => l.assignee && l.assignee.id === id)
      identifications = identifications.filter(l => l.assignee && l.assignee.id === id)
      interviews = interviews.filter(l => l.assignee && l.assignee.id === id)
      others = others.filter(l => l.assignee && l.assignee.id === id)
    }

    const tasks = [
      {
        name: '止まっている依頼（96時間以内）',
        tasks: interviews,
        component: Interview,
      },
      {
        name: 'ネガティブなチャット',
        tasks: negativeChats,
        component: NegativeChat,
      },
      {name: '資格・免許確認',
        tasks: licences,
        component: Licence,
      },
      {name: '本人確認',
        tasks: identifications,
        component: Identification,
      },
      {name: '退会申請',
        tasks: deactivates,
        component: DeactivateUser,
      },
      {name: 'その他',
        tasks: others,
        component: Other,
        action: <Button size='small' color='primary' variant='contained' onClick={() => this.setState({taskDialog: true})}>新規作成</Button>,
      },
    ]

    return (
      <>
        <AppBar position='sticky' color='default'>
          <Toolbar style={{display: 'flex', background: common.white}}>
            <div style={{marginLeft: 'auto'}} />
            <div>
              <div style={{fontSize: 10, color: grey[800]}}>フィルター</div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <MenuIcon style={{width: 20, height: 20}} />
                <Button style={{width: 70}} size='small' onClick={e => this.setState({menu: e.currentTarget})}>{filters[filter]}</Button>
                <Menu open={Boolean(menu)} anchorEl={menu} onClose={() => this.setState({menu: null})}>
                  {Object.keys(filters).map(f =>
                    <MenuItem key={f} onClick={() => this.setState({filter: f, menu: null})}>{filters[f]}</MenuItem>)
                  }
                </Menu>
              </div>
            </div>
            <div>
              <div style={{fontSize: 10, color: grey[800]}}>ソート</div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <SortIcon style={{width: 20, height: 20}} />
                <Button style={{width: 70}} size='small' onClick={this.sort}>{desc ? '新しい順' : '古い順'}</Button>
              </div>
            </div>
          </Toolbar>
        </AppBar>
        <div style={{minHeight: '100%', background: grey[100]}}>
          <div style={{padding: 20}}>
            {tasks.map(task => <TaskPaper key={task.name} {...task} />)}
          </div>
          <TaskFormDialog onSubmit={this.createTask} form='newTask' initialValues={{type: 'other'}} open={this.state.taskDialog} onClose={() => this.setState({taskDialog: false})} />
        </div>
      </>
    )
  }
}

const TaskPaper = withTheme(({component: TaskComponent, tasks, name, action, theme: { palette: { grey }}}) => (
  <div style={{marginBottom: 20}}>
    <div style={{display: 'flex', marginBottom: 5, alignItems: 'flex-end'}}>
      <span style={{color: grey[800], flex: 1}}>{name}</span>
      {action}
    </div>
    <Paper style={{borderRadius: 5, padding: 5}}>
      {tasks.length ? tasks.map((task, idx) => (
        <React.Fragment key={task.id}>
          <TaskComponent task={task} />
          {tasks.length - 1 !== idx && <Divider />}
        </React.Fragment>
      ))
      :
        <div style={{padding: 20}}>タスクはありません</div>
      }
    </Paper>
  </div>
))

const Task = withTheme(({date, text, title, theme: { palette: { grey } }, children, onClick}) => (
  <div style={{display: 'flex', padding: '5px 20px', alignItems: 'center'}}>
    <div style={{cursor: onClick ? 'pointer' : 'auto', flex: 1, alignSfelf: 'stretch', marginRight: 10}} onClick={onClick}>
      <div style={{display: 'flex'}}>
        <span style={{flex: 1}}>{title}</span>
        <span>{date}</span>
      </div>
      <div style={{color: grey[800], fontSize: 12}}>{text}</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center'}}>
      {children}
    </div>
  </div>
))

const Interview = ({task}) => {
  if (!task) return null
  return (
    <Task
      title={task.request.service.name}
      date={moment(task.request.createdAt).format('YYYY/MM/DD HH:mm')}
      text={task.request.interview.map(i => interviewDescription[i]).join(', ')}
    >
      <Button variant='contained' color='primary' size='small' component={Link} to={`/stats/requests/${task.request.id}`}>依頼詳細</Button>
      <Assign style={{marginLeft: 10}} task={task} />
      <DoneButton task={task} />
    </Task>
  )
}

const NegativeChat = ({task}) => {
  if (!task) return null
  return (
    <Task
      title={`${task.request.customer.lastname}さんの依頼`}
      date={moment(task.request.createdAt).format('YYYY/MM/DD HH:mm')}
      text={`${task.profile ? task.profile.name : task.user.lastname}さんの発言: ${task.detail}`}
    >
      <Button variant='contained' color='primary' size='small' component={Link} to={`/stats/requests/${task.request.id}${task.meet ? `?meet=${task.meet}` : ''}`}>依頼詳細</Button>
      <Assign style={{marginLeft: 10}} task={task} />
      <DoneButton task={task} />
    </Task>
  )
}

@withApiClient
@connect(null, { updateProfile, loadAll })
export class Licence extends React.Component {
  state = {
    detail: false,
    confirm: null,
  }
  memoText = ''

  verifyLicence = ({_id}, status) => {
    const { task: { profile } } = this.props
    const licences = profile.licences.map(l => l._id === _id ? {...l, status} : l)
    this.props.updateProfile({id: profile.id, licences})
      .then(() => {
        const memo = {reference: 'Profile', item: profile.id}
        if (status === 'invalid') {
          memo.text = `免許確認NG: ${profile.licences.find(l => l._id === _id).licence.name}\n${this.memoText}`
        } else {
          memo.text = `免許確認OK: ${profile.licences.find(l => l._id === _id).licence.name}`
        }
        return this.props.apiClient.post('/api/admin/memos', memo)
      })
      .then(() => {
        this.props.loadAll()
        this.props.postProcess && this.props.postProcess()
        this.setState({detail: false, confirm: null})
      })
  }

  onConfirmClose = () => this.setState({confirm: null})

  onConfirm = () => this.verifyLicence(this.state.confirm, 'invalid')

  render() {
    const { task, minimum } = this.props
    if (!task) return null
    return (
      <>
        <Task
          title={`${task.profile.name}（${task.profile.pro.lastname} ${task.profile.pro.firstname || ''})`}
          onClick={() => this.setState({detail: true})}
          text={task.profile.licences.filter(l => l.status === 'pending').map(l => l.licence.name).join(' ')}
        >
          {!minimum &&
            <>
              <Button
                variant='outlined'
                color='primary'
                size='small'
                component={Link}
                to={`/stats/pros/${task.profile.id}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                プロ
              </Button>
              <Assign style={{marginLeft: 10}} task={task} />
              <DoneButton task={task} />
            </>
          }
        </Task>
        <Dialog open={this.state.detail} onClose={() => this.setState({detail: false})}>
          <DialogTitle>{task.profile.name}（{task.profile.pro.lastname} {task.profile.pro.firstname || ''})</DialogTitle>
          <DialogContent>
            {task.profile.licences.filter(l => l.status === 'pending').map((l, idx) =>
              <div key={idx} style={{display: 'flex', padding: '10px 20px', alignItems: 'center'}}>
                <span style={{marginRight: 30}}><LicenceLink licence={l} /></span>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  {l.image &&
                    <Paper component='a' href={l.image} target='_blank' rel='noopener noreferrer' style={{width: 150, height: 100, marginRight: 10, cursor: 'pointer'}}>
                      <img src={l.image} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </Paper>
                  }
                </div>
                <div style={{marginLeft: 'auto'}}>
                  <Button variant='contained' color='secondary' onClick={() => this.verifyLicence(l, 'valid')}>確認OK</Button>
                  <Button variant='contained' style={{marginLeft: 10}} onClick={() => this.setState({confirm: l})}>確認NG</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={Boolean(this.state.confirm)}
          onClose={this.onConfirmClose}
          onSubmit={this.onConfirm}
          label='確定'
          title='メモ入力'
        >
          <TextField multiline fullWidth onChange={e => this.memoText = e.target.value} />
        </ConfirmDialog>
      </>
    )
  }
}

@withApiClient
@withTheme
@connect(null, { updateUser, loadAll })
export class Identification extends React.Component {
  state = {
    verify: false,
    detail: false,
    openIdNGReason: false,
  }
  memoText = ''
  reasonText = ''

  verifyId = (status) => {
    const data = {id: this.props.task.user.id, identification: {status}}
    const { idNGReason } = this.state
    if (status === 'invalid') {
      if (idNGReason === 'other' && this.reasonText) {
        data.identification_invalid = this.reasonText
      } else {
        data.identification_invalid = idNGReason
      }
    }

    this.props.updateUser(data)
      .then(() => {
        const memo = {item: this.props.task.user.id, reference: 'User'}
        if (status === 'valid') {
          memo.text = '本人確認完了'
        } else {
          memo.text = `本人確認NG\n理由：${data.identification_invalid}\n${this.memoText}`
        }
        return this.props.apiClient.post('/api/admin/memos', memo)
      })
      .then(() => {
        this.props.loadAll()
        this.props.postProcess && this.props.postProcess()
        this.setState({openIdNGReason: false, verify: false, detail: false})
      })
  }

  render() {
    const { task, minimum, theme } = this.props
    if (!task) return null
    return (
      <>
        <Task
          title={`${task.user.lastname} ${task.user.firstname ? task.user.firstname : ''}（${task.user.profiles[0].name}）`}
          text={`${task.user.identification.image.length}枚`}
          date={`アップロード日：${task.user.identification.uploadedAt ? relativeTime(new Date(task.user.identification.uploadedAt)) : ''}`}
          onClick={() => this.setState({detail: true})}
        >
          {!minimum &&
            <>
              <Button
                variant='outlined'
                color='primary'
                size='small'
                component={Link}
                to={`/stats/pros/${task.user.profiles[0].id}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                プロ
              </Button>
              <Assign style={{marginLeft: 10}} task={task} />
              <DoneButton task={task} />
            </>
          }
        </Task>
        <Dialog open={this.state.detail} onClose={() => this.setState({detail: false})}>
          <DialogTitle>{task.user.lastname} {task.user.firstname ? task.user.firstname : ''}</DialogTitle>
          <DialogContent>
            <div style={{display: 'flex', alignItems: 'center', padding: '10px 20px', width: '100%'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                {task.user.identification.image.map((image, idx) => (
                  <Paper key={idx} component='a' href={image} target='_blank' rel='noopener noreferrer' style={{width: 150, height: 100, marginRight: 10, cursor: 'pointer'}}>
                    <img src={image} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </Paper>
                ))}
              </div>
              <div style={{marginLeft: 'auto'}}>
                <Button variant='contained' color='secondary' onClick={() => this.setState({verify: true})}>確認OK</Button>
                <Button variant='contained' style={{marginLeft: 10}} onClick={() => this.setState({openIdNGReason: true})}>確認NG</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          title='本人確認書類を承認しますか？'
          label='承認'
          open={this.state.verify}
          onSubmit={() => this.verifyId('valid')}
          onClose={() => this.setState({verify: false})}
        />
        <Dialog open={this.state.openIdNGReason} onClose={() => this.setState({openIdNGReason: false})}>
          <DialogTitle>本人確認書類NG理由</DialogTitle>
          <DialogContent>
            <div style={{border: `1px solid ${theme.palette.grey[300]}`, padding: 20, borderRadius: 5}}>
              <RadioGroup
                value={this.state.idNGReason}
                onChange={e => this.setState({idNGReason: e.target.value})}
              >
                {Object.keys(idInvalidReason).map(k =>
                  <FormControlLabel key={k} value={k} control={<Radio color='primary' />} label={idInvalidReason[k]} />
                )}
              </RadioGroup>
              <div style={{margin: '-10px 0px 0px 40px', display: 'flex'}}>
                <Typography style={{marginTop: 15, fontSize: '0.85rem'}}>理由: </Typography>
                <TextField style={{flex: 1, marginTop: 10, paddingLeft: 5, borderRadius: 2}} onChange={e => this.reasonText = e.target.value} />
              </div>
            </div>
            <TextField label='メモ' multiline fullWidth onChange={e => this.memoText = e.target.value} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({openIdNGReason: false})}>
              キャンセル
            </Button>
            <Button variant='contained' disabled={!this.state.idNGReason} onClick={() => this.verifyId('invalid') } color='secondary'>
              NGにする
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }
}

@connect(null, { loadAll })
class DeactivateUser extends React.Component {
  state = {
    openDeactivate: false,
  }

  render() {
    const { task } = this.props
    if (!task) return null
    return (
      <>
        <Task
          title={`${task.user.lastname} ${task.user.firstname ? task.user.firstname : ''}様`}
          text={`理由：${task.user.deactivateReason}`}
          onClick={() => this.setState({openDeactivate: true})}
        >
          {task.request &&
            <Button
              variant='outlined'
              color='primary'
              size='small'
              component={Link}
              to={`/stats/requests/${task.request}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              過去依頼
            </Button>
          }
          <Assign style={{marginLeft: 10}} task={task} />
          <DoneButton task={task} />
        </Task>
        <DeactivateDialog
          open={this.state.openDeactivate}
          user={task.user}
          onUpdate={this.props.loadAll}
          onClose={() => this.setState({openDeactivate: false})}
        />
      </>
    )
  }
}

@connect(null, { loadAll, update })
class Other extends React.Component {
  state = {
    dialog: false,
  }

  update = values => {
    return this.props.update(this.props.task.id, values)
      .then(() => {
        this.props.loadAll()
        this.setState({dialog: false})
      })
  }

  render() {
    const { task } = this.props
    const { dialog } = this.state
    if (!task) return null
    return (
      <>
        <Task
          onClick={() => this.setState({dialog: true})}
          date={moment(task.createdAt).format('YYYY/MM/DD')}
          title={task.title}
          text={task.detail}
        >
          <Assign task={task} />
          <DoneButton task={task} />
        </Task>
        <TaskFormDialog open={dialog} onClose={() => this.setState({dialog: false})} onSubmit={this.update} form={`task${task.id}`} initialValues={task} />
      </>
    )
  }
}

@withTheme
@connect(state => ({
  admins: state.auth.users,
}), { assign, cancelAssign })
class Assign extends React.Component {
  state = {
    assign: null,
  }

  assign(id) {
    const { task } = this.props
    if (id) {
      this.props.assign(task.id, id)
    } else {
      this.props.cancelAssign(task.id)
    }
    this.setState({assign: null})
  }

  render() {
    const { task, admins, style, theme: { palette: { grey } } } = this.props
    const { assign } = this.state
    if (!task) return null
    return (
      <>
        <div style={style}>
          <div style={{color: grey[800], fontSize: 10}}>担当者</div>
          <Button size='small' onClick={e => this.setState({assign: e.currentTarget})}>
            {task.assignee ? task.assignee.lastname : 'none'}
          </Button>
        </div>
        <Menu open={Boolean(assign)} anchorEl={assign} onClose={() => this.setState({assign: null})}>
          <MenuItem onClick={() => this.assign(null)}>なし</MenuItem>
          {admins.map(a =>
            <MenuItem key={a.id} onClick={() => this.assign(a.id)}>{a.lastname} {a.firstname}</MenuItem>
          )}
        </Menu>
      </>
    )
  }
}

@connect(null, { loadAll, update })
class DoneButton extends React.Component {
  state = {
    done: false,
  }

  done = () => {
    this.props.update(this.props.task.id, {done: true})
      .then(() => this.props.loadAll())
  }

  render() {
    const { variant, size, color } = this.props
    const { done } = this.state
    return (
      <>
        <Button variant={variant || 'contained'} size={size || 'small'} color={color || 'secondary'} onClick={() => this.setState({done: true})}>完了</Button>
        <ConfirmDialog
          title='完了にしますか?'
          open={done}
          onSubmit={this.done}
          onClose={() => this.setState({done: false})}
        />
      </>
    )
  }
}

const TaskFormDialog = connect(null, { create, loadAll })(reduxForm({
  enableReinitialize: true,
  validate: values => {
    const errors = {}
    if (!values.title) {
      errors.title = '必須です'
    }
  },
})(({ open, onClose, onSubmit, handleSubmit, initialValues, submitting }) => (
  <Dialog open={open} onClose={onClose}>
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogContent>
        <Field name='title' label='タイトル' component={renderTextInput} />
        <Field name='detail' label='詳細' component={renderTextArea} />
      </DialogContent>
      <DialogActions>
        <Button
          style={{width: 100}}
          disabled={submitting}
          type='submit'
          variant='contained'
          color='primary'
        >
          {initialValues.id ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </form>
  </Dialog>
)))
