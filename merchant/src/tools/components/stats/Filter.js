import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { withTheme, withStyles } from '@material-ui/core/styles'
import { FormControl, FormControlLabel } from '@material-ui/core'
import { Radio, RadioGroup } from '@material-ui/core'
import { Dialog, DialogContent, DialogTitle, DialogActions } from '@material-ui/core'
import { Button, Checkbox, Chip, IconButton, ListItem, ListSubheader, Menu, MenuItem, Select, TextField } from '@material-ui/core'

import AddIcon from '@material-ui/icons/Add'
import CloseIcon from '@material-ui/icons/Close'
import SearchIcon from '@material-ui/icons/Search'
import { loadAll as loadAllCondition, create as createCondition, remove as removeCondition, unload as unloadCondition } from 'tools/modules/searchCondition'
import { loadAll as loadAllCategories } from 'tools/modules/category'
import { load as loadAllServices } from 'tools/modules/service'
import { sections, searchConditions } from '@smooosy/config'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'

@connect(
  state => ({
    categories: state.category.categories,
    services: state.service.allServices,
  }),
  { loadAllCategories, loadAllServices }
)
@withTheme
export class StatusFilterGenerator extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      serviceSelector: false,
    }
  }

  componentDidMount() {
    this.props.loadAllCategories()
    this.props.loadAllServices()
  }

  onChange = option => e => {
    const value = e.target.value
    const { target: { type, data } } = this.props
    let newData = data.slice()
    if (type === 'checkbox' || type === 'category') {
      const idx = newData.indexOf(value)
      if (idx === -1) {
        newData.push(value)
      } else {
        newData = newData.filter(d => d !== value)
      }
    } else if (type === 'select' || type === 'multiSelect') {
      newData = value
    } else if (type === 'service') {
      newData = value.map(v => v.id)
    } else if (option === 'from') {
      newData[0] = value
    } else if (option === 'to') {
      newData[0] = newData[0] || ''
      newData[1] = value
    } else {
      newData = [value]
    }
    this.props.onChange({target: this.props.target, option, newData})
    this.setState({menu: false})
  }

  onSelectService = value => {
    this.setState({serviceSelector: false})
    this.onChange()({target: {value}})
  }

  render() {
    const { theme, target: { placeholder, unit, label, type, options, data }, onClose, categories, services } = this.props
    let items = this.props.target.items
    const { primary } = theme.palette

    const styles = {
      subheader: {
        background: 'rgba(255, 255, 255, .8)',
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
      inner: {
        background: '#fff',
        padding: 5,
        borderRadius: 3,
      },
    }

    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <FormControl style={{width: '100%'}}>
          <div style={{display: 'flex', margin: '0 5px 5px'}}>
            {label}
            <div style={{flex: 1}} />
            <IconButton onClick={() => onClose()} style={{width: 20, height: 20}}><CloseIcon style={{width: 20, height: 20, marginLeft: 'auto'}} /></IconButton>
          </div>
          <div style={styles.inner}>
            {type === 'dateRange' ?
              <div>
                {(!options || !options.hideFrom) &&
                  <div>
                    <TextField type='date' style={{width: 180}} value={data[0] || ''} placeholder={placeholder} onChange={this.onChange('from')} inputProps={{max: moment().format('YYYY-MM-DD')}} />
                    以降
                  </div>
                }
                {(!options || !options.hideTo) &&
                  <div>
                    <TextField type='date' style={{width: 180}} value={data[1] || ''} placeholder={placeholder} onChange={this.onChange('to')} inputProps={{max: moment().format('YYYY-MM-DD')}} />
                    まで
                  </div>
                }
              </div>
            : (type === 'numberRange' || type === 'percentRange') ?
              <div>
                {(!options || !options.hideFrom) &&
                  <div>
                    <TextField type='number' style={{width: 100}} value={data[0] || ''} placeholder={placeholder} onChange={this.onChange('from')} />
                    {unit}以上
                  </div>
                }
                {(!options || !options.hideTo) &&
                  <div>
                    <TextField type='number' style={{width: 100}} value={data[1] || ''} placeholder={placeholder} onChange={this.onChange('to')} />
                    {unit}以下
                  </div>
                }
              </div>
            : type === 'checkbox' ?
              <RadioGroup row>
              {items.map((item, idx) => (
                <FormControlLabel key={idx} value={item.name} label={item.label} control={<Checkbox style={{height: 35}} checked={data.includes(item.name)} onChange={this.onChange()} />} />
              ))}
              </RadioGroup>
            : type === 'rate' ?
              <RadioGroup row onChange={this.onChange()} value={data[0] || ''}>
                {items.map((item, idx) => (
                  <FormControlLabel key={idx} value={item} label={item} control={<Radio />} />
                ))}
              </RadioGroup>
            : type === 'regexp' ?
              <TextField style={{width: 200, alignSelf: 'center'}} onChange={this.onChange()} value={data[0] || ''} />
            : type === 'select' || type === 'multiSelect' ?
              <Select
                onClose={() => this.setState({menu: false})}
                onChange={this.onChange()}
                value={data}
                style={{width: '90%'}}
                multiple={type === 'multiSelect' || type === 'service'}
              >
                {items.map(c =>
                  <MenuItem key={c.name} value={c.name}>{c.label}</MenuItem>
                )}
              </Select>
            : type === 'service' ?
              <div>
                <div style={{fontSize: 12, whiteSpace: 'pre-wrap'}}>{data.map(d => services.find(s => s.id === d).name).join('\n')}</div>
                <Button style={{marginTop: 10, height: 32, width: '100%'}} size='small' variant='outlined' onClick={() => this.setState({serviceSelector: true})}>サービス選択</Button>
              </div>
            : type === 'category' ?
              <div>
                <Button size='small' onClick={e => this.setState({menu: true, anchor: e.currentTarget})}>{data.length ? data.join(', ') : '選択'}</Button>
                <Menu
                  open={!!this.state.menu}
                  anchorEl={this.state.anchor}
                  onClose={() => this.setState({menu: false})}
                >
                  {sections.map(sec =>
                    <div key={sec.key}>
                      <ListSubheader style={styles.subheader}>{sec.name}</ListSubheader>
                      {categories.filter(c => c.parent === sec.key).map(c =>
                        <MenuItem key={c.key} selected={!!data.includes(c.name)} onClick={() => this.onChange()({target: {value: c.name}})}>{c.name}</MenuItem>
                      )}
                    </div>
                  )}
                </Menu>
              </div>
            : null}
          </div>
        </FormControl>
        <Dialog open={this.state.serviceSelector} onClose={() => this.setState({serviceSelector: false})}>
          <ServiceSelectorDetail selected={data} onSelect={this.onSelectService} services={services} multiple={type === 'multiSelect' || type === 'service'} />
        </Dialog>
      </div>
    )
  }
}


