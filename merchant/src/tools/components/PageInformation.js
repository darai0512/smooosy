import React from 'react'
import { Field } from 'redux-form'
import { AppBar, Button, IconButton, MenuItem, Toolbar } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import CloseIcon from '@material-ui/icons/Close'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import UpIcon from '@material-ui/icons/KeyboardArrowUp'
import DownIcon from '@material-ui/icons/KeyboardArrowDown'

import FileUploader from 'components/FileUploader'
import renderTextInput from 'components/form/renderTextInput'
import renderSelect from 'components/form/renderSelect'
import Editor from 'components/Editor'
import { imageSizes, fileMime } from '@smooosy/config'

@withTheme
export default class PageInformation extends React.Component {
  state = {
    selected: [],
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

  imageUrl = (index) => {
    const { fields } = this.props
    const values = fields.get(index)
    return values.image + imageSizes.column(values.column, values.ratio)
  }

  isDirty = (index) => {
    const {fields, initialValues} = this.props
    const value = fields.get(index)
    if (!initialValues) return true
    const initialValue = initialValues[index]
    if (!initialValue || !value) {
      return true
    }

    return Object.keys(value).some(key => initialValue[key] !== value[key])
  }

  render() {
    const { fields, pageInformation, theme, addImage, removeImage, selectMediaCallback, isService } = this.props
    const { selected } = this.state

    const { grey, common, secondary } = theme.palette

    const styles = {
      image: {
        position: 'relative',
      },
      imageClose: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        background: 'rgba(255, 255, 255, .5)',
      },
    }

    return (
      <div>
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {fields.map((f, index) => {
            const info = pageInformation[index] || { column: 6 }
            const dirty = this.isDirty(index)
            return (
              <div key={index} style={{width: `${100 * info.column / 12}%`, padding: 5}}>
                <div style={{padding: 5, background: dirty ? orange[100] : grey[100]}}>
                  <div style={{display: 'flex'}}>
                    <IconButton onClick={() => this.select(index)}><CheckCircleIcon style={{color: selected.includes(index) ? secondary.main : common.black}} /></IconButton>
                    <IconButton disabled={index === 0} onClick={() => fields.move(index, index - 1)}><ArrowBackIcon /></IconButton>
                    <IconButton disabled={index === fields.length - 1} onClick={() => fields.move(index, index + 1)}><ArrowForwardIcon /></IconButton>
                    <div style={{flex: 1}} />
                    <IconButton onClick={() => fields.remove(index)}><CloseIcon /></IconButton>
                  </div>
                  {info.type === 'zipbox' ?
                    <div style={{paddingBottom: 10, textAlign: 'center'}}>ZipBox</div>
                  : info.type === 'price' ?
                    <div style={{paddingBottom: 10, textAlign: 'center'}}>価格分布</div>
                  : [
                    <Field key='title' label='タイトル' name={`${f}.title`} component={renderTextInput} />,
                    <Field key='image' name={`${f}.image`} component={({input}) =>
                      <div style={styles.image}>
                        {input.value ? [
                          <img key='img' src={this.imageUrl(index)} style={{width: '100%'}} />,
                          <IconButton key='button' style={styles.imageClose} onClick={() => removeImage(index)}>
                            <CloseIcon />
                          </IconButton>,
                        ] :
                          <div style={{display: 'flex'}}>
                            <FileUploader
                              endPoint={({type}) => `${this.props.endPoint}?ext=${type.ext}&mime=${type.mime}`}
                              acceptance={[fileMime.types.image.all]}
                              handleFile={({data, type}) => addImage(data, type, index)}
                            >
                              <Button size='small' color='primary' variant='contained' component='span'>
                                画像をアップロード
                              </Button>
                            </FileUploader>
                            <Button size='small' color='primary' variant='outlined' onClick={() => selectMediaCallback(m => addImage(m, {ext: 'jpg'}, index))}>
                              プロ画像から選択
                            </Button>
                          </div>
                        }
                      </div>
                    } />,
                    fields.get(index).image &&
                      <Field key='ratio' label='画像タイプ' name={`${f}.ratio`} component={renderSelect}>
                        <MenuItem value='horizontal'>横長</MenuItem>
                        <MenuItem value='portrait'>縦長</MenuItem>
                        <MenuItem value='square'>正方形</MenuItem>
                      </Field>
                    ,
                    fields.get(index).image && <Field key='alt' label='画像alt属性' name={`${f}.alt`} component={renderTextInput} />,
                    <Field key='text' label='テキスト' name={`${f}.text`} component={Editor} ready />,
                    <Field key='column' label='幅' name={`${f}.column`} component={renderSelect}>
                      <MenuItem value={3}>1/4</MenuItem>
                      <MenuItem value={4}>1/3</MenuItem>
                      <MenuItem value={6}>1/2</MenuItem>
                      <MenuItem value={8}>2/3</MenuItem>
                      <MenuItem value={12}>1</MenuItem>
                    </Field>,
                  ]}
                </div>
              </div>
            )
          })}
        </div>
        <Button variant='contained' color='primary' onClick={() => fields.push({column: 6})}>
          追加する
        </Button>
        <Button style={{marginLeft: 10}} color='secondary' onClick={() => fields.push({type: 'zipbox', column: 12})}>
          ZipBox追加
        </Button>
        {isService &&
          <Button style={{marginLeft: 10}} color='secondary' onClick={() => fields.push({type: 'price', column: 12})}>
            Price追加
          </Button>
        }
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
