import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field, FieldArray } from 'redux-form'
import {
  Button,
  Dialog,
  DialogActions,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  withTheme,
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import TemplateAdd from '@material-ui/icons/AddCircle'

import { update, deactivate } from 'tools/modules/profile'
import { update as updateUser } from 'tools/modules/auth'
import { loadMediaLists, create as createMedia, update as updateMedia } from 'tools/modules/media'
import { open as openSnack } from 'tools/modules/snack'
import CustomRow from 'components/CustomRow'
import ProfilePreview from 'components/ProfilePreview'
import ReviewForAdmin from 'tools/components/stats/ReviewForAdmin'
import renderCheckbox from 'components/form/renderCheckbox'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import renderNumberInput from 'components/form/renderNumberInput'
import renderSwitch from 'components/form/renderSwitch'
import ServiceSelectorWithChip from 'components/ServiceSelectorWithChip'
import ConfirmDialog from 'components/ConfirmDialog'
import AvatarCropper from 'components/AvatarCropper'
import MediaListEdit from 'components/MediaListEdit'
import TemplateForm from 'components/TemplateForm'
import isURL from 'validator/lib/isURL'
import { timeString } from 'lib/date'
import { priceFormat } from 'lib/string'
import { webOrigin } from '@smooosy/config'
import { profileValidator } from 'lib/validate'

const reasons = {
  contact: 'メールアドレス・URL・電話番号などの連絡先を削除',
  ngword: 'NGワード（性的・暴力的・差別的なワード、他者の感情を害しうるワード）の削除',
  nomean: '改行・スペースの多用、「あああああ」などの無意味な文字列の削除',
  setup: '代理で初期プロフィールの入力を行いました',
  revision: '経験豊富なプロのライターによる追記をさせていただきました',
}

const suspends = {
  admin: 'admin',
  wrongname: '有名人・芸能人・歴史上の偉人の名前などを登録している',
  moral: '公序良俗に反する文言を登録している',
  suspend: '一時休止',
  other: '運営事務局が不適切と判断する内容を登録している',
}

@withStyles(theme => ({
  table: {
    border: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: 0,
  },
  border: {
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  dialogPaper: {
    overflowY: 'auto',
    padding: 20,
    width: '90vw',
  },
  dialogPaperWidthSm: {
    maxWidth: 'initial',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
}))
@reduxForm({
  form: 'profile',
  validate: values => {
    const errors = profileValidator(values)
    if (!values.name) {
      errors.name = '必須項目です'
    }
    if (values.url && !isURL(values.url)) {
      errors.url = '正しいURLを入力してください'
    }
    if (/必須/.test(errors.description) || /文字以上/.test(errors.description)) {
      delete errors.description
    }
    if (!values.reason || Object.keys(values.reason).length === 0) {
      errors._errors = 'エラー'
    }
    return errors
  },
})
@connect(
  state => ({
    admin: state.auth.admin,
    mediaLists: state.media.mediaLists,
  }),
  { update, deactivate, updateUser, openSnack, loadMediaLists, createMedia, updateMedia }
)
export default class ProfileManageTab extends React.Component {
  state = {
    edit: false,
    unsuspend: false,
    suspend: false,
    deactivate: false,
  }

  constructor(props) {
    super(props)
    const profile = props.profile
    props.initialize({...profile, publish: !profile.hideProfile, phone: profile.pro.phone})
  }

  componentDidMount() {
    this.props.loadMediaLists(this.props.profile.id)
  }

  componentDidUpdate(prevProps) {
    const profile = this.props.profile
    if (prevProps.profile.updatedAt !== profile.updatedAt) {
      this.props.initialize({...profile, publish: !profile.hideProfile, phone: profile.pro.phone})
    }
  }

  submit = ({
    id, name, url, distance, description, accomplishment, advantage, reason,
    publish, experience, employees, updatedAt, services,
  }) => {
    const r = reason ? Object.keys(reason).map(key => reasons[key]) : []
    return this.props.update({
      id,
      name,
      url,
      distance,
      description,
      accomplishment,
      advantage,
      reason: r,
      hideProfile: !publish,
      experience,
      employees,
      updatedAt,
      services: Array.from(new Set(services)),
    }).then(() => {
      this.props.change('reason', {})
      this.props.onUpdate()
      this.setState({edit: false})
    }).catch(err => {
      const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
      this.props.openSnack(msg)
    })
  }

  updateScore = () => {
    this.props.update({id: this.props.profile.id})
  }

  handleImage = (blob) => {
    const { profile } = this.props
    this.props.updateUser({id: profile.pro.id, updatedAt: profile.pro.updatedAt}, blob)
      .then(() => this.props.onUpdate())
      .catch(err => {
        const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
        this.props.openSnack(msg)
      })
  }

  suspend = ({id, reason}) => {
    const reasons = Object.keys(reason).filter(key => reason[key]).map(key => suspends[key])
    if (reasons.length === 0) return
    this.props.update({id, suspend: reasons})
    this.props.change('reason', {})
    this.setState({suspend: false})
  }

  unsuspend = () => {
    this.props.update({id: this.props.profile.id, suspend: 'recover'})
    this.setState({unsuspend: false})
  }

  deactivate = () => {
    this.props.deactivate(this.props.profile.id)
    .catch((err) => {
      this.props.openSnack(err.message)
    })
    .finally(() => {
      this.setState({deactivate: false})
    })
  }

  render() {
    const { profile, mediaLists, admin, handleSubmit, pristine, invalid, submitting, classes } = this.props

    return (
      <div style={{padding: 20}}>
        <div style={{display: 'flex', marginBottom: 10}}>
          <h3>管理情報</h3>
          <div style={{flex: 1}} />
          {admin > 1 &&
            <Button size='small' variant='contained' color='secondary' style={{marginRight: 10}} onClick={() => this.setState({edit: true})}>編集する</Button>
          }
          {admin > 2 && profile.suspend ?
            <Button size='small' variant='contained' style={{marginRight: 10}} onClick={() => this.setState({unsuspend: true})}>サスペンド解除</Button>
          : admin > 2 ?
            <Button size='small' variant='contained' color='secondary' style={{marginRight: 10}} onClick={() => this.setState({suspend: true})}>サスペンド</Button>
          : null}
          {admin > 2 && !profile.deactivate && profile.pro.profiles.length > 1 &&
            <Button size='small' variant='contained' color='secondary' onClick={() => this.setState({deactivate: true})}>削除</Button>
          }
        </div>
        <div className={classes.table}>
          <Table>
            <TableBody>
              <CustomRow title='プロフィールID'>{profile.id}</CustomRow>
              <CustomRow title='開始日時'>{timeString(new Date(profile.createdAt))}</CustomRow>
              <CustomRow title='メインカテゴリ'>{profile.category.name}</CustomRow>
              <CustomRow title='スコア'>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <div>
                    <p>メイン: {profile.mainScore || 0}点</p>
                    <p>SP用: {profile.score || 0}点</p>
                  </div>
                  {admin > 9 && <Button variant='contained' color='primary' style={{marginLeft: 10}} onClick={this.updateScore}>更新</Button>}
                </div>
              </CustomRow>
              <CustomRow title='プロフィールページ'><a href={`${webOrigin}/p/${profile.shortId}`}>{profile.name} - {profile.address}</a></CustomRow>
              <CustomRow title='クチコミページ'><a href={`${webOrigin}/r/${profile.shortId}`}>クチコミを投稿</a></CustomRow>
              <CustomRow title='依頼受け取り条件'>
                <p>半径: {(profile.distance || 50000) / 1000}km</p>
                <details>
                  <summary>対応サービス</summary>
                  {profile.services.map(s => <div key={s.id} style={{fontSize: 12}}>{s.name}</div>)}
                </details>
              </CustomRow>
              <CustomRow title='プロフィール公開状態'>{profile.hideProfile ? 'プロフィール非公開' : 'プロフィール公開中'}</CustomRow>
            </TableBody>
          </Table>
        </div>
        <h3 style={{margin: '40px 0 10px'}}>プレビュー</h3>
        <div className={classes.border}>
          <ProfilePreview profile={profile} mediaLists={mediaLists} ReviewComponent={admin > 2 ? ReviewForAdmin : 'div'} />
        </div>
        <h3 style={{margin: '40px 0 10px'}}>応募定型文</h3>
        <TemplateList profile={profile} />
        <Dialog
          open={!!this.state.edit}
          classes={{paper: classes.dialogPaper, paperWidthSm: classes.dialogPaperWidthSm}}
          onClose={() => {
            this.props.change('reason', {})
            this.setState({edit: false})
          }}
        >
          <AvatarCropper user={profile.pro} handleImage={this.handleImage} />
          <MediaListEdit
            title='サービス共通の写真'
            mediaAll={[]}
            mediaList={{id: profile.id, media: profile.media}}
            upsertList={(id, data) => this.props.update({...data, id})}
            createMedia={(data) => this.props.createMedia(profile.pro.id, data)}
            updateMedia={this.props.updateMedia}
          />
          <form onSubmit={handleSubmit(this.submit)}>
            <Field name='name' component={renderTextInput} label='事業者名' type='text' />
            <Field name='url' component={renderTextInput} label='ウェブサイト' type='text' />
            <Field name='distance' component={renderTextInput} label='対応半径(m)' type='number' />
            <div style={{marginBottom: 10}}>
              <p className={classes.subtitle}>対応サービス</p>
              <FieldArray name='services' component={ServiceSelectorWithChip} />
            </div>
            <Field textareaStyle={{height: 150}} name='description' component={renderTextArea} label='自己紹介（事業内容・提供するサービスをご説明ください） ※必須' type='text' showCounter />
            <Field textareaStyle={{height: 100}} name='accomplishment' component={renderTextArea} label='これまでの実績をご記入ください' type='text' showCounter />
            <Field textareaStyle={{height: 100}} name='advantage' component={renderTextArea} label='アピールポイント・意気込みをご記入ください' type='text' showCounter />
            <div style={{display: 'flex'}}>
              <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='年' name='experience' component={renderNumberInput} label='経験年数' placeholder='5' />
              <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='人' name='employees' component={renderNumberInput} label='従業員数' placeholder='10' />
            </div>
            <div>修正内容（チェックをつけるとプロにメールを送信します）</div>
            {Object.keys(reasons).map(key =>
              <Field key={key} name={`reason.${key}`} component={renderCheckbox} label={reasons[key]} />
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 20}}>
              <Field name='publish' component={renderSwitch} label='プロフィール公開' />
              <Button
                variant='contained'
                type='submit'
                color='secondary'
                disabled={pristine || invalid || submitting}
              >
                {submitting ? '更新中' : '更新実行'}
              </Button>
            </div>
          </form>
        </Dialog>
        <ConfirmDialog
          title='サスペンドの理由'
          open={!!this.state.suspend}
          label='実行'
          disabled={pristine || invalid || submitting}
          onSubmit={handleSubmit(this.suspend)}
          onClose={() => {
            this.props.change('reason', {})
            this.setState({suspend: false})
          }}
        >
          他のプロフィールの状況
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>名前</TableCell>
                <TableCell>サスペンド</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profile.pro.profiles.filter(p => p.id !== profile.id).map(p =>
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.suspend ? p.suspend : 'NOT SUSPENDED'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <form>
            {Object.keys(suspends).map(key =>
              <Field key={key} name={`reason.${key}`} component={renderCheckbox} label={suspends[key]} />
            )}
          </form>
        </ConfirmDialog>
        <ConfirmDialog
          title={`「${profile.name}」のサスペンドを解除します`}
          open={!!this.state.unsuspend}
          onSubmit={this.unsuspend}
          onClose={() => this.setState({unsuspend: false})}
        >
          よろしければOKを押してください
        </ConfirmDialog>
        <ConfirmDialog
          title={`「${profile.name}」を削除します`}
          open={!!this.state.deactivate}
          onSubmit={this.deactivate}
          onClose={() => this.setState({deactivate: false})}
        >
          よろしければOKを押してください
        </ConfirmDialog>
      </div>
    )
  }
}

@withTheme
@connect(null, { update, openSnack })
class TemplateList extends React.Component {
  state = {
    deleteIndex: false,
  }

  upsertTemplate = values => {
    if (values.priceType === 'needMoreInfo') values.price = 0
    const { profile } = this.props
    const { index } = this.state
    const templates = [...profile.templates]
    if (templates[index]) {
      templates[index] = values
    } else {
      templates.push(values)
    }
    return this.props.update({id: profile.id, templates})
      .then(() => this.setState({template: null, index: null}))
      .catch(err => {
        const msg = err.status === 409 ? '別の更新処理があります、再読み込みしてください。' : 'エラー'
        this.props.openSnack(msg)
      })
  }

  edit = index => {
    const { profile } = this.props
    const template = profile.templates[index] || {
      title: '',
      price: 0,
      priceType: 'fixed',
      chat: '{{name}}様こんにちは！',
    }
    this.setState({index, template})
  }

  render() {
    const { profile, theme: { palette: { grey } } } = this.props
    const { template, index } = this.state
    if (!profile) return null

    return (
      <>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {profile.templates.map((t, index) =>
            <div key={index} style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
              <div style={{flex: 1, marginRight: 20, background: grey[300], padding: 10, borderRadius: 10}}>
                <div style={{display: 'flex'}}>
                  <h4>{t.title}</h4>
                  <span style={{marginLeft: 'auto'}}>{priceFormat(t)}</span>
                </div>
                <span style={{fontSize: 14, color: grey[800]}}>{t.chat}</span>
              </div>
              <Button color='secondary' variant='contained' onClick={() => this.edit(index)}>編集</Button>
            </div>
          )}
          <Button onClick={() => this.edit(profile.templates.length)} fullWidth color='secondary'><TemplateAdd color='secondary' style={{width: 35, height: 35}} /></Button>
        </div>
        <ConfirmDialog
          open={this.state.deleteIndex !== false}
          title='削除しますか？'
          label='削除'
          onClose={() => this.setState({deleteIndex: false})}
          onSubmit={() => this.handleDelete(this.state.deleteIndex)}
        />
        <Dialog open={Boolean(template)} onClose={() => this.setState({template: null, index: null})}>
          <TemplateForm onSubmit={this.upsertTemplate} initialValues={template} />
          {index < profile.templates.length &&
            <DialogActions>
              <Button color='secondary' variant='contained' onClick={() => this.setState({deleteIndex: index})}>削除</Button>
            </DialogActions>
          }
        </Dialog>
      </>
    )
  }
}
