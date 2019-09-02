import React from 'react'
import qs from 'qs'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field, formValueSelector, SubmissionError } from 'redux-form'
import {
  MenuItem,
  Button,
  IconButton,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  Stepper,
  Step,
  StepContent,
  StepLabel,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelActions,
  ExpansionPanelDetails,
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import ActionInfoOutlined from '@material-ui/icons/InfoOutlined'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import CloseIcon from '@material-ui/icons/Close'
import NewIcon from '@material-ui/icons/FiberNew'
import HelpIcon from '@material-ui/icons/HelpOutline'

import { withApiClient } from 'contexts/apiClient'
import { loadForPro as loadRequest } from 'modules/request'
import { update as updateProfile } from 'modules/profile'
import { create as createMeet } from 'modules/meet'
import { load as loadTemplate, increment as incrementTemplate } from 'modules/meetTemplate'
import { load as loadPoint, paymentInfo, charge } from 'modules/point'
import { load as loadProService, update as updateProService } from 'modules/proService'

import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderPrice from 'components/form/renderPrice'
import renderSelect from 'components/form/renderSelect'
import ProfileProgress from 'components/ProfileProgress'
import PreviewModal from 'components/pros/PreviewModal'
import ConfirmDialog from 'components/ConfirmDialog'
import FileUploader, { FileThumbnail } from 'components/FileUploader'
import NetbankRedirectDialog from 'components/NetbankRedirectDialog'
import { StarterProgramBannerMini } from 'components/pros/StarterProgramBanner'
import PriceValuesSetting from 'components/PriceValuesSetting'
import { hasNGWords } from 'lib/validate'
import storage from 'lib/storage'
import { explicitSuspend } from 'lib/status'
import { zenhan, priceFormat } from 'lib/string'
import { getQueries, parsePriceValues, initializePriceValues, validateTravelFee, checkFilledBaseQuery } from 'lib/proService'
import { payment, templateFormat, fileMime } from '@smooosy/config'

const YEN_PER_POINT = payment.pricePerPoint.withTax

const selector = formValueSelector('response')

@withApiClient
@withWidth()
@withStyles({
  expandSummary: {
    width: '100%',
  },
  expandIcon: {
    right: 0,
  },
  helpIcon: {
    width: 24,
    height: 24,
    marginLeft: 10,
  },
  priceValueResult: {
    display: 'flex',
    alignItems: 'center',
  },
}, {withTheme: true})
@reduxForm({
  form: 'response',
  validate: values => {
    const errors = {}
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
  warn: values => {
    const warnings = {}
    if (values.chat) {
      if (values.chat.length < 100) {
        warnings.chat = 'メッセージが短いようです'
      } else if (values.chat.length > 1000) {
        warnings.chat = 'メッセージが長いようです'
      }
    }
    return warnings
  },
  onChange: (values, dispatch, props) => {
    if (props.request && props.request.id) {
      const draft = storage.get('draft') || {}
      draft[props.request.id] = values
      storage.save('draft', draft)
    }
  },
})
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
    point: state.point.point,
    defaultCard: state.point.defaultCard,
    conveniInfo: state.point.conveniInfo,
    templates: state.meetTemplate.templates,
    files: selector(state, 'files') || [],
    message: selector(state, 'chat'),
    priceValuesRC: state.runtimeConfig.runtimeConfigs.find(c => c.name  === 'price_values_enabled'),
  }),
  { loadRequest, updateProfile, createMeet, loadPoint, paymentInfo, charge, loadTemplate, incrementTemplate }
)
@withRouter
export default class ResponseForm extends React.Component {
  constructor(props) {
    super(props)
    const { user, profile } = props
    const isComplete = !!(user.imageUpdatedAt && profile.description)

    this.state = {
      saveTemplate: true,
      isComplete,
      openPVDialog: !storage.get('price_values_dialog_shown'),
    }
    this.textareaRef = React.createRef()
  }

  componentDidMount() {
    const { request } = this.props

    this.props.loadPoint()
    this.props.paymentInfo()
    this.init(this.props)

    // 決済戻りパラメータ
    const query = qs.parse(this.props.location.search.slice(1))
    if (query.redirect) {
      this.setState({redirectStatus: 'progress'})
      this.props.history.replace(this.props.location.pathname)
    }

    this.props.loadTemplate(request.service._id).then(() => {
      this.init(this.props)
      if (query.redirect) {
        this.setState({redirectStatus: query.redirect})
      }
    })
  }

