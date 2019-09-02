import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Button, CircularProgress, TextField } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import { payment } from '@smooosy/config'
import Payment from 'payment'
import CreditCards from 'react-credit-cards'
import 'react-credit-cards/lib/styles-compiled.css'

const thisYear = new Date().getFullYear()

const formatMM = month => {
  return ('0' + month).slice(-2)
}

const convertValues = (values, joinExpiry) => {
  let res = {
    number: values.number.replace(/ /g, ''),
    name: values.name.toUpperCase(),
    exp_month: values.exp_month,
    exp_year: values.exp_year,
    cvc: values.cvc,
  }

  if (joinExpiry) {
    res.expiry = [res.exp_month, res.exp_year].join('/')
    delete res.exp_month
    delete res.exp_year
  }

  return res
}

@withWidth()
@withTheme
@reduxForm({
  form: 'creditcard',
  initialValues: {
    number: '',
    name: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
  },
  validate: values => {
    const errors = {}
    if (!values.number) {
      errors.number = '必須項目です'
    } else if (!Payment.fns.validateCardNumber(values.number)) {
      errors.number = '存在しないカードです'
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (!values.exp_month || !values.exp_year) {
      errors._error = '必須項目です'
    } else if (!Payment.fns.validateCardExpiry([values.exp_month, values.exp_year].join('/'))) {
      errors._error = '不正な有効期限です'
    }
    if (!values.cvc) {
      errors.cvc = '必須項目です'
    } else if (!Payment.fns.validateCardCVC(values.cvc)) {
      errors.cvc = '不正なCVCです'
    }
    return errors
  },
})
@connect(
  state => ({
    values: convertValues(state.form.creditcard.values, true),
  }),
)
export default class CreditCardInput extends React.Component {
  static defaultProps = {
    label: '購入する',
    onCreated: () => {},
  }

  state = {}

  componentDidMount() {
    if (!window.Payjp) {
      const script = document.createElement('script')
      script.setAttribute('src', payment.payjp.script)
      document.body.appendChild(script)
    }
    Payment.formatCardNumber(document.querySelector('.cc-number'))
    Payment.formatCardCVC(document.querySelector('.cc-cvc'))
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
    this.timer = null
  }

  onFocus = (e) => {
    this.setState({
      focused: e.target.name,
    })
  }

  onFocusExpiry = () => {
    this.setState({
      focusExpiry: true,
      focused: 'expiry',
    })
    return true
  }

  submitWrapper = e => {
    // prevent submitting the parent form if this from is nested
    // see: https://github.com/erikras/redux-form/issues/3701#issuecomment-353188221
    e.preventDefault()
    e.stopPropagation()
    return this.props.handleSubmit(this.onSubmit)(e)
  }

  onSubmit = values => {
    this.setState({
      submitting: true,
      submitError: false,
    })
    const card = convertValues(values)
    window.Payjp.setPublicKey(payment.payjp.public)

    window.Payjp.createToken(card, (status, res) => {
      clearTimeout(this.timer)
      this.timer = null
      if (status !== 200 || res.error) {
        const submitError = {
          client_error: '決済リクエストが正しくありません。解決しない場合はinfo@smooosy.bizにご連絡ください。',
          card_error: 'カード情報の不備もしくは期限切れです。カード情報を更新するか別のカードをお試しください。',
          server_error: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。',
        }[res.error.type] || '不明なエラーです。'
        this.setState({
          submitting: false,
          submitError,
        })
      } else if (this.state.submitting) {
        this.props.onCreated(res)
      }
    })

    // 10秒たってもtokenが帰ってこない場合、エラー表示にする
    this.timer = setTimeout(() => {
      this.setState({
        submitting: false,
        submitError: '決済システムの障害もしくはネットワークのエラーです。時間をおいて再度お試しください。',
      })
    }, 10000)
  }

  render() {
    const { label, values, error, dirty, width, theme } = this.props
    const { submitting, submitError, focusExpiry } = this.state
    const { red, grey, blue } = theme.palette

    const styles = {
      root: {
        position: 'relative',
      },
      mask: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, .5)',
        zIndex: 100,
      },
      brand: {
        width: 40,
        margin: '0 5px 5px 0',
      },
      row: {
        display: 'flex',
        flexDirection: width === 'xs' ? 'column' : 'row',
        alignItems: 'center',
      },
      inputs: {
        flex: 1,
        maxWidth: 290,
        margin: width === 'xs' ? '10px 0 0' : '0 0 0 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      },
      expiry: {
        display: 'flex',
        alignItems: 'center',
        borderStyle: 'solid',
        borderWidth: '0 0 1px 0',
        borderColor: dirty && error ? red[500] : focusExpiry ? blue.B200 : grey[300],
      },
      month: {
        height: 22,
        width: 40,
        paddingLeft: 20,
      },
      year: {
        height: 22,
        width: 60,
        paddingLeft: 20,
      },
      error: {
        margin: '5px 0',
        color: red[500],
        fontSize: 12,
        fontWeight: 'bold',
        width: width === 'xs' ? 268 : 556,
      },
    }

    return (
      <div style={styles.root}>
        <style>{`
          .rccs {
            margin: 0;
          }
          .rccs, .rccs__card {
            max-width: 100%;
          }
          .rccs__card--flipped .rccs__card--back {
            -webkit-backface-visibility: visible;
            backface-visibility: visible;
          }
        `}</style>
        {submitting && <div style={styles.mask}><CircularProgress /></div>}
        {Object.values(payment.cardBrandImages).map((image, i) =>
          <img key={i} src={image} style={styles.brand} />
        )}
        <form onSubmit={this.submitWrapper}>
          <div style={styles.row}>
            <CreditCards
              {...values}
              focused={this.state.focused}
              locale={{valid: '有効期限'}}
              placeholders={{name: 'TARO YAMADA'}}
              acceptedCards={['visa', 'mastercard', 'jcb', 'amex', 'discover']}
            />
            <div style={styles.inputs}>
              <Field
                autoFocus
                component={CreditInput}
                label='カード'
                type='tel'
                name='number'
                inputClass='cc-number'
                pattern='([0-9]| )*'
                placeholder='1234 5678 9012 3456'
                customFocus={this.onFocus}
                autoComplete='cc-number'
              />
              <Field
                component={CreditInput}
                label='名前'
                type='text'
                name='name'
                inputClass='cc-name'
                placeholder='TARO YAMADA'
                customFocus={this.onFocus}
                inputStyle={{textTransform: 'uppercase'}}
                autoComplete='cc-name'
              />
              <div style={styles.expiry}>
                <div style={{flex: 1, fontSize: 13, fontWeight: 'bold', color: grey[900]}}>
                  有効期限
                </div>
                <Field
                  name='exp_month'
                  component={SelectExp}
                  style={styles.month}
                  customFocus={() => this.setState({focused: 'expiry'})}
                >
                  <option value=''>月</option>
                  {[...Array(12)].map((_, i) =>
                    <option key={i} value={formatMM(i + 1)}>{formatMM(i + 1)}</option>
                  )}
                </Field>
                <div style={{width: 10}}>{'/'}</div>
                <Field
                  name='exp_year'
                  component={SelectExp}
                  style={styles.year}
                  customFocus={() => this.setState({focused: 'expiry'})}
                >
                  <option value=''>年</option>
                  {[...Array(20)].map((_, i) =>
                    <option key={i} value={i + thisYear}>{i + thisYear}</option>
                  )}
                </Field>
              </div>
              <div style={{height: 18, fontSize: 12, color: red[500]}}>
                {dirty && error && <p>{error}</p>}
              </div>
              <Field
                component={CreditInput}
                label='セキュリティコード'
                labelWidth={120}
                type='tel'
                name='cvc'
                inputClass='cc-cvc'
                placeholder='•••'
                customFocus={this.onFocus}
                autoComplete='cc-csc'
              />
            </div>
          </div>
          <div style={{padding: '5px 0', fontSize: 12, color: grey[700]}}>
            ※ カード情報は弊社システムには一切保管されません
          </div>
          {submitError && <div style={styles.error}>{submitError}</div>}
          <Button variant='contained' color='primary' type='submit' style={{width: '100%'}} disabled={submitting}>
            {label}
          </Button>
        </form>
      </div>
    )
  }
}

