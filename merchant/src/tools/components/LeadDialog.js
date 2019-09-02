import React from 'react'
import { Link } from 'react-router-dom'
import { reduxForm, formValues, Field, FieldArray } from 'redux-form'
import { connect } from 'react-redux'
import { Button, IconButton } from '@material-ui/core'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import LinkIcon from '@material-ui/icons/Launch'
import iconv from 'iconv-lite'

import renderSwitch from 'components/form/renderSwitch'
import renderTextInput from 'components/form/renderTextInput'
import renderSelect2Chip from 'components/form/renderSelect2Chip'
import renderTextInput2Chip from 'components/form/renderTextInput2Chip'
import MemoList from 'tools/components/MemoList'
import ConfirmDialog from 'components/ConfirmDialog'
import { load as loadAllServices } from 'tools/modules/service'
import { heads } from 'tools/components/LeadPage'
import { update, load, remove, unload } from 'tools/modules/lead'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'

@connect(
  state => ({
    lead: state.lead.lead,
  }),
  { update, load, remove, unload }
)
export default class LeadDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    const { id } = this.props.match.params
    this.props.load(id)
  }

  componentWillUnmount() {
    this.props.unload()
  }

  approveSubmit = () => {
    const { leadForSave } = this.state
    this.props.update([leadForSave])
      .then(() => this.props.history.goBack())
    this.setState({submit: false, leadForSave: null})
  }

  handleSubmit = lead => {
    this.setState({submit: true, leadForSave: lead})
  }

  onRemove = () => {
    const { id } = this.props.match.params
    this.props.remove(id)
      .then(() => this.props.history.goBack())
  }

  render() {
    const { lead } = this.props
    if (!lead) return null

    return (
      <Dialog open={!!open} onClose={() => this.props.history.goBack()} fullWidth maxWidth='md'>
        <div style={{display: 'flex', flexDirection: 'center', padding: 20}}>
          <span style={{fontSize: 20}}>LEAD編集</span>
          <IconButton color='inherit' component={Link} to='/leads' style={{marginLeft: 'auto'}}>
            <CloseIcon />
          </IconButton>
        </div>
        <DialogContent>
          <div style={{display: 'flex', margin: '10px 0', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: 10}}>
              <Button variant='contained' size='small' style={{margin: '0 5px'}} color='secondary' onClick={() => this.setState({convert: true})}>文字化け修正</Button>
              <Button variant='contained' size='small' style={{margin: '0 5px'}} onClick={() => this.setState({remove: true})}>削除</Button>
            </div>
            <LeadForm form={`lead_${lead._id}`} initialValues={lead} onSubmit={this.handleSubmit} />
            <div style={{marginTop: 10}}>
              <MemoList form={`memo_${lead._id}`} lead={lead._id} />
            </div>
          </div>
        </DialogContent>
        <ConvertDialog open={!!this.state.convert} lead={lead} onClose={() => this.setState({convert: false})} />
        <ConfirmDialog open={!!this.state.remove} title='削除しますか？' onClose={() => this.setState({remove: false})} onSubmit={this.onRemove} />
        <ConfirmDialog open={!!this.state.submit} title='更新しますか？' onClose={() => this.setState({submit: false})} onSubmit={this.approveSubmit} />
      </Dialog>
    )
  }
}

@reduxForm({
  enableReinitialize: true,
})
@formValues({
  url: 'url',
  formUrl: 'formUrl',
})
@connect(state => ({
  services: state.service.allServices,
}), { loadAllServices })
export class LeadForm extends React.Component {
  componentDidMount() {
    this.props.loadAllServices()
  }

