import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { Button, LinearProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import AddIcon from '@material-ui/icons/Add'
import SearchIcon from '@material-ui/icons/Search'

import renderTextInput from 'components/form/renderTextInput'
import renderCheckbox from 'components/form/renderCheckbox'
import SelectServiceChip from 'tools/components/SelectServiceChip'

import { update, create, loadAll } from 'tools/modules/proLabel'
import { load as loadServices } from 'tools/modules/service'
import { open as openSnack } from 'tools/modules/snack'

@withStyles(theme => ({
  root: {
    background: theme.palette.grey[100],
    marginTop: -10,
    padding: '10px 0',
    height: 'calc(100% + 10px)',
    overflowY: 'scroll',
  },
  search: {
    margin: 10,
    background: theme.palette.common.white,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 3,
    border: `2px solid ${theme.palette.grey[500]}`,
    padding: 10,
  },
  input: {
    outline: 'none',
    flex: 1,
    fontSize: 18,
    border: 'none',
  },
  addButton: {
    padding: '0 10px',
  },
}))
@connect(state => ({
  services: state.service.allServices,
  labels: state.proLabel.labels,
}), { loadServices, loadAll })
export default class ProLabelPage extends React.Component {
  state = {
    loading: true,
    add: false,
    filteredLabels: [],
    text: '',
  }

  componentDidMount() {
    Promise.all([
      this.props.loadServices(),
      this.props.loadAll(),
    ])
    .then(() => {
      this.setState({
        loading: false,
        filteredLabels: this.props.labels,
      })
    })
  }

  addLabel = () => {
    this.setState({add: true})
  }

  filter = (text) => {
    const { labels, services } = this.props
    this.setState({
      filteredLabels: text ? labels.filter(l => {
        const targetServices = services.filter(s => l.services.includes(s._id))
        return l.text.includes(text) || targetServices.some(s => s.name.includes(text) || s.key.includes(text))
      }) : labels,
      text,
    })
  }

  onSubmit = () => {
    this.filter(this.state.text)
    this.setState({add: false})
  }

  render() {
    const { classes } = this.props
    const { add, filteredLabels } = this.state

    if (this.state.loading) return <LinearProgress color='secondary' />

    return (
      <div className={classes.root}>
        <div className={classes.search}>
          <SearchIcon />
          <input className={classes.input} onChange={e => this.filter(e.target.value)} />
        </div>
        <div className={classes.addButton}>
          <Button onClick={this.addLabel} fullWidth color='primary'><AddIcon /></Button>
        </div>
        {add && <LabelForm isNew onSubmit={this.onSubmit} form='label_new' />}
        {filteredLabels.map(l => <LabelForm onSubmit={this.onSubmit} key={l._id} label={l} form={`label_${l._id}`} />)}
      </div>
    )
  }
}

@withStyles(theme => ({
  root: {
    margin: 10,
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submit: {
    marginTop: 10,
    marginLeft: 'auto',
  },
  serviceButton: {
    marginBottom: 10,
  },
  chip: {
    margin: '0 5px 5px 0',
  },
  info: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    maxWidth: 500,
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    marginLeft: 'auto',
  },
}))
@reduxForm({
  keepDirtyOnReinitialize: true,
  enableReinitialize: true,
})
@connect(state => ({
  servies: state.service.allServices,
}), { update, create, loadAll, openSnack })
class LabelForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.initialize()
  }

  initialize = () => {
    const { initialize, label = {} } = this.props
    initialize({
      services: label.services || [],
      text: label.text || '',
      userEditable: label.userEditable || false,
    })
  }

  submit = (values) => {
    const { label } = this.props
    if (label && label._id) {
      this.props.update(label._id, values)
        .then(() => {
          this.props.onSubmit()
          this.props.openSnack('更新成功')
          this.initialize()
        })
        .catch(e => {
          if (e.status === 409) {
            this.props.openSnack('すでに同じラベルが存在します')
          }
        })
    } else {
      this.props.create(values)
        .then(() => {
          this.props.onSubmit()
          this.props.openSnack('作成成功')
          this.initialize()
        })
        .catch(e => {
          if (e.status === 409) {
            this.props.openSnack('すでに同じラベルが存在します')
          }
        })
    }
  }

  render() {
    const { classes, handleSubmit, submitting, pristine, servies, isNew } = this.props

    return (
      <div className={classes.root}>
        <form onSubmit={handleSubmit(this.submit)} className={classes.form}>
          <div className={classes.info}>
            <Field name='text' component={renderTextInput} rootClass={classes.text} />
            <Field name='userEditable' label='プロが選択可能' component={renderCheckbox} labelClass={classes.checkbox} />
          </div>
          <FieldArray
            name='services'
            label='利用サービス'
            component={SelectServiceChip}
            services={servies}
            title='サービス選択'
            classes={{chip: classes.chip, button: classes.serviceButton}}
          />
          <Button disabled={submitting || pristine} className={classes.submit} type='submit' variant='contained' color='secondary'>{isNew ? '作成' : '保存'}</Button>
        </form>
      </div>
    )
  }
}