  initWithBlank = () => {
    this.props.initialize({
      profile: this.props.profile.id,
      title: '無題の応募',
      price: (this.props.request.priceValueResult && this.props.request.priceValueResult.total) || 0,
      priceType: 'fixed',
      chat: '',
    })
    this.setState({
      editTemplate: true,
      templateIndex: -1,
      needMoreInfo: false,
      typeMismatch: false,
    })
  }

  init = (props, templateIndex) => {
    const { request, profile, templates } = props
    let response
    if (templateIndex >= 0) {
      response = {...profile.templates[templateIndex]}
    } else {
      const draft = storage.get('draft') || {}
      const tmp = draft[request.id] || {}
      templateIndex = tmp.templateIndex
      if (!(profile.templates || {})[templateIndex]) templateIndex = -1
      response = tmp
    }
    const initial = {
      profile: profile.id,
      title: response.title || '無題の応募',
      price: response.price || (props.request.priceValueResult && props.request.priceValueResult.total) || 0,
      priceType: props.needMoreInfo ? 'needMoreInfo' : response.priceType || 'fixed',
      chat: response.chat || '',
      templateIndex: templateIndex >= 0 ? templateIndex: -1,
      files: response.files || [],
    }
    const acceptNeedMoreInfo = request.service.needMoreInfo
    const proNeedMoreInfo = initial.priceType === 'needMoreInfo'
    if (!acceptNeedMoreInfo && proNeedMoreInfo) {
      initial.priceType = 'fixed'
    }
    this.props.initialize(initial)

    const templateCount = profile.templates.length + (templates || []).length
    this.setState({
      editTemplate: templateIndex >= 0 || templateCount === 0,
      templateIndex: templateIndex >= 0 ? templateIndex : -1,
      needMoreInfo: acceptNeedMoreInfo && proNeedMoreInfo,
      typeMismatch: !acceptNeedMoreInfo && proNeedMoreInfo,
    })
  }

  deleteFile = (file, index) => {
    this.props.array.remove('files', index)
    this.props.apiClient.delete(`/api/chats/${file.id}`)
  }

  handleFile = ({data, file, fileType}) => {
    const up = {
      id: data.id,
      url: data.url,
      name: file.name,
      type: fileType,
    }

    this.props.array.push('files', up)
  }

  handleConfirm = (values) => {
    // データの整形
    const submitData = { ...values }
    submitData.chat = submitData.chat.replace(templateFormat.name, this.props.request.customer.lastname)
    this.setState({values: submitData, redirectStatus: false})
  }

  handleSubmit = (values) => {
    const { request } = this.props

    // 定型文保存
    if (this.state.saveTemplate) {
      this.upsertTemplate(values)
    }

    // データの整形
    const submitData = { ...values }
    submitData.chat = submitData.chat.replace(templateFormat.name, request.customer.lastname)
    if (submitData.priceType === 'needMoreInfo') submitData.price = 0
    submitData.files = (submitData.files || []).map(f => f.id)
    delete submitData.title
    delete submitData.templateIndex

    const points = this.calcPoints()
    // 必要ポイントがあるなしに関わらず一度応募作成APIを叩く
    // オートチャージする前に応募不可になっていないかをチェックする
    return this.props.createMeet(request.id, submitData)
      .then(this.onCreated)
      .catch(err => {
        // 応募できない場合
        if (err.errors && err.errors.status === 901 && points.autoCharge) {
          // ポイント不足エラーでオートチャージONの場合のみ処理を継続
          return this.props.charge({price: points.autoChargePrice, point: points.autoCharge })
            .then(() => this.props.createMeet(request.id, submitData))
            .then(this.onCreated)
            .catch(err => {
              this.props.paymentInfo()
              throw new SubmissionError({_error: err.data.message})
            })
        }
        return Promise.reject(err)
      })
  }

