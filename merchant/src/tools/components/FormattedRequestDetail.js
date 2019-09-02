import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import { Table, TableBody, Button, IconButton, RadioGroup, Radio, Checkbox, FormControlLabel, FormLabel } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationClose from '@material-ui/icons/Close'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import CustomRow from 'components/CustomRow'
import { load, update, copy, remove } from 'tools/modules/formattedRequest'
import { open as openSnack } from 'tools/modules/snack'
import { withTheme } from '@material-ui/core/styles'

import { imageSizes } from '@smooosy/config'

@reduxForm({
  form: 'requestEdit',
  initialValues: {},
  validate: values => {
    const errors = {}
    if (values.public && !values.title) {
      errors.title = '公開するのに必須です'
    }
    return errors
  },
})
@connect(
  state => ({
    formattedRequest: state.formattedRequest.formattedRequest,
  }),
  { load, update, copy, remove, openSnack }
)
@withTheme
export default class FormattedRequestDetail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.load(this.props.match.params.id).then(({formattedRequest}) => {
      this.props.initialize(formattedRequest)
    })
  }

  updateRequest = (values) => {
    values = Object.assign({}, values)
    delete values.service
    this.props.update(values)
      .then(() => this.props.openSnack('保存しました'))
  }

  recopy = () => {
    const id = this.props.formattedRequest.request
    this.props.copy(id).then(({formattedRequest}) => {
      this.props.initialize(formattedRequest)
      this.props.openSnack('保存しました')
    })
  }

  remove = () => {
    const id = this.props.formattedRequest.id
    this.props.remove(id).then(() => this.props.history.push('/formattedRequests'))
  }

  render() {
    const { formattedRequest, handleSubmit, invalid, theme } = this.props
    const { common, grey } = theme.palette

    if (!formattedRequest) return null

    const styles = {
      root: {
        position: 'relative',
        minHeight: '100%',
        background: common.white,
        paddingBottom: 20,
      },
    }

    const renderAnswersFields = ({fields}) => (
      <div>
        {fields.map((f, j) =>
          <div key={j} style={{display: 'flex', background: grey[100], padding: 10, marginBottom: 10}}>
            <Field name={`${f}.text`} style={{flex: 1}} component={renderTextArea} />
            <Field name={`${f}.image`} component={({input}) =>
              input.value ?
                <div style={{position: 'relative'}}>
                  <img src={input.value + imageSizes.c80} style={{width: 80, height: 80}} />
                  <IconButton
                    style={{position: 'absolute', top: 0, right: 0}}
                    onClick={() => input.onChange('')}
                  >
                    <NavigationClose />
                  </IconButton>
                </div>
              : null
            } />
            <IconButton onClick={() => fields.remove(j)}>
              <NavigationClose />
            </IconButton>
          </div>
        )}
      </div>
    )


    const renderChatsFields = ({fields}) => (
      <div>
        {fields.map((chat, j) =>
          <div key={j} style={{display: 'flex'}}>
            <Field name={`${chat}.pro`} component={({input}) => {
              if (input.value) {
                return <FormLabel style={{width: 115}}>プロ</FormLabel>
              }
              return <FormLabel style={{width: 115}}>依頼者</FormLabel>

            }} />
            <div style={{flex: 1}}>
              <Field name={`${chat}.text`} component={renderTextArea} textareaStyle={{height: 200}} />
            </div>
            <IconButton onClick={() => fields.remove(j)}>
              <NavigationClose />
            </IconButton>
          </div>
        )}
      </div>
    )

    return (
      <div style={styles.root}>
        <div style={{display: 'flex', padding: 20}}>
          <div style={{flex: 1}}>
            <Link to='/formattedRequests'>
              <Button>
                <NavigationChevronLeft />
                戻る
              </Button>
            </Link>
          </div>
          <h3>掲載用の依頼を編集する</h3>
          <div style={{flex: 1}} />
        </div>
        <form onSubmit={handleSubmit(this.updateRequest)} style={{borderTop: `1px solid ${grey[300]}`}}>
          <Table>
            <TableBody>
              <CustomRow title='公開ページ'>
                {formattedRequest.public ?
                  <a href={`/services/${formattedRequest.service.key}/requests/${formattedRequest.id}`} target='_blank' rel='noopener noreferrer'>
                    {formattedRequest.searchTitle}
                  </a>
                :
                  <div>{formattedRequest.searchTitle}</div>
                }
              </CustomRow>
              <CustomRow title='依頼者'>
                {formattedRequest.customer}様
              </CustomRow>
              <CustomRow title='タイトル'>
                <Field placeholder='{{locationでの}}XXが{{price}}' name='title' component={renderTextInput} />
              </CustomRow>
              <CustomRow title='公開フラグ'>
                <Field name='public' component={({input}) =>

                  <FormControlLabel
                    control={
                      <Checkbox
                        color='primary'
                        checked={!!input.value}
                        onChange={() => input.onChange(!input.value)}
                      />
                    }
                    label='公開する'
                  />
                } />
              </CustomRow>
              <CustomRow title='サービス名'>{formattedRequest.service.name}</CustomRow>
            </TableBody>
          </Table>
          <FieldArray name='description' component={({fields}) =>
            <Table>
              <TableBody>
                {fields.map((field, i) =>
                  <CustomRow key={i} title={
                    <Field name={`${field}.label`} component={renderTextInput} />
                  }>
                    <div style={{display: 'flex'}}>
                      <div style={{flex: 1}}>
                        <FieldArray name={`${field}.answers`} component={renderAnswersFields} index={i} />
                      </div>
                      <IconButton onClick={() => fields.remove(i)}>
                        <NavigationClose />
                      </IconButton>
                    </div>
                  </CustomRow>
                )}
              </TableBody>
            </Table>
          } />
          <div style={{padding: 10, textAlign: 'center', borderBottom: `1px solid ${grey[300]}`, borderTop: `1px solid ${grey[300]}`}}>
            ※プロを「PPP」、依頼者を「UUU」に置き換えてください。
          </div>
          <FieldArray name='meets' component={({fields}) =>
            <Table>
              <TableBody>
                {fields.map((field, i) =>
                  <CustomRow key={i} title={`応募その${i+1}`}>
                    <div style={{display: 'flex'}}>
                      <div style={{flex: 1}}>
                        <h3 style={{padding: '10px 0'}}>掲載フラグ</h3>
                        <Field name={`${field}.feature`} component={({input}) =>

                          <FormControlLabel
                            control={
                              <Checkbox
                                color='primary'
                                checked={!!input.value}
                                onChange={() => input.onChange(!input.value)}
                              />
                            }
                            label='チャットを全て掲載する'
                          />
                        } />
                        <h3 style={{padding: '10px 0'}}>見積もり金額</h3>
                        <div style={{display: 'flex'}}>

                          <Field name={`${field}.priceType`} component={({input}) =>
                            <RadioGroup style={{width: 115}}  value={input.value} onChange={(e, value) => input.onChange(value)}>
                              <FormControlLabel value='fixed' control={<Radio color='primary' style={{padding: 10}} />} label='固定価格' />
                              <FormControlLabel value='hourly' control={<Radio color='primary' style={{padding: 10}} />} label='時給' />
                            </RadioGroup>
                          } />
                          <Field name={`${field}.price`} component={renderTextInput} />
                        </div>
                        <h3 style={{padding: '10px 0'}}>チャット</h3>
                        <FieldArray name={`${field}.chats`} component={renderChatsFields} />
                      </div>
                      <IconButton onClick={() => fields.remove(i)}>
                        <NavigationClose />
                      </IconButton>
                    </div>
                  </CustomRow>
                )}
              </TableBody>
            </Table>
          } />
          <div style={{display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${grey[300]}`}}>
            <div>
              <Button variant='contained' style={{margin: 15}} onClick={() => this.remove()}>削除</Button>
              <Button variant='contained' style={{margin: 15}} onClick={() => this.recopy()}>再コピー</Button>
            </div>
            <Button variant='contained' style={{margin: 15}} type='submit' color='secondary' disabled={invalid}>更新</Button>
          </div>
        </form>
      </div>
    )
  }
}
