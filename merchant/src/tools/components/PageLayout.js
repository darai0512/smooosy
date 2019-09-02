import React from 'react'
import { AppBar, Button, IconButton, Toolbar, Checkbox, FormControlLabel } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import CloseIcon from '@material-ui/icons/Close'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import UpIcon from '@material-ui/icons/KeyboardArrowUp'
import DownIcon from '@material-ui/icons/KeyboardArrowDown'

@withTheme
export default class PageLayout extends React.Component {
  components = []

  state = {
    selected: [],
  }

  constructor(props) {
    super(props)
    const { type, isService } = this.props

    this.components.push({
      type: 'pageDescription',
      name: 'サービス説明',
      column: 12,
    })
    this.components.push({
      type: 'whatIs',
      name: 'SMOOOSYが選ばれる理由',
      column: 12,
    })
    this.components.push({
      type: 'pickupProfiles',
      name: '○選',
      column: 12,
    })
    this.components.push({
      type: 'pickupProAnswers',
      name: 'よくある質問',
      column: 12,
    })
    this.components.push({
      type: 'requestExample',
      name: '実際の依頼例',
      column: 12,
    })
    if (type === 'top') {
      this.components.push({
        type: 'pageInformation',
        name: `${isService ? 'SP' : 'CP'}コンテンツ`,
        column: 12,
      })
    }
    if (isService) {
      this.components.push({
        type: 'proMedia',
        name: 'プロメディア',
        column: 12,
      })
    }
  }

  add = component => {
    const { fields } = this.props
    fields.push({
      type: component.type,
      column: component.column,
      options: {zipbox: false},
    })
  }

  select = index => {
    let selected = this.state.selected
    selected.push(index)
    const min = Math.min(...selected)
    const max = Math.max(...selected)
    selected = []
    for (let i = min; i <= max; i++) {
      selected.push(i)
    }
    this.setState({selected})
  }

  up = fields => {
    let selected = this.state.selected
    const min = Math.min(...selected)
    const max = Math.max(...selected)
    if (min === 0) return

    fields.move(min - 1, max)
    selected = []
    for (let i = min - 1; i <= max - 1; i++) {
      selected.push(i)
    }
    this.setState({selected})
  }

  down = fields => {
    let selected = this.state.selected
    const min = Math.min(...selected)
    const max = Math.max(...selected)
    if (max === fields.length - 1) return

    fields.move(max + 1, min)
    selected = []
    for (let i = min + 1; i <= max + 1; i++) {
      selected.push(i)
    }
    this.setState({selected})
  }

  optionChange = (field, value) => {
    field.options = value
    this.setState({})
  }

  isDirty = (index) => {
    const { fields, initialValues } = this.props
    const value = fields.get(index)
    if (!initialValues) return true
    const initialValue = initialValues[index]
    if (!initialValue || !value) {
      return true
    }

    return Object.keys(value).some(key => initialValue[key] !== value[key])
  }

  render() {
    const { fields, isService, theme } = this.props
    const { selected } = this.state

    const { grey, common, secondary } = theme.palette

    return (
      <div>
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {fields.map((f, index) => {
            const field = fields.get(index)
            const dirty = this.isDirty(index)
            const component = this.components.find(m => m.type === field.type)
            return (
              <div key={index} style={{width: `${100 * field.column / 12}%`, padding: 5}}>
                <div style={{padding: 5, background: dirty ? orange[100] : grey[100]}}>
                  <div style={{display: 'flex'}}>
                    <IconButton onClick={() => this.select(index)}><CheckCircleIcon style={{color: selected.includes(index) ? secondary.main : common.black}} /></IconButton>
                    <IconButton disabled={index === 0} onClick={() => fields.move(index, index - 1)}><ArrowBackIcon /></IconButton>
                    <IconButton disabled={index === fields.length - 1} onClick={() => fields.move(index, index + 1)}><ArrowForwardIcon /></IconButton>
                    <div style={{flex: 1}} />
                    <IconButton onClick={() => fields.remove(index)}><CloseIcon /></IconButton>
                  </div>
                  {component &&
                    <div style={{paddingBottom: 10, textAlign: 'center'}}>
                      <div>{component.name}</div>
                      {component.type !== 'pageInformation' &&
                        <>
                          {isService &&
                            <>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={(field.options || {}).price}
                                    onChange={(e) => this.optionChange(field, {...field.options, price: e.target.checked})} />
                                }
                                label='価格も表示'
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={(field.options || {}).pickupMedia}
                                    onChange={(e) => this.optionChange(field, {...field.options, pickupMedia: e.target.checked})} />
                                }
                                label='サービス画像も表示'
                              />
                            </>
                          }
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={(field.options || {}).zipbox}
                                onChange={(e) => this.optionChange(field, {...field.options, zipbox: e.target.checked})} />
                            }
                            label='ZipBoxも表示'
                          />
                        </>
                      }
                    </div>
                  }
                </div>
              </div>
            )
          })}
        </div>
        {this.components.map(component => (
          <Button key={component.type} style={{marginLeft: 10}} variant='outlined' color='primary' onClick={() => this.add(component)}>
            {component.name}
          </Button>
        ))}
        {selected.length > 0 &&
          <AppBar position='fixed' color='secondary' style={{left: 240, width: 'auto'}}>
            <Toolbar>
              <h3>{selected.length}個選択中</h3>
              <IconButton onClick={() => this.up(fields)}><UpIcon style={{color: common.white}} /></IconButton>
              <IconButton onClick={() => this.down(fields)}><DownIcon style={{color: common.white}} /></IconButton>
              <div style={{flex: 1}} />
              <IconButton onClick={() => this.setState({selected: []})}><CloseIcon style={{color: common.white}} /></IconButton>
            </Toolbar>
          </AppBar>
        }
      </div>
    )
  }
}
