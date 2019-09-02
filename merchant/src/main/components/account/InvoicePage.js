import React from 'react'
import moment from 'moment'
import qs from 'qs'
import { Field, FieldArray, FormSection, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, TextField, FormControlLabel, Switch } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import { red } from '@material-ui/core/colors'
import AddIcon from '@material-ui/icons/AddCircleOutline'
import CloseIcon from '@material-ui/icons/Close'
import withWidth from '@material-ui/core/withWidth'

import { withApiClient } from 'contexts/apiClient'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import renderTextInput from 'components/form/renderTextInput'
import renderSelect from 'components/form/renderSelect'
import { loadForPro as loadMeet, accounting } from 'modules/meet'
import { create as createChat } from 'modules/chat'
import { open as openSnack, close as closeSnack } from 'modules/snack'

import platform from 'platform'

const isIEorEdge = /IE|Edge/.test(platform.name)

@withApiClient
@withRouter
@withWidth({withTheme: true})
@withStyles({
  dialog: {
    height: '100%',
  },
})
@connect(
  state => {
    const meet = state.meet.meet
    const price = meet && meet.priceType === 'fixed' ? meet.price : ''
    return {
      meet,
      initialValues: meet && meet.accounting ? meet.accounting.data : {
        name: meet && meet.customer.lastname,
        from: {
          name: meet && meet.profile.name,
          address: meet && meet.profile.address,
          zip: meet && meet.profile.zipcode,
        },
        nameSuffix: meet && meet.customer.corporation ? '御中' : '様',
        items: [{name: 'サービス提供費', price, amount: 1}],
      },
    }
  },
  { loadMeet, openSnack, accounting, closeSnack, createChat }
)
@reduxForm({
  form: 'invoice',
  enableReinitialize: true,
  validate: (values, props) => {
    if (props.pristine) return
    const errors = {}
    if (!values.name) {
      errors.name = '宛名を記入してください'
    }
    if (values.items) {
      errors.items = {}
      for (let i in values.items) {
        const item = values.items[i]
        errors.items[i] = {}
        if (!item.price || isNaN(item.price)) {
          errors.items[i].price = '数字を入力してください'
        }
        if (!item.amount || isNaN(item.amount)) {
          errors.items[i].amount = '数字を入力してください'
        }
      }
    }
    return errors
  },
})
export default class InvoicePage extends React.Component {
  state = {
    preview: false,
    confirm: false,
    transfer: true,
    message: '請求書をお送りします。',
  }

  componentDidMount() {
    this.props.loadMeet(this.props.id)
  }