  render() {
    const { handleSubmit, index, multi, services } = this.props
    return (
      <form onSubmit={handleSubmit(this.props.onSubmit)}>
        {heads.map(head =>
          <div key={head.name} style={{display: 'flex', alignItems: 'center', margin: '5px 0'}}>
            {!index && <span style={{width: 150, display: 'flex', alignItems: 'cenger'}}>
            {head.label}
            {!multi && ['formUrl', 'url'].includes(head.name) &&
              <a style={{marginLeft: 'auto'}} href={this.props[head.name]} target='_blank' rel='noopener noreferrer'>
                <LinkIcon style={{width: 20, height: 20}} />
              </a>
            }
            </span>}
            <div style={{flex: 1}}>
              {head.type === 'string' ?
                <Field
                  type='text'
                  component={renderTextInput}
                  name={head.name}
                  hideError
                />
              : head.type === 'boolean' ?
                <Field
                  component={renderSwitch}
                  name={head.name}
                />
              : head.type === 'array' ?
                <FieldArray
                  style={{minHeight: 100, alignItems: 'center'}}
                  component={renderTextInput2Chip}
                  name={head.name}
                />
              : head.type === 'service' ?
                <FieldArray
                  style={{minHeight: 150, alignItems: 'center'}}
                  list={services}
                  name={head.name}
                  component={renderSelect2Chip}
                />
              : <div />
              }
            </div>
          </div>
        )}
        <div style={{position: 'relative', bottom: 0, left: 0, width: '100%', padding: 10}}>
          <Button fullWidth type='submit' size='large' variant='contained' color='primary'>{multi ? '採用して他を削除' : '更新'}</Button>
        </div>
      </form>
    )
  }
}

@connect(
  () => ({}),
  { update }
)
export class ConvertDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      convertFrom: 'binary',
      convertTo: 'shift-jis',
    }
  }

  componentDidMount() {
    const {convertFrom, convertTo} = this.state
    this.convert(convertFrom, convertTo)
  }

  approveConvert = () => {
    const { converted } = this.state
    this.props.update([converted])
    this.props.onClose()
    this.setState({converted: null})
  }

  convert = (convertFrom, convertTo) => {
    const { lead } = this.props
    const converted = {_id: lead._id}
    for (let head of heads) {
      if (head.type === 'string') {
        converted[head.name] = iconv.decode(iconv.encode(lead[head.name] || '', convertFrom), convertTo)
      } else {
        converted[head.name] = lead[head.name]
      }
    }
    this.setState({converted})
  }

  render() {
    const { lead, onClose, open } = this.props
    const { converted, convertFrom, convertTo } = this.state

    if (!converted || !lead) return null

    const ConvertSelect = ({label, value, onChange}) => (
      <FormControl style={{minWidth: 100}}>
        <InputLabel htmlFor='inputLabel'>{label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e)}
          inputProps={{
            id: 'inputLabel',
          }}
        >
          <MenuItem value='binary'>binary</MenuItem>
          <MenuItem value='shift-jis'>shift-jis</MenuItem>
          <MenuItem value='latin1'>latin1</MenuItem>
          <MenuItem value='eucjp'>eucjp</MenuItem>
          <MenuItem value='utf8'>utf8</MenuItem>
        </Select>
      </FormControl>
    )

    return (
      <Dialog maxWidth={false} open={!!open} onClose={onClose}>
        <DialogTitle>文字化けは修正されていますか？</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{minWidth: 200}} />
                <TableCell>
                  <ConvertSelect
                    label='変換元'
                    value={convertFrom}
                    onChange={(e) => {
                      this.setState({convertFrom: e.target.value})
                      this.convert(e.target.value, convertTo)
                    }}/>
                </TableCell>
                <TableCell>
                  <ConvertSelect
                    label='変換先'
                    value={convertTo}
                    onChange={(e) => {
                      this.setState({convertTo: e.target.value})
                      this.convert(convertFrom, e.target.value)
                    }
                  }/>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {heads.map(h => {
                return (
                  <TableRow key={h.name}>
                    <TableCell>{h.label}</TableCell>
                    <TableCell>{lead[h.name]}</TableCell>
                    <TableCell>{converted[h.name]}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
            <a href='https://ltside.com/enc/' style={{marginLeft: 10}}>一覧で見る</a>
            <div>
              <Button onClick={onClose}>いいえ</Button>
              <Button variant='contained' color='primary' onClick={this.approveConvert} style={{width: 100}}>はい</Button>
            </div>
          </div>
        </DialogActions>
      </Dialog>
    )
  }
}