@withTheme
class CreditInput extends React.PureComponent {
  static defaultProps = {
    labelWidth: 40,
    customFocus: () => {},
    onBlur: () => {},
  }

  state = {}

  onFocus = e => {
    this.setState({focus: true})
    this.props.customFocus(e)
  }

  onBlur = e => {
    this.setState({focus: false})
    this.props.onBlur(e)
  }

  render() {
    const {label, labelWidth, inputStyle, inputClass, input, meta, classes, theme, ...custom} = this.props
    const { focus } = this.state
    const err = meta.touched && meta.error
    const ref = input.name
    const className = inputClass || 'cc-input'

    const { common, grey, red, blue } = theme.palette

    const styles = {
      root: {
        display: 'flex',
        alignItems: 'center',
        borderWidth: '0 0 1px',
        borderStyle: 'solid',
        borderColor: err ? red[500] : focus ? blue.B200 : grey[300],
      },
      label: {
        width: labelWidth,
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 'bold',
        color: grey[900],
      },
      input: {
        flex: 1,
        outline: 0,
        height: 35,
        padding: '0px 10px',
        fontSize: 16,
        appearance: 'none',
        display: 'inline-block',
        border: 0,
        color: common.black,
        verticalAlign: 'middle',
        ...(inputStyle || {}),
      },
    }

    return (
      <div>
        <label style={styles.root}>
          <div style={styles.label}>{label}</div>
          <input
            className={className}
            ref={ref}
            {...input}
            {...custom}
            style={styles.input}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </label>
        <div style={{height: 18, fontSize: 12, color: red[500]}}>
          {err && <p>{err}</p>}
        </div>
      </div>
    )
  }
}

const SelectExp = ({input, customFocus, style, children}) => (
  <TextField
    select
    value={input.value}
    onChange={input.onChange}
    onFocus={customFocus}
    InputProps={{disableUnderline: true}}
    SelectProps={{native: true}}
    inputProps={{
      name: input.name,
      value: input.value,
      className: 'cc-exp-month',
      autoComplete: 'cc-exp-month',
      style,
    }}
  >
    {children}
  </TextField>
)