  onCreated = meet => {
    window.mixpanel && window.mixpanel.track('pro: meet created', {
      profile: meet.profile,
      request: meet.requst,
      meet: meet.id,
      point: meet.point,
    })
    window.Intercom && window.Intercom('trackEvent', 'meet', {
      profile: meet.profile,
      request: meet.requst,
      meet: meet.id,
      point: meet.point,
    })
    this.props.history.push(`/pros/waiting/${meet.id}`, {created: true})
  }

  // 超重要！！：ポイント＆価格計算
  calcPoints = () => {
    const { point, defaultCard, request } = this.props
    const basePoint = request.basePoint || 0
    const total = point ? point.sum.limited + point.sum.bought : 0
    const consume = request.point || 0
    const discounts = request.discounts || []
    // 不足分のみ購入に固定する
    const autoCharge = defaultCard ? consume - total : 0 // クレカが設定されていたら不足pt そうでなければ0
    const autoChargePrice = autoCharge * YEN_PER_POINT

    return {
      total,
      basePoint,
      consume,
      discounts,
      autoChargePrice,
      autoCharge,
    }
  }

  upsertTemplate = (values) => {
    const { id, templates } = this.props.profile
    const template = {
      title: values.title,
      chat: values.chat,
      price: values.price,
      priceType: values.priceType,
    }
    if (values.templateIndex >= 0) {
      templates[values.templateIndex] = {
        ...templates[values.templateIndex],
        ...template,
      }
    } else {
      templates.push(template)
    }
    this.props.updateProfile(id, {templates})
  }

  copyTemplate = (index) => {
    const { id, templates } = this.props.profile
    const t = templates[index]
    if (!t) return

    this.setState({copying: true})
    templates.splice(index+1, 0, {...t, title: t.title + '（コピー）'})
    this.props.updateProfile(id, {templates}).then(() => {
      setTimeout(() => {
        this.setState({copying: false})
      }, 100)
    })
  }

  deleteTemplate = (index) => {
    if (index < 0) return
    const { id, templates } = this.props.profile

    this.setState({deleting: true})
    templates.splice(index, 1)
    this.props.updateProfile(id, {templates}).then(() => {
      setTimeout(() => {
        this.setState({deleteConfirm: false, deleting: false})
      }, 100)
    })
  }

  // おすすめメッセージ呼び出し
  selectMeetTemplate = (template) => {
    this.props.incrementTemplate(template.id)
    this.props.initialize({
      profile: this.props.profile.id,
      title: template.title,
      price: 0,
      priceType: 'fixed',
      chat: template.body.replace(templateFormat.proname, this.props.profile.name),
    })
    this.setState({
      editTemplate: true,
      templateIndex: -1,
      needMoreInfo: false,
      typeMismatch: false,
    })
  }

  reload = () => {
    // クレカ登録で割引が変わるので再度読み込む
    return this.props.loadRequest(this.props.request.id)
  }

  getQueryLabel = (optionId) => {
    const { request } = this.props
    for (const desc of request.description) {
      if (desc.answers.some(a => a.option === optionId)) {
        return desc.label
      }
    }
  }

  getPriceInfo = () => {
    const { request: { priceValueResult } } = this.props
    if (!priceValueResult) return ''
    const divider = '-'.repeat(25) + '\n'
    let text = divider + '【ご料金(税込)】\n'
    const COLON = ':   '
    for (const c of priceValueResult.components) {
      let label = ''
      if (c.singleBase) {
        label = '基本料金' + COLON
      } else if (c.type === 'travelFee') {
        label = c.label + COLON
      } else {
        label = c.answers.map(a => `${this.getQueryLabel(a._id)}(${a.text})`).join(' + ') + COLON
      }
      if (c.isNumber) {
        text += `${label}${Number(c.value).toLocaleString()}円${c.type === 'base' && priceValueResult.estimatePriceType === 'minimum' ? '〜' : ''} ${c.answers[0].number ? `x ${c.answers[0].number}${c.answers[0].unit}` : ''} \n`
      } else {
        text += `${label}${Number(c.calculatedValue).toLocaleString()}円${c.type === 'base' && priceValueResult.estimatePriceType === 'minimum' ? '〜' : ''}\n`
      }
    }
    text += `\n合計:  ${Number(priceValueResult.total).toLocaleString()}円\n`
    text += divider
    return text
  }