  updateInvoice = (values) => {
    const { meet } = this.props
    const { transfer } = this.state
    if (!transfer) delete values.transfer
    this.props.accounting(meet.id, {data: values})
    return this.props.apiClient
      .get(`/api/meets/${meet.id}/invoice?${qs.stringify(values)}`, {responseType: 'arraybuffer'})
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const pdfURL = window.URL.createObjectURL(blob)
        this.setState({blob, pdfURL, preview: !isIEorEdge, confirm: isIEorEdge, values})
        return {pdfURL, blob}
      })
  }

  downloadInvoice = () => {
    const { pdfURL, blob, values } = this.state
    const filename = `smooosy_invoice_${moment().format('YYYY_MM_DD')}.pdf`
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename)
    } else {
      const link = document.createElement('a')
      link.href = pdfURL
      link.setAttribute('download', filename)
      link.click()
    }
    this.props.accounting(this.props.meet.id, {data: values})
  }

  sendInvoice = () => {
    const { message, blob, values } = this.state
    const { meet, apiClient, theme: {palette: {common}} } = this.props
    apiClient
      .get('/api/chats/file/getSignedUrl?ext=pdf&mime=application/pdf&type=invoice')
      .then(res => res.data)
      .then(data => {
        return apiClient
          .put(data.signedUrl, blob, {headers: {'Content-Type': 'application/pdf'}})
          .then(() => this.props.accounting(meet.id, {data: values}))
          .then(() => this.props.createChat({meetId: meet.id, files: [data.id], text: message}))
          .then(() => this.props.loadMeet(this.props.id))
      })
      .then(() => {
        this.props.openSnack('送信しました！', {
          duration: null,
          action: [
            <Button
              key='go'
              size='small'
              style={{color: red[500]}}
              onClick={() => {
                this.props.closeSnack()
                this.props.history.push(window.location.pathname.replace('/invoice', ''))
              }}
            >確認する</Button>,
            <IconButton key='close' onClick={this.props.closeSnack}><CloseIcon style={{color: common.white}} /></IconButton>,
          ],
        })
      })
      .catch(() => {
        this.props.openSnack('ファイルのアップロードに失敗しました', {anchor: {vertical: 'bottom', horizontal: 'left'}})
      })
    this.setState({preview: false, confirm: false})
  }

  onChangeMessage = e => {
    this.setState({message: e.target.value})
  }

  render() {
    const { width, theme: { palette: { common, grey } }, classes, handleSubmit, submitting, meet } = this.props
    const { preview, transfer } = this.state
    if (!meet) return null

    const styles = {
      dialog: {
        display: 'flex',
        padding: 24,
        flexDirection: width === 'xs' ? 'column' : 'row',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      paper: {
        padding: 10,
        borderRadius: 3,
        marginBottom: 20,
      },
      root: {
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
    }

    return (
      <>
        <AutohideHeaderContainer
          style={styles.root}
          header={
            <div style={styles.header}>
              <div style={{flex: 1}}>
                <Button component={Link} to={`/pros/hired/${meet.id}`} style={{minWidth: 40}} ><ChevronLeftIcon /></Button>
              </div>
              <div>請求書作成</div>
              <div style={{flex: 1}} />
            </div>
          }
        >
          <div style={{margin: width === 'xs' ? 5 : '20px auto'}}>
            <form onSubmit={handleSubmit(this.updateInvoice)}>
              <span style={{color: grey[700]}}>請求者情報</span>
              <Paper style={styles.paper}>
                <FormSection name='from'>
                  <Field name='name' label='差出人' component={renderTextInput} />
                  <div style={{display: width !== 'xs' && 'flex'}}>
                    <Field name='zip' label='郵便番号' component={renderTextInput} style={{marginRight: width !== 'xs' && 10}} />
                    <Field name='address' label='住所' component={renderTextInput} style={{flex: 1}} />
                  </div>
                  <Field name='invoiceNumber' label='領収書番号' component={renderTextInput} />
                  <FormControlLabel label='振込先情報' control={<Switch checked={transfer} onChange={(e, transfer) => this.setState({transfer})} />} />
                  <FormSection name='transfer'>
                    <div style={{display: !transfer ? 'none' : 'unset'}}>
                      <div style={{display: width !== 'xs' && 'flex', alignItems: 'center'}}>
                        <Field name='bankName' label='銀行・支店名' component={renderTextInput} style={{flex: 1, marginRight: width !== 'xs' && 10}} />
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          <Field name='bankAccountType' label='種別' component={renderSelect} style={{width: 100, marginRight: 10}}>
                            <MenuItem value='normal'>普通</MenuItem>
                            <MenuItem value='current'>当座</MenuItem>
                          </Field>
                          <Field name='bankAccount' label='口座番号' component={renderTextInput} style={{flex: 1}} />
                        </div>
                      </div>
                      <Field name='limitDate' label='払込期限' component={renderTextInput} type='date' />
                    </div>
                  </FormSection>
                </FormSection>
              </Paper>
              <span style={{color: grey[700]}}>請求情報</span>
              <Paper style={styles.paper}>
                <div style={{marginBottom: 10, display: 'flex', alignItems: 'center'}}>
                  <Field name='name' label='宛名' component={renderTextInput} style={{marginRight: 10, flex: 1}} />
                  <Field name='nameSuffix' label='敬称' component={renderSelect} style={{minWidth: 100}}>
                    {['御中', '様', '殿'].map((s, i) => <MenuItem key={i} button value={s}>{s}</MenuItem>)}
                  </Field>
                </div>
                <FieldArray name='items' label='項目名' component={renderItemField} />
              </Paper>
              <Button type='submit' variant='contained' color='primary' disabled={submitting}>
                {submitting ? '作成中・・・' : isIEorEdge ? '依頼者に送る' : 'プレビュー'}
              </Button>
            </form>
          </div>
        </AutohideHeaderContainer>
        <Dialog open={preview} onClose={() => this.setState({preview: false})} classes={isIEorEdge ? {} : {paper: classes.dialog}}>
          {!isIEorEdge &&
            <DialogContent style={{height: '100%', padding: width === 'xs' ? 10 : 20, display: 'flex', flexDirection: 'column'}}>
              <object data={this.state.pdfURL} style={{flex: 1}} width='100%' type='application/pdf' />
            </DialogContent>
          }
          <DialogActions style={{padding: width === 'xs' ? 0 : '0 10px 10px'}}>
            <Button variant='outlined' color='primary' style={{marginRight: 'auto'}} onClick={this.downloadInvoice}>ダウンロードする</Button>
            <Button
              variant='contained'
              color='primary'
              onClick={() => this.setState({confirm: true})}
            >
              依頼者に送る
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={this.state.confirm} onClose={() => this.setState({confirm: false})}>
          <DialogTitle>メッセージを入力して送信してください</DialogTitle>
          <DialogContent>
            <TextField
              label='メッセージ'
              value={this.state.message}
              onChange={this.onChangeMessage}
              style={{width: '100%'}}
            />
          </DialogContent>
          <DialogActions>
            {isIEorEdge &&
              <Button variant='outlined' color='primary' style={{marginRight: 'auto'}} onClick={this.downloadInvoice}>ダウンロードする</Button>
            }
            <Button onClick={() => this.setState({confirm: false})}>キャンセル</Button>
            <Button onClick={this.sendInvoice} variant='contained' color='primary'>送信</Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }
}

const renderItemField = withWidth({withTheme: true})(({fields, error, width, theme}) => {
  const styles = {
    section: {
      display: 'flex',
      flexDirection: width === 'xs' ? 'column' : 'row',
      background: width === 'xs' && theme.palette.grey[300],
      borderRadius: width === 'xs' && 3,
      padding: width === 'xs' && 5,
    },
    label: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.palette.grey[700],
    },
  }
  return (
    <div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        {width !== 'xs' &&
          <div style={styles.section}>
            <span style={{...styles.label, flex: width !== 'xs' && 4}}>品名</span>
            <span style={{...styles.label, flex: width !== 'xs' && 2}}>単価（税込）</span>
            <span style={{...styles.label, flex: width !== 'xs' && 1}}>数量</span>
            <div style={{width: 50}} />
          </div>
        }
        {fields.map((field, idx) =>
          <FormSection key={idx} name={field}>
            {width === 'xs' &&
              <div style={{display: 'flex', alignItems: 'center', marginTop: 10}}>
                <span style={styles.label}>項目{idx+1}</span>
                {fields.length > 1 &&
                  <IconButton style={{width: 20, height: 20, marginLeft: 'auto'}} onClick={() => fields.remove(idx)}><CloseIcon style={{width: 20, height: 20}} /></IconButton>
                }
              </div>
            }
            <div style={styles.section}>
              <Field
                name='name'
                type='text'
                component={renderTextInput}
                style={width === 'xs' ? {} : {
                  flex: 4,
                  marginRight: 10,
                }}
                label={width === 'xs' && '品目'}
              />
              <Field
                name='price'
                // こうするとモバイルで番号だけのキーボードが表示される
                type='text'
                pattern='\d*'
                component={renderTextInput}
                style={width === 'xs' ? {} : {
                  flex: 2,
                  marginRight: 10,
                }}
                label={width === 'xs' && '単価'}
                />
              <Field
                name='amount'
                type='text'
                pattern='\d*'
                component={renderTextInput}
                style={width === 'xs' ? {} : {
                  flex: 1,
                }}
                label={width === 'xs' && '数量'}
              />
              {width !== 'xs' &&
                <div style={{width: 50}}>
                  {fields.length > 1 &&
                    <IconButton style={{width: 40, height: 40, marginLeft: 5}} onClick={() => fields.remove(idx)}><CloseIcon /></IconButton>
                  }
                </div>
              }
            </div>
          </FormSection>
        )}
      </div>
      {error && <div style={{color: red[500]}}>{error}</div>}
      <Button color='primary' onClick={() => fields.push({name: '', price: '', amount: 1})}>
        <AddIcon style={{width: 24, height: 24}} />
        追加
      </Button>
    </div>
  )
})
