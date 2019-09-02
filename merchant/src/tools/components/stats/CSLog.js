import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, Field } from 'redux-form'
import moment from 'moment'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  withStyles,
  ListSubheader,
  InputAdornment,
  IconButton,
  FormControlLabel,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Radio,
} from '@material-ui/core'
import { yellow, orange } from '@material-ui/core/colors'
import CloseIcon from '@material-ui/icons/Close'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import renderSelect from 'components/form/renderSelect'
import { load, create, remove } from 'tools/modules/csLog'

import { csLogs } from '@smooosy/config'
import renderRadioGroup from 'components/form/renderRadioGroup'

@withStyles(theme => ({
  button: {
    marginBottom: 10,
  },
  table: {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 3,
    marginBottom: 20,
  },
  add: {
    width: '100%',
    borderRadius: 3,
    padding: 10,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.grey[100],
    padding: 24,
  },
  expansion: {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 3,
  },
  row: {
    '&:last-child > td': {
      borderBottom: 'none',
    },
  },
  cell: {
    padding: '0 10px',
  },
  name: {
    width: 110,
  },
  type: {
    width: 110,
  },
  date: {
    width: 110,
  },
  action: {
    width: 100,
  },
  result: {
    width: 200,
  },
  time: {
    width: 60,
  },
  profile: {
    maxWidth: 150,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  note: {
    width: 300,
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
  },

}), {withTheme: true})
@connect(state => ({
  user: state.auth.admin,
  csLog: state.csLog,
}),
{ load, remove },
(state, dispatch, own) => ({
  ...state,
  ...dispatch,
  ...own,
  logs: state.csLog.csLogs.filter(l => !l.isMemo),
}))
export default class CSLog extends React.Component {
  state = {
    csLogDialog: false,
  }

  componentDidMount() {
    const { refs: { user } } = this.props
    this.props.load({user: user._id})
  }

  onDelete = (id) => {
    this.props.remove(id)
  }

  render() {
    const { classes, logs, refs } = this.props
    if (!logs) return null

    return (
      <>
        <Button size='small' variant='contained' className={classes.button} onClick={() => this.setState({csLogDialog: true})}>CS対応ログ</Button>
        <Dialog fullScreen open={this.state.csLogDialog} onClose={() => this.setState({csLogDialog: false})}>
          <IconButton style={{position: 'absolute', top: 10, right: 10}} onClick={() => this.setState({csLogDialog: false})}><CloseIcon /></IconButton>
          <DialogTitle>
            <div>
              <span>{refs.user.lastname} {refs.user.firstname}様</span>
              <span>（TEL:<a style={{marginLeft: 10}} href={`tel:${refs.user.phone}`}>{refs.user.phone}</a>）</span>
            </div>
            <div>
              <span style={{marginRight: 5}}>他プロフィール:</span>
              {refs.user.profiles.filter(p => p._id !== refs.profile._id).map(p =>
                <Link style={{marginRight: 10}} to={`/stats/pros/${p._id}`} target='_blank' rel='noopener noreferrer' key={p._id}>{p.name}</Link>
              )}
            </div>
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <ExpansionPanel elevation={0} className={classes.expansion}>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>新規ログ</ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <div className={classes.add}>
                  <CSLogForm refs={refs} />
                </div>
              </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel defaultExpanded elevation={0} className={classes.expansion}>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>メモ</ExpansionPanelSummary>
              <ExpansionPanelDetails style={{display: 'flex', flexDirection: 'column'}}>
                <NoteList onDelete={this.onDelete} />
              </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel defaultExpanded elevation={0} className={classes.expansion}>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>履歴</ExpansionPanelSummary>
              <ExpansionPanelDetails>
                {logs.length ?
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell className={classes.cell}>CS</TableCell>
                        <TableCell className={classes.cell}>タイプ</TableCell>
                        <TableCell className={classes.cell}>対応日時</TableCell>
                        <TableCell className={classes.cell}>種別</TableCell>
                        <TableCell className={classes.cell}>結果</TableCell>
                        <TableCell className={classes.cell}>対応時間</TableCell>
                        <TableCell className={classes.cell}>プロフィール</TableCell>
                        <TableCell className={classes.cell}>備考</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map(l =>
                        <TableRow key={l._id} className={classes.row}>
                          <TableCell className={`${classes.name} ${classes.cell}`}>{l.caller.lastname}</TableCell>
                          <TableCell className={`${classes.type} ${classes.cell}`}>{l.type}</TableCell>
                          <TableCell className={`${classes.date} ${classes.cell}`}>{moment(l.createdAt).format('YYYY/MM/DD HH:mm')}</TableCell>
                          <TableCell className={`${classes.action} ${classes.cell}`}>{l.action}</TableCell>
                          <TableCell className={`${classes.result} ${classes.cell}`}>{l.result}</TableCell>
                          <TableCell className={`${classes.time} ${classes.cell}`}>{l.time}分</TableCell>
                          <TableCell className={`${classes.profile} ${classes.cell}`}><Link to={`/stats/pros/${l.profile._id}`} target='_blank' rel='noopener noreferrer'>{l.profile.name}</Link></TableCell>
                          <TableCell className={`${classes.note} ${classes.cell}`}>{l.note}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                : <div>なし</div>
                }
              </ExpansionPanelDetails>
            </ExpansionPanel>
          </DialogContent>
        </Dialog>
      </>
    )
  }
}


@connect(null, { create })
@reduxForm({
  form: 'csCalllLog',
  initialValues: {
    type: 'call',
  },
  validate: ({action, result, note}) => {
    const errors = {}
    if (!note) {
      if (!action) {
        errors.action = '必須です'
      }
      if (!result) {
        errors.result = '必須です'
      }
    }
    return errors
  },
  warn: ({action, result, note}) => {
    const warnings = {}
    if (note && !(action && result)) {
      warnings._warning = 'メモとして作成されます'
    }
    return warnings
  },
})
@withStyles({
  actionResult: {
    display: 'flex',
  },
  action: {
    marginRight: 10,
    minWidth: 200,
  },
  time: {
    marginTop: 10,
  },
  timeInput: {
    width: 150,
    marginRight: 5,
  },
  note: {
    maxWidth: 700,
    display: 'flex',
    marginTop: 10,
  },
  create: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  type: {
    marginTop: 10,
  },
  warning: {
    color: orange[500],
    marginRight: 10,
  },
  submit: {
    height: 50,
    width: 100,
  },
})
class CSLogForm extends React.Component {
  onSubmit = ({action, result, time, note, type}) => {
    const { refs: { user, profile, request, lead } } = this.props
    const log = {
      user: user && user._id,
      profile: profile && profile._id,
      request: request && request._id,
      lead: lead && lead._id,
      action,
      result,
      time,
      note,
      type,
    }
    return this.props.create(log)
      .then(() => this.props.reset())
  }

  render() {
    const { classes, submitting, warning } = this.props
    return (
      <form onSubmit={this.props.handleSubmit(this.onSubmit)}>
        <div className={classes.actionResult}>
          <Field name='action' label='アクション' component={renderSelect} className={classes.action}>
            <ListSubheader>プロ</ListSubheader>
            {csLogs.actionType.pro.map((action, idx) =>
              <MenuItem key={`action_pro_${idx}`} value={action}>{action}</MenuItem>
            )}
            <ListSubheader>ユーザー</ListSubheader>
            {csLogs.actionType.user.map((action, idx) =>
              <MenuItem key={`action_user_${idx}`} value={action}>{action}</MenuItem>
            )}
            <ListSubheader>リード</ListSubheader>
            {csLogs.actionType.lead.map((action, idx) =>
              <MenuItem key={`action_lead_${idx}`} value={action}>{action}</MenuItem>
            )}
          </Field>
          <Field name='result' label='結果' component={renderSelect} className={classes.action}>
            {csLogs.resultType.map((result, idx) =>
              <MenuItem key={`result_${idx}`} value={result}>{result}</MenuItem>
            )}
          </Field>
          <Field
            name='time'
            label='対応時間'
            component={renderTextField}
            InputProps={{
              endAdornment: <InputAdornment position='end'>分</InputAdornment>,
              className: classes.timeInput,
            }}
          />
        </div>
        <Field name='note' label='備考' className={classes.note} component={renderTextField} multiline />
        <div className={classes.type}>
          <Field name='type' label='タイプ' component={renderRadioGroup} row>
            {csLogs.logType.map(t =>
              <FormControlLabel
                key={t}
                control={<Radio color='primary' />}
                value={t}
                label={t}
              />
            )}
          </Field>
        </div>
        <div className={classes.create}>
          <span className={classes.warning}>{warning}</span>
          <Button className={classes.submit} disabled={submitting} variant='contained' size='small' color='primary' type='submit'>作成</Button>
        </div>
      </form>
    )
  }
}

const NoteList = connect(state => ({
  logs: state.csLog.csLogs.filter(l => l.isMemo),
}))(withStyles(theme => ({
  root: {
    marginTop: 5,
    padding: 5,
    display: 'flex',
    fontSize: 14,
    background: yellow[100],
    border: `1px solid ${yellow[500]}`,
  },
  username: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  text: {
    flex: 1,
    display: 'flex',
  },
  time: {
    marginLeft: 10,
    color: theme.palette.grey[700],
  },
  note: {
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  close: {
    width: 20,
    height: 20,
    margin: 10,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
}))(({classes, logs, onDelete}) => {
  const onClick = useCallback((id) => onDelete(id), [onDelete])
  return (
    <div>
      {logs.length ? logs.map(log =>
        <div key={log._id} className={classes.root}>
          <div className={classes.username}>{log.username}</div>
          <div className={classes.text}>
            <div className={classes.note}>{log.note}</div>
            <div className={classes.time}>{moment(log.createdAt).format('YYYY/MM/DD HH:mm')}</div>
          </div>
          <IconButton className={classes.close} onClick={() => onClick(log._id)}><CloseIcon className={classes.closeIcon} /></IconButton>
        </div>
      ) : 'なし'}
    </div>
  )
}))

const renderTextField = ({
  label,
  input,
  meta: { error },
  ...custom
}) => (
  <TextField
    label={label}
    error={!!error}
    {...input}
    {...custom}
  />
)