  addPriceInfo = () => {
    const { request: { priceValueResult = {} } } = this.props
    const cursor = this.textareaRef.current ? this.textareaRef.current.selectionStart : 0
    const newMessage = this.props.message.slice(0, cursor) + `\n${this.getPriceInfo()}` + this.props.message.slice(cursor)
    this.props.change('chat', newMessage)
    this.props.change('price', priceValueResult.total)
  }

  onClosePVDialog = () => {
    storage.save('price_values_dialog_shown', true)
    this.setState({openPVDialog: false})
  }

  render() {
    const { editTemplate, isComplete, redirectStatus, saveTemplate, templateIndex, values, openPVDialog } = this.state
    const { request, profile, templates, files, conveniInfo, handleSubmit, error, submitting, width, theme, classes, priceValuesRC } = this.props

    const { common, grey, blue, red } = theme.palette

    if (!profile || !templates) return null

    if (request.pass) {
      return (
        <div style={{margin: 20}}>
          <h3>{request.customer.lastname}様の依頼はパスしました</h3>
        </div>
      )
    }

    const styles = {
      root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
      main: {
        padding: width === 'xs' ? 10 : 20,
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      titleBar: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        height: 50,
        minHeight: 50,
        padding: 10,
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      title: {
        padding: '10px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      },
      paper: {
        textAlign: 'center',
        background: common.white,
        marginBottom: 20,
        padding: 20,
        border: `1px solid ${grey[300]}`,
      },
      unit: {
        padding: 10,
        fontSize: 20,
      },
      priceType: {
        width: 150,
        textAlign: 'center',
      },
      message: {
        height: 200,
        borderRadius: 0,
      },
      templateList: {
        borderWidth: '1px 1px 0',
        borderStyle: 'solid',
        borderColor: grey[300],
        background: common.white,
        marginBottom: 20,
        padding: 0,
      },
      templateTitle: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      templateChat: {
        padding: '0 10px 10px',
        fontSize: 14,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      templateBody: {
        fontSize: 14,
      },
      starterProgramBanner: {
        marginBottom: 16,
      },
    }

    if (explicitSuspend(profile.suspend)) {
      return (
        <div style={{margin: 20}}>
          <p>
            「<Link style={{textDecoration: 'underline'}} to={`/account/profiles/${profile.id}`}>{profile.name}</Link>」
            が{profile.suspend === '一時休止' ? '一時休止' : 'サスペンド'}中のため応募はできません。
          </p>
        </div>
      )
    }

    if (!isComplete) {
      return (
        <div style={styles.root}>
          <div style={styles.main}>
            <p>「{profile.name}」のプロフィールが未完成です。</p>
            <p>メッセージを送信するためにプロフィールを完成させましょう。</p>
            <ProfileProgress
              style={{marginTop: 10, border: `1px solid ${grey[300]}`}}
              enableImageSkip
              profile={profile}
              completeLabel='メッセージを送る'
              onComplete={() => this.setState({isComplete: true})}
            />
          </div>
        </div>
      )
    }

    const templateCount = profile.templates.length + templates.length
    const points = this.calcPoints()
    const chatPlaceholder = this.state.needMoreInfo ? 'はじめまして！SMOOOSYリフォームの〇〇と申します。\nご希望のリフォームに関しまして、見積もりにはあと少し情報を頂く必要があります。□□□□の点に関しまして△△△がどのようになっているか、もう少し詳しくお聞かせいただけますでしょうか。\nどうぞよろしくお願いいたします。' : 'はじめまして！カメラマンの〇〇と申します。\nご希望の家族写真に関しまして、弊社は屋内・屋外問わず月に3回以上のご依頼を承っております。\n東京23区内でしたら交通費込みでこの値段でいかがでしょうか。\nさらに遠くへの出張撮影も可能ですのでご相談ください。'

    return (
      <div style={styles.root}>
        <div style={styles.titleBar}>
          <div style={{flex: 1}}>
            {width !== 'md' &&
              <IconButton onClick={() => this.props.closeResponse()}><LeftIcon /></IconButton>
            }
          </div>
          <div>{editTemplate ? '依頼に応募する' : '定型文から選ぶ'}</div>
          <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
            {editTemplate && templateCount > 0 &&
              <Button size='small' color='primary' style={{minWidth: 64}} onClick={() => this.setState({editTemplate: false})}>定型文一覧</Button>
            }
          </div>
        </div>
        {editTemplate ?
          <form style={styles.main} onSubmit={handleSubmit(this.handleConfirm)}>
            <StarterProgramBannerMini style={styles.starterProgramBanner} />
            <div style={{width: '80%', margin: '0 auto'}}>
              <Field simple name='title' component={renderTextInput} inputStyle={{textAlign: 'center'}} />
            </div>
            <div style={{...styles.title, display: 'flex', justifyContent: 'space-between'}}>
              <h4>価格</h4>
              <a style={{display: 'flex', alignItems: 'center', fontSize: 13}} href='/pro-center/get-hired-guide/winning-message' target='_blank'>
                <ActionInfoOutlined style={{width: 20, height: 20, color: blue.A200}} />
                メッセージの書き方のコツは？
              </a>
            </div>
            <div style={styles.paper}>
              <Field name='priceType' component={renderSelect} value='fixed' onFieldChange={value => this.setState({needMoreInfo: value === 'needMoreInfo'})}>
                <MenuItem value='fixed'>固定価格</MenuItem>
                <MenuItem value='hourly'>時給</MenuItem>
                {request.service.needMoreInfo && <MenuItem value='needMoreInfo'>追加情報が必要</MenuItem>}
              </Field>
              <Field
                autoFocus
                name='price'
                type='tel'
                disabled={this.state.needMoreInfo}
                component={renderPrice}
                parse={s => parseInt(zenhan(s).replace(/[^0-9]/g, ''), 10)}
                format={s => s ? s + '' : ''}
                normalize={n => Math.min(99999999, n)}
              />
              {this.state.typeMismatch &&
                <div style={{textAlign: 'left', fontSize: 14, color: red[500]}}>
                  「追加情報が必要」は{request.service.name}では利用できません。「固定価格」または「時給」をお選びください。
                </div>
              }
              <div style={{textAlign: 'left', fontSize: 12, color: grey[700]}}>
                ※ 税・交通費などを含めた価格を記載してください
              </div>
              {request.service.needMoreInfo ?
                <div style={{textAlign: 'left', fontSize: 12, color: grey[700]}}>
                  ※ 情報が不足している場合、「追加情報が必要」を選択してください
                </div> : null
              }
            </div>
            <div style={styles.title}>
              <h4>メッセージ</h4>
              {priceValuesRC && priceValuesRC.services.includes(request.service._id) &&
                <>
                  <div className={classes.priceValueResult}>
                    <Button color='primary' variant='outlined' disabled={!request.priceValueResult} size='small' onClick={this.addPriceInfo}>設定価格を読込み</Button>
                    <IconButton onClick={() => this.setState({openPVDialog: true})} className={classes.helpIcon}><HelpIcon /></IconButton>
                  </div>
                  <PriceValuesDialog open={openPVDialog} onClose={this.onClosePVDialog} service={request.service} reload={this.reload} addPriceInfo={this.addPriceInfo} />
                </>
              }
            </div>
            <Field textareaStyle={styles.message} component={renderTextArea} showProgress targetCount={400} showCounter name='chat' placeholder={chatPlaceholder} inputRef={this.textareaRef} />
            <div style={{fontSize: 13, color: grey[700]}}>
              {'{{name}}'}は自動的に依頼者の名前に変換されます
            </div>
            <FileUploader
              endPoint={({type, fileType}) => `/api/chats/file/getSignedUrl?ext=${type.ext}&mime=${type.mime}&type=${fileType}`}
              acceptance={[fileMime.types.all]}
              multiple
              handleFile={this.handleFile}
            >
              <Button style={{marginTop: 10, background: '#fff'}} variant='outlined' color='primary'>ファイルを添付</Button>
            </FileUploader>
            <div style={{marginTop: 10}}>
              <FileThumbnail files={files} onRemove={this.deleteFile} />
            </div>
            <div>
              <FormControlLabel
                control={<Checkbox
                  color='primary'
                  checked={saveTemplate}
                  onChange={(_, saveTemplate) => this.setState({saveTemplate})}
                />}
                label={templateIndex >= 0 ? '定型文を更新する' : '定型文に保存する'}
              />
              <Button
                variant='contained'
                type='submit'
                disabled={submitting}
                color='primary'
                style={{height: 45, width: '100%'}}
              >
                確認して応募する
              </Button>
            </div>
          </form>
        :
          <div style={styles.main}>
            <StarterProgramBannerMini style={styles.starterProgramBanner} />
            <div style={styles.title}>
              <h4>自分の定型文</h4>
            </div>
            {profile.templates.length ? profile.templates.map((t, i) =>
              <Paper key={i} style={{marginBottom: 16}}>
                <div style={{display: 'flex', padding: 10, fontWeight: 'bold'}}>
                  <div style={styles.templateTitle}>{t.title || ''}</div>
                  <div style={{padding: 0}}>{priceFormat(t)}</div>
                </div>
                <div style={styles.templateChat}>{t.chat}</div>
                <Divider />
                <div style={{display: 'flex', padding: 10}}>
                  <Button size='small' onClick={() => this.setState({deleteConfirm: i})}>
                    削除する
                  </Button>
                  <Button size='small' disabled={this.state.copying} onClick={() => this.copyTemplate(i)}>
                    コピー
                  </Button>
                  <div style={{flex: 1}} />
                  <Button size='small' variant='contained' color='primary' onClick={() => this.init(this.props, i)}>
                    利用する
                  </Button>
                </div>
              </Paper>
            )
            :
              <Paper style={{padding: 10, marginBottom: 16, textAlign: 'center'}}>定型文はありません</Paper>
            }
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 30}}>
              <p>既存の定型文を使わず応募しますか？</p>
              <Button variant='contained' color='primary' onClick={() => this.initWithBlank()}>新規作成</Button>
            </div>
            {templates.length > 0 && [
              <div key='title' style={styles.title}>
                <h4>応募メッセージの例（ご依頼内容などに応じて加筆・修正してご利用ください）</h4>
              </div>,
              <div key='list'>
                {templates.map((t, i) =>
                  <ExpansionPanel key={i}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} classes={{content: classes.expandSummary, expandIcon: classes.expandIcon}} style={{padding: '0 10px'}}>
                      <div style={styles.templateTitle}>{t.title || ''}</div>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{padding: '0 10px 10px'}}>
                      <div style={styles.templateBody}>{t.body.replace(templateFormat.proname, profile.name)}</div>
                    </ExpansionPanelDetails>
                    <Divider />
                    <ExpansionPanelActions style={{padding: 10}}>
                      <Button size='small' variant='contained' color='primary' onClick={() => this.selectMeetTemplate(t)}>
                        利用する
                      </Button>
                    </ExpansionPanelActions>
                  </ExpansionPanel>
                )}
              </div>,
            ]}
          </div>
        }
        <PreviewModal
          values={values}
          points={points}
          isNewbie={request.isNewbie}
          onClose={() => this.setState({values: false})}
          onSubmit={handleSubmit(this.handleSubmit)}
          onReload={this.reload}
          error={error}
          submitting={submitting}
        />
        <ConfirmDialog
          open={Number.isInteger(this.state.deleteConfirm)}
          onClose={() => this.setState({deleteConfirm: false})}
          onSubmit={() => this.deleteTemplate(this.state.deleteConfirm)}
          disabled={this.state.deleting}
          title='本当に削除しますか？'
          label='削除する'
        />
        <NetbankRedirectDialog
          status={redirectStatus}
          conveniInfo={conveniInfo}
          onSubmit={handleSubmit(this.handleConfirm)}
        />
      </div>
    )
  }
}

