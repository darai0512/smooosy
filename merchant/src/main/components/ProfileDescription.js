import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { Button, Collapse } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { update as updateProfile } from 'modules/profile'
import renderTextArea from 'components/form/renderTextArea'
import renderNumberInput from 'components/form/renderNumberInput'
import { profileValidator, descriptionMin } from 'lib/validate'

@withWidth()
@connect(
  null,
  { updateProfile }
)
@reduxForm({
  form: 'profile',
  validate: profileValidator,
})
@withTheme
export default class ProfileDescription extends React.Component {
  state = {
    detailOpen: false,
  }

  static defaultProps = {
    onSubmit: () => {},
  }

  componentDidMount() {
    const { profile, initialize, reset } = this.props
    if (profile) {
      initialize({
        description: profile.description,
        accomplishment: profile.accomplishment,
        advantage: profile.advantage,
        experience: profile.experience,
        employees: profile.employees,
      })
      reset() // workaround
    }
  }

  submitProfile = (values) => {
    const { profile } = this.props
    const body = {}

    // 変化のある値だけ送る
    for (let name of Object.keys(values)) {
      if (values[name] !== profile[name]) {
        body[name] = values[name]
      }
    }

    return this.props.updateProfile(profile.id, body)
      .then((res) => {
        this.props.onSubmit(res.profile)
      })
  }

  render() {

    const { detailOpen, submitting } = this.state
    const { flex, user, profile, handleSubmit, title, buttonAlign, hideDetail, theme, width } = this.props
    const { common, grey } = theme.palette

    const descriptionPlaceholder = `例）こんにちは、${profile.category}事業者の${user.lastname}です。私は${profile.prefecture}で${profile.name}という（会社概要）を経営しております。
${profile.category}として○○会社様や、☓☓様向けに様々な実績がございます。

私の強みは
●（専門機器、資格）を持っていること。
●（特殊なこと、得意なこと）をできること
○○はもちろん、☓☓も対応可能です。
`
    const accomplishmentPlaceholder = `例）
●個人向け
○○様向けに☓☓を実施・施工しました。
●企業・団体
○○業者様向け☓☓を実施・施工しました。
●受賞
○○コンテストにて受賞しました。
`
    const advantagePlaceholder = `例）
○○について精通しております。
○○ではその知識が活きるかと思いますのでお気軽にご相談ください。
`
    const experiencePlaceholder = 5
    const employeesPlaceholder = 10

    const styles = {
      root: flex ? {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
      } : {},
      wrap: flex ? {
        flex: 1,
        width: '100%',
        overflowY: 'auto',
      } : {},
      content: flex ? {
        padding: '20px 0',
        margin: '0px auto',
        width: '90%',
        maxWidth: 800,
      } : {},
      text: {
        padding: '20px 0',
        fontSize: width === 'xs' ? 16 : 18,
        fontWeight: 'bold',
      },
      footer: flex ? {
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        width: '100%',
      } : {},
      footerBar: flex ? {
        display: 'flex',
        flexDirection: 'row',
        padding: '10px 0px',
        margin: '0px auto',
        width: '90%',
        maxWidth: 800,
      } : {},
    }

    const detailForm =
      <div>
        <Field textareaStyle={{height: 180}} name='accomplishment' classes={{textarea: 'accomplishmentTextArea'}} component={renderTextArea} label='これまでの実績をご記入ください' type='text' showCounter showProgress targetCount={70} placeholder={accomplishmentPlaceholder} />
        <Field textareaStyle={{height: 100}} name='advantage' classes={{textarea: 'advantageTextArea'}} component={renderTextArea} label='アピールポイント・意気込みをご記入ください' type='text' showCounter showProgress targetCount={50} placeholder={advantagePlaceholder} />
        <div style={{display: 'flex'}}>
          <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='年' name='experience' component={renderNumberInput} label='経験年数' placeholder={experiencePlaceholder} />
          <Field style={{width: 150}} inputStyle={{width: 100, marginRight: 5}} afterLabel='人' name='employees' component={renderNumberInput} label='従業員数' placeholder={employeesPlaceholder} />
        </div>
      </div>

    return (
      <form style={styles.root} onSubmit={handleSubmit(this.submitProfile)}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            {title && <div style={styles.text}>{title}</div>}
            <Field textareaStyle={{height: 200}} name='description' classes={{textarea: 'profileDescriptionTextArea'}} component={renderTextArea} label='自己紹介（事業内容・提供するサービスをご説明ください）' requireLabel={` ※必須（${descriptionMin}文字以上）`} type='text' showCounter showProgress targetCount={200} placeholder={descriptionPlaceholder} />
            {hideDetail ?
            <div style={{marginTop: '10px'}}>
              <Button onClick={() => this.setState({detailOpen: !detailOpen})}>
                <AddIcon style={{width: 16, height: 16}} />
                実績・アピールポイントを入力する（任意）
              </Button>
              <Collapse in={!!this.state.detailOpen} timeout='auto' style={{marginTop: '10px'}}>
                {detailForm}
              </Collapse>
            </div>
            : detailForm }
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            {buttonAlign === 'right' && <div style={{flex: 1}} />}
            <Button
              className='profileDescriptionSubmitButton'
              style={{minWidth: 120}}
              variant='contained'
              type='submit'
              disabled={submitting}
              color='primary'
            >
              {submitting ? '更新中' : '次へ'}
            </Button>
          </div>
        </div>
      </form>
    )
  }
}