const activeCondition = [{
  name: 'lastAccessedAt',
  label: '最終ログイン日',
  type: 'dateRange',
  data: [moment().subtract(1, 'month').format('YYYY-MM-DD')],
}]

@connect(
  state => ({
    conditions: state.searchCondition.conditions,
  }),
  { loadAllCondition, createCondition, removeCondition, unloadCondition }
)
@withStyles(theme => ({
  filter: {
    width: 250,
    background: '#fff',
    overflowX: 'scroll',
    borderColor: theme.palette.grey[300],
    borderStyle: 'solid',
    borderWidth: '0px 1px 0px 0px',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      borderWidth: '0px 0px 1px 0px',
    },
  },
  conditions: {
    padding: 5,
    maxHeight: 200,
    overflowY: 'scroll',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  },
  chip: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0 0 5px 0',
    [theme.breakpoints.down('xs')]: {
      margin: '0 5px 5px 0',
    },
  },
  ellipsis: {
    maxWidth: 300,
    display: 'inline',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}), {withTheme: true})
export default class Filter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      conds: [],
    }
  }

  componentDidMount() {
    this.props.loadAllCondition(this.props.type)
    this.setState({
      conds: this.props.initialValues || [],
    })
  }

  componentWillUnmount() {
    this.props.unloadCondition()
  }

  onChange = ({target, newData}) => {
    const { conds } = this.state
    const index = conds.findIndex(c => c.name === target.name)
    if (index > -1) conds[index].data = newData

    this.setState({conds})
  }

  addFilter = (name) => {
    const { type } = this.props
    const { conds } = this.state
    conds.push({name, ...searchConditions[type][name], data: []})
    this.setState({conds, addFilter: null})
  }

  deleteFilter = data => {
    const { conds } = this.state
    const index = conds.findIndex(e => e.name === data.name)
    if (index > -1) conds.splice(index, 1)

    this.setState({conds})
  }

  usePastCondition = (conds) => {
    this.setState({conds})
  }

  handleSubmit = () => {
    const { conds } = this.state
    this.props.onSubmit(conds)
  }

  saveCondition = () => {
    const { condName, conds } = this.state
    this.props.createCondition({conditions: conds, name: condName, type: this.props.type})
    this.setState({save: false})
  }

  removeCondition = id => {
    this.props.removeCondition(id)
  }

  render() {
    const { conditions, theme, classes, width, style, withConditions, type } = this.props
    const { addFilter, condName, showFilter, conds } = this.state
    const { grey } = theme.palette

    const styles = {
      cond: {
        marginBottom: 5,
        borderRadius: 3,
        padding: 5,
        background: grey[300],
      },
    }

    const condNames = conds.map(c => c.name)

    return (
      <div className={classes.filter} style={{display: (width !== 'xs' || showFilter) ? 'block' : 'none', ...style}}>
        {withConditions &&
          <div className={classes.conditions}>
            検索条件
            {type === 'pro' &&
              <>
                <Chip className={classes.chip} label='全て' onClick={() => this.usePastCondition([])} />
                <Chip className={classes.chip} label='1ヶ月以内にログイン' onClick={() => this.usePastCondition(activeCondition)} />
              </>
            }
            {conditions.map(cond =>
              <Chip
                key={cond.id}
                className={classes.chip}
                label={cond.name}
                onClick={() => this.usePastCondition(cond.conditions)}
                onDelete={() => this.removeCondition(cond.id)}
                classes={{label: classes.ellipsis}}
              />
            )}
          </div>
        }
        <div style={{padding: 5}}>
          {conds.map(cond => (
            <div key={cond.name} style={styles.cond}>
              <StatusFilterGenerator
                selected
                target={{...searchConditions[type][cond.name], ...cond}}
                onChange={this.onChange}
                onClose={() => this.deleteFilter(cond)}
              />
            </div>
          ))}
          <Button fullWidth size='small' onClick={e => this.setState({addFilter: e.currentTarget})}>
            <AddIcon />
            検索条件追加
          </Button>
          <Menu
            open={!!addFilter}
            anchorEl={this.state.addFilter}
            onClose={() => this.setState({addFilter: null})}
          >
            {Object.keys(searchConditions[type]).filter(name => !condNames.includes(name)).map(name =>
              <ListItem
                dense
                button
                key={name}
                onClick={() => this.addFilter(name)}
              >
                {searchConditions[type][name].label}
              </ListItem>
            )}
          </Menu>
          <div style={{display: 'flex', paddingTop: 5}}>
            <Button fullWidth size='small' color='primary' variant='contained' onClick={() => this.handleSubmit()}>
              <SearchIcon />
              検索
            </Button>
            <div style={{width: withConditions ? 10 : 0}} />
            {withConditions && <Button fullWidth size='small' color='secondary' disabled={!conds.length} onClick={() => this.setState({save: true})}>保存</Button>}
          </div>
        </div>
        <Dialog open={!!this.state.save} onClose={() => this.setState({save: false})}>
          <DialogTitle>検索条件を保存しますか？</DialogTitle>
          <DialogContent><TextField style={{width: 500}} label='タイトル' onChange={e => this.setState({condName: e.target.value})} /></DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({save: false})}>キャンセル</Button>
            <Button variant='contained' disabled={!(condName && condName.length)} color='primary' onClick={this.saveCondition}>保存する</Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}