@withStyles(theme => ({
  title: {
    display: 'flex',
    alignItems: 'center',
  },
  new: {
    color: theme.palette.red[500],
  },
  form: {
    width: '100%',
  },
  text: {
    padding: 16,
    color: theme.palette.grey[800],
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  anootation: {
    color: theme.palette.grey[800],
    fontSize: 12,
  },
  error: {
    color: theme.palette.red[700],
    fontSize: 12,
    marginTop: 10,
  },
  stepper: {
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
}))
@connect(state => ({
  proService: state.proService.proService,
}), { loadProService, updateProService })
@reduxForm({
  form: 'price_values_dialog',
  validate: (values, props) => {
    const errors = {}
    const { proService } = props
    if (!proService) return null

    if (values.chargesTravelFee) {
      const travelFeeError = validateTravelFee(values.travelFee)
      errors.travelFee = travelFeeError
    }
    if (proService.service.singleBasePriceQuery) {
      if (!values.singleBase || (typeof values.singleBase.singleBase !== 'number' && !values.singleBase.singleBase)) {
        errors.singleBase = {singleBase: '価格を入力してください'}
      }
    }

    const err = checkFilledBaseQuery(values.base, proService)
    if (err.length) {
      errors.base = {}
      err.forEach(e => errors.base[e] = '入力してください')
    }
    if (Object.keys(errors).length) {
      errors._error = '必須項目が未入力です'
    }
    return errors
  },
})
class PriceValuesDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      baseQueries: [],
      discountQueries: [],
      addonQueries: [],
      hideTravelFee: false,
      singleBasePriceQuery: null,
      activeStep: 0,
    }
  }

  componentDidMount() {
    this.props.loadProService(this.props.service._id)
      .then(() => {
        const { proService } = this.props
        const {
          baseQueries,
          discountQueries,
          addonQueries,
          hideTravelFee,
          singleBasePriceQuery,
        } = getQueries({jobRequirements: proService.jobRequirements, service: proService.service})
        this.setState({
          baseQueries,
          discountQueries,
          addonQueries,
          hideTravelFee,
          singleBasePriceQuery,
          activeStep: proService.setupPriceValues ? 1 : 0,
        })
        this.props.initialize(
          initializePriceValues(proService.priceValues, proService.chargesTravelFee)
        )
      })
  }

  onSubmit = (values) => {
    const priceValues = parsePriceValues(values)

    return this.props.updateProService(
      this.props.service._id,
      {
        priceValues,
        setupPriceValues: true,
        chargesTravelFee: values.chargesTravelFee,
      }
    ).then(() => {
      this.props.reload()
      this.setState({
        activeStep: 1,
      })
    })
  }

  addPriceInfo = () => {
    this.props.addPriceInfo()
    this.setState({activeStep: 2})
  }

  render() {
    const { proService, service, open, onClose, handleSubmit, classes, submitting, error, submitFailed } = this.props
    const { baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery, activeStep } = this.state
    if (!proService) return null

    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          <div className={classes.title}>
            <NewIcon className={classes.new} />
            見積価格自動計算機能
            <IconButton onClick={onClose} className={classes.closeButton}><CloseIcon /></IconButton>
          </div>
        </DialogTitle>
        <div className={classes.text}>
          <div style={{marginBottom: 10}}>価格の設定をすると、依頼の条件に応じて<span style={{fontWeight: 'bold'}}>見積もり価格が自動で計算されます。</span></div>
          <Stepper className={classes.stepper} activeStep={activeStep} orientation='vertical'>
            <Step>
              <StepLabel>価格設定をする</StepLabel>
              <StepContent>
                <div className={classes.form}>
                  <PriceValuesSetting
                    baseQueries={baseQueries}
                    discountQueries={discountQueries}
                    addonQueries={addonQueries}
                    singleBasePriceQuery={singleBasePriceQuery}
                    estimatePriceType={null}
                    allowsTravelFee={service.allowsTravelFee && !hideTravelFee}
                  />
                  <Button disabled={submitting} onClick={handleSubmit(this.onSubmit)} color='primary' variant='contained' fullWidth>保存</Button>
                  <div className={classes.error}>{submitFailed && error}</div>
                </div>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>設定価格を応募に反映させる</StepLabel>
              <StepContent>
                <Button color='primary' variant='outlined' size='small' onClick={this.addPriceInfo}>設定価格を読込み</Button>
                <div className={classes.anootation}>メッセージ欄の右上にも同じボタンがあります</div>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>完了</StepLabel>
              <StepContent><Button variant='contained' color='primary' onClick={onClose}>結果を確認しましょう！</Button></StepContent>
            </Step>
          </Stepper>
        </div>
      </Dialog>
    )
  }
}
