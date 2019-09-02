import React from 'react'
import { reduxForm, Field } from 'redux-form'
import {
  withWidth,
  Button,
  CircularProgress,
  MenuItem,
} from '@material-ui/core'
import renderSelect from 'components/form/renderSelect'
import renderTextArea from 'components/form/renderTextArea'
import renderTextInput from 'components/form/renderTextInput'
import renderPrice from 'components/form/renderPrice'
import { hasNGWords } from 'lib/validate'
import { zenhan } from 'lib/string'

@reduxForm({
  form: 'template',
  validate: (values) => {
    const errors = {}
    if (!values.title) {
      errors.title = '必須項目です'
    }
    if (values.priceType !== 'needMoreInfo') {
      if (!values.price) {
        errors.price = '必須項目です'
      }
    }
    if (!values.chat) {
      errors.chat = '必須項目です'
    } else if (hasNGWords(values.chat)) {
      errors.chat = 'NGワードが含まれています'
    }
    return errors
  },
})
@withWidth({withTheme: true})
export default class extends React.Component {
  state = {
  }

  componentDidMount() {
    if (this.props.initialValues.priceType === 'needMoreInfo') {
      this.setState({needMoreInfo: true})
    }
  }

  render() {
    const { handleSubmit, submitting, onSubmit, width, theme: { palette: { grey, common } } } = this.props
    const styles = {
      main: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
      },
      paper: {
        width: width === 'xs' ? '100%' : '80%',
        maxWidth: width === 'xs' ? 'initial': 640,
        padding: 20,
        margin: '20px 0',
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
      },
      title: {
        fontSize: 13,
        fontWeight: 'bold',
        color: grey[700],
        textAlign: 'left',
      },
      priceWrap: {
        textAlign: 'center',
      },
      submitButton: {
        marginTop: 16,
        height: 50,
        width: '100%',
      },
    }

    return (
      <form style={styles.main} onSubmit={handleSubmit(onSubmit)}>
        <div style={styles.paper}>
          <Field autoFocus={true} name='title' placeholder='定型文の名前' component={renderTextInput} />
          <h4 style={styles.title}>価格</h4>
          <div style={styles.priceWrap}>
            <Field name='priceType' component={renderSelect} value='fixed' onFieldChange={v => this.setState({needMoreInfo: v === 'needMoreInfo'})}>
              <MenuItem button value='fixed' >固定価格</MenuItem>
              <MenuItem button value='hourly' >時給</MenuItem>
              <MenuItem button value='needMoreInfo' >追加情報が必要</MenuItem>
            </Field>
            <Field
              name='price'
              component={renderPrice}
              disabled={this.state.needMoreInfo}
              parse={s => parseInt(zenhan(s).replace(/[^0-9]/g, ''), 10)}
              format={s => s ? s + '' : ''}
              normalize={n => Math.min(99999999, n)}
            />
            <div style={{textAlign: 'left', marginBottom: 10, fontSize: 13, color: grey[700]}}>
              ※ 税・交通費などを含めた価格を記載してください
            </div>
          </div>
          <Field name='chat' label='メッセージ' textareaStyle={{height: 200}} component={renderTextArea} />
          <div style={{textAlign: 'left', marginBottom: 10, fontSize: 13, color: grey[700]}}>
            {'{{name}}'}は自動的に依頼者の名前に変換されます
          </div>
          <Button variant='contained'
            type='submit'
            disabled={submitting}
            color='primary'
            style={styles.submitButton}
          >
            {submitting ? <CircularProgress size={20} color='secondary' /> : '更新'}
          </Button>
        </div>
      </form>
    )
  }
}
