import React from 'react'
import qs from 'qs'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { Table, TableBody, Button, IconButton, MenuItem, Paper } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'
import AddIcon from '@material-ui/icons/Add'
import AddCircleIcon from '@material-ui/icons/AddCircle'

import { update } from 'tools/modules/request'
import { open as openSnack } from 'modules/snack'
import renderCheckbox from 'components/form/renderCheckbox'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderSelect from 'components/form/renderSelect'
import CustomRow from 'components/CustomRow'
import FileUploader from 'components/FileUploader'
import Notice from 'components/Notice'
import { imageSizes, fileMime } from '@smooosy/config'

@withTheme
@connect(
  state => {
    const request = {...state.request.request}
    // 修正対象のfieldのみ渡す
    return {
      initialValues: {
        point: request.point,
        distance: request.distance,
        description: request.description,
        phone: request.phone,
      },
    }
  },
  { update, openSnack }
)
@reduxForm({
  form: 'requestEdit',
})
export default class RequestInfoForEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  createLog = (values) => {
    const { initialValues } = this.props
    const editLog = []
    for (let key in values) {
      if (key === 'description') {
        for (let idx in values.description) {
          const preAnswers = initialValues.description[idx].answers
          const postAnswers = values.description[idx].answers
          const type = values.description[idx].type
          const tmp = {}
          if (['multiple', 'singular', 'price'].includes(type)) {
            tmp.before = preAnswers.filter(ans => ans.checked).map(ans => ans.text).join(', ') || 'none'
            tmp.after = postAnswers.filter(ans => ans.checked).map(ans => ans.text).join(', ') || 'none'
          } else if (type === 'image') {
            tmp.before = preAnswers.length + '枚の写真'
            tmp.after = postAnswers.length + '枚の写真'
          } else {
            tmp.before = preAnswers.map(ans => ans.text).filter(t => t).join(', ') || 'none'
            tmp.after = postAnswers.map(ans => ans.text).filter(t => t).join(', ') || 'none'
          }
          if (tmp.before !== tmp.after) {
            editLog.push({
              editType: 'description',
              description: values.description[idx].label,
              ...tmp,
            })
          }
        }
      } else if (values[key] !== initialValues[key]) {
        editLog.push({
          editType: key,
          before: initialValues[key] || 'none',
          after: values[key] || 'none',
        })
      }
    }
    return editLog
  }

  updateRequest = (values) => {
    const editLog = this.createLog(values)
    this.props.update({
      id: this.props.request.id,
      updatedAt: this.props.request.updatedAt,
      description: values.description,
      phone: values.phone,
      point: values.point,
      distance: values.distance,
      editLog,
    })
    .then(() => this.props.edit())
    .catch(err => {
      const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
      this.props.openSnack(msg)
    })
  }

  clickUploadImage = targetInput => {
    // 更新対象のinputをstateに保持しておく
    this.setState({targetInput})
    this.upload.click()
  }

  handleFile = ({data}) => {
    // redux-formのonChangeを呼ぶ
    const input = this.state.targetInput
    input && input.onChange(data.imageUrl)
    this.setState({fileError: false})
  }

  render() {
    const { request, handleSubmit, theme } = this.props

    const { common, grey } = theme.palette

    const styles = {
      root: {
        position: 'relative',
        background: common.white,
        padding: 10,
      },
      map: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: request.loc ? 250 : 110,
      },
      title: {
        padding: 10,
        background: grey[100],
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }

    // singular, multiple 向け
    const renderCheck = ({fields, desc}) => (
      <div>
        {fields.map((f, j) =>
          <div key={j} style={{display: 'flex'}}>
            <Field
              name={`${f}.checked`}
              component={renderCheckbox}
              label={desc.answers[j].text}
              style={{padding: 0, border: 'none'}}
            />
            <div style={{flex: 1}} />
            <IconButton onClick={() => fields.remove(j)}>
              <CloseIcon />
            </IconButton>
          </div>
        )}
      </div>
    )

    // その他向け
    const renderAnswersFields = ({fields, desc}) => (
      <div>
        {fields.map((f, j) =>
          <div key={j} style={{display: 'flex', background: grey[100], padding: 10, marginBottom: 10}}>
            <Field name={`${f}.text`} style={{flex: 1}} component={renderTextArea} />
            <Field name={`${f}.image`} component={({input}) =>
              (input.value || desc.type === 'image') &&
                <Paper style={{position: 'relative', width: 80, height: 80}}>
                  {input.value && <img src={input.value + imageSizes.c80} style={{width: '100%', height: '100%'}} />}
                  <AddCircleIcon
                    style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, cursor: 'ponter'}}
                    onClick={() => this.clickUploadImage(input)}
                  />
                </Paper>
            } />
            <IconButton onClick={() => fields.remove(j)}>
              <CloseIcon />
            </IconButton>
          </div>
        )}
        <Button onClick={() => fields.push({})}>
          <AddIcon />
          追加する
        </Button>
      </div>
    )

    const descRow = (
      <FieldArray name='description' component={({fields}) =>
        <Table>
          <TableBody>
            {fields.map((field, i) =>
              <CustomRow key={i} title={request.description[i].label}>
                <FieldArray
                  name={`${field}.answers`}
                  desc={request.description[i]}
                  component={['singular', 'multiple', 'location', 'price'].includes(request.description[i].type) ? renderCheck : renderAnswersFields}
                />
              </CustomRow>
            )}
          </TableBody>
        </Table>
      } />
    )

    return (
      <div style={styles.root}>
        <form onSubmit={handleSubmit(this.updateRequest)}>
          <Table>
            <TableBody>
              <CustomRow title='サービス名'>
                {request.service.name}
              </CustomRow>
              <CustomRow title ='電話番号'>
                <Field name='phone' component={renderTextInput} type='tel' />
              </CustomRow>
              {request.sent.length === 0 && request.meets.length === 0 &&
                <CustomRow title='見積もりポイント'>
                  <Field name='point' component={renderTextInput} type='number' />
                </CustomRow>
              }
              <CustomRow title='マッチ距離'>
                <Field name='distance' label='km' component={renderSelect}>
                  <MenuItem value={30000}>30km</MenuItem>
                  <MenuItem value={50000}>50km</MenuItem>
                  <MenuItem value={80000}>80km</MenuItem>
                  <MenuItem value={100000}>100km</MenuItem>
                  <MenuItem value={120000}>120km</MenuItem>
                  <MenuItem value={150000}>150km</MenuItem>
                  <MenuItem value={200000}>200km</MenuItem>
                  <MenuItem value={250000}>250km</MenuItem>
                  <MenuItem value={300000}>300km</MenuItem>
                  <MenuItem value={400000}>400km</MenuItem>
                  <MenuItem value={500000}>500km</MenuItem>
                  <MenuItem value={700000}>700km</MenuItem>
                  <MenuItem value={1000000}>1000km</MenuItem>
                </Field>
              </CustomRow>
            </TableBody>
          </Table>
          {descRow}
          {this.state.fileError && <Notice type='error'>{this.state.fileError}</Notice>}
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant='contained' style={{margin: '15px 10px 0 0'}} type='submit' color='secondary'>更新</Button>
          </div>
        </form>
        <FileUploader
          endPoint={({type}) => `/api/requests/getSignedUrl?${qs.stringify(type)}`}
          acceptance={[fileMime.types.image.all]}
          handleFile={this.handleFile}
          onError={fileError => this.setState({fileError})}
        >
          <div ref={e => this.upload = e} />
        </FileUploader>
      </div>
    )
  }
}
