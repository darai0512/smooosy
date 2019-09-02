import React from 'react'
import ReactGA from 'react-ga'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Field, reduxForm, SubmissionError } from 'redux-form'
import { RadioGroup, Radio, Checkbox, FormControlLabel } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { orange } from '@material-ui/core/colors'
import LockIcon from '@material-ui/icons/Lock'

import { createByUser } from 'modules/meet'
import { searchInstantResults } from 'modules/proService'
import { update as updateUser, checkLineFriend, sendLog } from 'modules/auth'
import { update as updateRequest } from 'modules/request'
import renderTextInput from 'components/form/renderTextInput'
import LineLogin from 'components/LineLogin'
import LineFriendLink from 'components/LineFriendLink'
import ProSummary from 'components/ProSummary'
import PriceBreakdown from 'components/PriceBreakdown'
import UserAvatar from 'components/UserAvatar'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { passwordValidator, phoneValidator } from 'lib/validate'
import { zenhan } from 'lib/string'
import { FlowTypes, BQEventTypes } from '@smooosy/config'
import { scheduleConflictReason } from 'lib/proService'
import { getBoolValue } from 'lib/runtimeConfig'

@connect(
  state => ({
    user: state.auth.user,
    isLineFriend: state.auth.isLineFriend,
    instantResults: state.proService.instantResults,
    request: state.request.request,
    mustPhone: getBoolValue(
      'mustPhone',
      state.runtimeConfig.runtimeConfigs
    ),
  }),
  { updateUser, checkLineFriend, updateRequest, searchInstantResults, createByUser, sendLog }
)
@reduxForm({
  form: 'thanks',
  validate: values => ({
    ...passwordValidator(values.newpassword, 'newpassword'),
    ...phoneValidator(zenhan(values.phone)),
  }),
})
@withStyles(theme => ({
  root: {
    background: theme.palette.grey[50],
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    maxHeight: 500,
    overflowY: 'auto',
    background: theme.palette.grey[50],
    flexGrow: 1,
    padding: '0 24px 24px',
    [theme.breakpoints.down('xs')]: {
      maxHeight: 'inherit',
      padding: '0 16px 16px',
    },
  },
  name: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
  },
  comments: {
    display: 'flex',
    color: theme.palette.grey[500],
    fontSize: 13,
  },
  secureIcon: {
    width: 18,
    height: 18,
    color: orange[500],
    marginRight: 10,
  },
  segment: {
    display: 'flex',
    flexDirection: 'row',
  },
  inputPadding: {
    margin: '10px 0',
  },
  line: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    marginRight: 10,
  },
  avatar: {
    marginLeft: 5,
    marginRight: 5,
  },
  sent: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  recommendIntro: {
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  message: {
    fontWeight: 'bold',
  },
  recommends: {
    display: 'flex',
    padding: 20,
    border: `1px solid ${theme.palette.grey[300]}`,
    marginTop: -1,
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  recommentPro: {
    flex: 1,
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: 0,
  },
  pro: {
    display: 'flex',
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
  sendPros: {
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    [theme.breakpoints.down('xs')]: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
  },
  sendProAvatars: {
    display: 'flex',
    justifyContent: 'center',
  },
  sendProsText: {
    marginTop: 10,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
}))
@withRouter
export default class QueryCardThanks extends React.Component {

  static defaultProps = {
    onClose: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {
      corporation: 'personal',
      calendar: {},
      recommends: [],
      recommendChecked: {},
    }
  }

  componentDidMount() {
    this.props.submitRequest().then(() => {
      const { request } = this.props
      ReactGA.modalview(`/new-request/created/${this.props.service.key}`)

      const { service, profile, dialogInfo, flowType } = this.props
      const queries = service.queries
      let calendar = {}
      if (flowType === FlowTypes.PPC) {
        // InstantResultPageの検索条件に使われている質問項目で回答内容で再検索条件を作成
        const conditions = {}
        for (let [queryId, value] of Object.entries(dialogInfo || {})) {
          if (queryId === 'idx') continue
          const query = queries.find(q => q.id === queryId)
          if (query && (query.usedForPro || query.priceFactorType)) {
            if (Array.isArray(value)) {
              // 日付の場合の条件
              if (value[0].date) {
                calendar = value[0]
              }
              if (value[0].date || value.location) continue
              conditions[queryId] = {}
              for (let val of value) {
                if (val.number) {
                  conditions[queryId][val.id] = val.number
                } else if (val.checked) {
                  conditions[queryId][val.id] = true
                }
              }
            } else if (value.id) {
              conditions[queryId] = { [value.id]: true }
            }
          }
        }

        const firstLocationAnswer = Object.values(dialogInfo).find(i => i.location)
        Promise.all([
          this.props.createByUser(request.id, [profile._id]),
          firstLocationAnswer ? this.props.searchInstantResults({ serviceId: service.id, conditions, location: firstLocationAnswer.location.loc }, this.props.location.search) : Promise.resolve(),
        ])
          .then(() => {
            this.setState({request, calendar})
            setTimeout(this.checkLineLogin, 0)
          })

      } else {
        this.setState({request})
        setTimeout(this.checkLineLogin, 0)
      }


    })
    this.props.initialize({
      lastname: this.props.user.lastname,
      phone: this.props.user.phone,
    })
    // LINE友達追加チェック
    this.props.checkLineFriend()
  }

  checkLineLogin = () => {
    const { user, signup } = this.props
    // LINEでログインしたばかり
    if (user.lineId && signup) {
      this.setState({step: 1})
    } else {
      this.checkPassword()
    }
  }

  checkPassword = () => {
    // FacebookIdもしくはGoogleIdがある場合はスキップする
    if (!this.props.user.password && !(this.props.user.facebookId || this.props.user.googleId)) {
      this.setState({step: 2})
    } else {
      this.checkPhone()
    }
  }

  checkPhone = () => {
    if (!this.props.service.interview && !this.props.mustPhone) {
      this.setState({step: 3})
    } else {
      this.checkLine()
    }
  }

  checkLine = () => {
    if (!this.props.user.lineId || !this.props.isLineFriend) {
      this.setState({step: 4})
    } else {
      this.goNext()
    }
  }

  setName = ({lastname, firstname}) => {
    const { corporation } = this.state

    const body = { lastname, firstname }
    if (corporation === 'corporation') {
      delete body.firstname
      body.corporation = true
    }
    return this.props.updateUser(body).then(() => this.checkPhone())
  }

  setPassword = ({newpassword}) => {
    return this.props.updateUser({newpassword}).then(() => this.checkPassword())
  }

  setPhone = ({phone}) => {
    if (!phone) {
      this.checkLine()
      return
    }

    const errors = phoneValidator(zenhan(phone))
    if (errors.phone) {
      throw new SubmissionError(errors)
    }
    return this.props.updateRequest(this.state.request.id, {phone: zenhan(phone)}).then(() => this.checkLine())
  }

  goNext = ({force} = {}) => {
    const { user, service, profile, flowType, instantResults } = this.props
    const { calendar, request } = this.state

    if (!force && flowType === FlowTypes.PPC) {
      const recommends = instantResults.filter(proService =>
        proService.isMatchMore &&
        // 予定が合うプロ
        !scheduleConflictReason({user: proService.user, schedules: proService.schedules, date: calendar.date, start: calendar.start, end: calendar.end}) &&
        // 送信済みのプロは除外する
        proService.profile._id !== profile._id &&
        // 自分自身を除外する
        proService.user._id !== user.id
      )

      if (recommends.length) {
        this.props.sendLog(BQEventTypes.match_more.OPEN_RECOMMEND_DIALOG, {
          serviceId: service._id,
          recommends: recommends.map(ps => ps._id),
        })
        return this.setState({step: 5, recommends})
      }
    }

    this.props.onClose()
    if (this.props.onEnd) {
      this.props.onEnd(request)
    } else if (service.matchMoreEnabled) {
      this.props.history.replace(`/instant-results?serviceId=${service._id}&requestId=${request._id}`, {created: true})
    } else {
      this.props.history.push(`/requests/${request._id}/overview`, {created: true})
    }
  }

  createMeets = () => {
    const { request, recommendChecked } = this.state
    const profileIds = []
    for (let key in recommendChecked) {
      const proService = recommendChecked[key]
      if (proService) {
        profileIds.push(proService.profile._id)
      }
    }
    this.props.sendLog(BQEventTypes.match_more.CONVERSION_RECOMMEND_DIALOG, {
      serviceId: this.props.service._id,
      requestId: request._id,
      recommendChecked: Object.keys(recommendChecked),
    })
    this.props.createByUser(request.id, profileIds)
      .then(() => this.setState({step: 6}))
  }

  // LINEログインの場合名前を入れさせる
  renderForName = () => {
    const { classes, handleSubmit } = this.props
    const { corporation } = this.state

    const styles = {
      lastname: {
        marginRight: 6,
        flex: 1,
      },
      firstname: {
        marginLeft: 6,
        flex: 1,
      },
    }

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.setName)}>
        <QueryCardHeader>
          名前を設定してください
        </QueryCardHeader>
        <div className={classes.container}>
          <RadioGroup
            classes={{root: classes.segment}}
            value={corporation}
            onChange={(e, corporation) => this.setState({corporation})}
          >
            <FormControlLabel value='personal' control={<Radio color='primary' />} label='個人' />
            <FormControlLabel value='corporation' control={<Radio color='primary' />} label='法人' />
          </RadioGroup>
          {corporation === 'personal' ?  [
            <div key='personal' className={classes.name}>
              <Field name='lastname' style={styles.lastname} classes={{input: 'lastnameField'}} component={renderTextInput} label='姓（必須）' type='text' />
              <Field name='firstname' style={styles.firstname} component={renderTextInput} label='名' type='text' />
            </div>,
            <div key='privacy'>※ 苗字までをプロにお知らせします</div>,
          ] :
            <Field name='lastname' className='lastnameField' component={renderTextInput} placeholder='株式会社○○○○' label='法人名（必須）' type='text' />
          }
        </div>
        <QueryCardFooter
          className='next name'
          nextTitle='次へ'
          type='submit'
        />
      </form>
    )
  }

  renderForPassword = () => {
    const { handleSubmit, submitting, classes } = this.props
    return (
      <form className={classes.root} onSubmit={handleSubmit(this.setPassword)}>
        <QueryCardHeader>
          ログインパスワードを設定
        </QueryCardHeader>
        <div className={classes.container}>
          <Field name='newpassword' classes={{input: 'setPasswordField'}} component={renderTextInput} label='パスワード（必須）' type='password' />
        </div>
        <QueryCardFooter
          className='next password'
          disabledNext={submitting}
          nextTitle='設定する'
          type='submit'
          />
      </form>
    )
  }

  renderForPhone = () => {
    const { handleSubmit, classes } = this.props

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.setPhone)}>
        <QueryCardHeader>
          電話番号をご記入ください
        </QueryCardHeader>
        <div className={classes.container}>
          <Field classes={{input: 'phoneInputField'}} name='phone' component={renderTextInput} label='電話番号' type='tel' placeholder='00011112222' />
          <div className={classes.comments}>
            <LockIcon className={classes.secureIcon} />
            <div>見積もりをした最大5人のプロにのみ電話番号を表示します。</div>
          </div>
        </div>
        <QueryCardFooter
          className='next phone'
          nextTitle='次へ'
          type='submit'
        />
      </form>
    )
  }

  renderForLine = () => {
    const { user, flowType, classes } = this.props

    return (
      <div className={classes.root}>
        <QueryCardHeader>
          LINEでも通知を受け取れます！
        </QueryCardHeader>
        <div className={classes.container}>
          {!user.lineId ?
            <div className={classes.line}>
              LINEで「SMOOOSY」を友だち追加して、LINEで見積もりを受け取りましょう。
              <LineLogin label='LINEで受け取る' page={`/requests/${this.state.request.id}/overview`} />
            </div>
          : !this.props.isLineFriend ?
            <div className={classes.line}>
              まだ友だち追加していません。「SMOOOSY」を友だち追加して見積もりを受け取りましょう。
              <LineFriendLink />
            </div>
          :
            <div className={classes.line}>
              連携完了しました！
              {flowType !== FlowTypes.PPC && 'プロからの見積もりが届きましたらLINEでお知らせします。'}
            </div>
          }
        </div>
        <QueryCardFooter
          className={`skip done line ${classes.nextButton}`}
          onNext={() => this.goNext()}
          nextTitle={user.lineId ? '完了' : 'スキップ'}
        />
      </div>
    )
  }

  onUpdateRecomment = (proService, checked) => {
    const { recommendChecked, recommends } = this.state
    const update = Object.assign(recommendChecked)
    update[proService._id] = checked ? recommends.find(r => r._id === proService._id) : null
    this.setState({recommendChecked: update})
  }

  renderForRecommend = () => {
    const { profile, classes } = this.props
    const { recommends, recommendChecked } = this.state
    const checked = Object.keys(recommendChecked).filter(key => recommendChecked[key])

    return (
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classes.sent}>
            <UserAvatar user={profile.pro} className={classes.avatar} alt={profile.name} />
            <div className={classes.sendProsText}>依頼の送信が完了しました</div>
          </div>
          <div className={classes.recommendIntro}>
            <div className={classes.message}>同時に別のプロに依頼することもできます。</div>
            <div>あなたの条件に基づいてマッチするプロを選びました。</div>
          </div>
          {recommends.map(proService =>
            <div key={proService._id} className={classes.recommends}>
              <FormControlLabel
                className={classes.checkbox}
                control={
                  <Checkbox
                    checked={!!recommendChecked[proService._id]}
                    disabled={checked.length >= 4 && !recommendChecked[proService._id]}
                    onChange={e => this.onUpdateRecomment(proService, e.target.checked)}
                  />
                }
              />
              <div className={classes.recommentPro} onClick={() => this.onUpdateRecomment(proService, !recommendChecked[proService._id])}>
                <div className={classes.pro}>
                  <ProSummary user={proService.user} profile={proService.profile} hideAddress showOnline />
                </div>
                <div>
                  {proService.price && proService.price.total > 0 ?
                    <PriceBreakdown highlightTotal price={proService.price} />
                  :
                    '価格を問い合わせる'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
        <QueryCardFooter
          className={`done recommend ${classes.nextButton}`}
          onNext={() => checked.length === 0 ? this.goNext({force: true}) : this.createMeets()}
          nextTitle={checked.length === 0 ? '今はしない' : '依頼する'}
        />
      </div>
    )
  }

  renderForSentMeets = () => {
    const { profile, classes } = this.props
    const { recommendChecked } = this.state
    const checked = Object.keys(recommendChecked).filter(key => recommendChecked[key])

    return (
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classes.sendPros}>
            <div className={classes.sendProAvatars}>
              <UserAvatar user={profile.pro} className={classes.avatar} alt={profile.name} />
              {checked.map(key => {
                const proService = recommendChecked[key]
                return (
                  <UserAvatar key={proService._id} user={proService.user} className={classes.avatar} alt={proService.profile.name} />
                )
              })}
            </div>
            <div className={classes.sendProsText}>{checked.length + 1}人に依頼をしました</div>
          </div>
        </div>
        <QueryCardFooter
          className={`done finish ${classes.nextButton}`}
          onNext={() => this.goNext({force: true})}
          nextTitle='完了'
        />
      </div>
    )
  }

  render() {
    if (!this.state.step) {
      return null
    } else if (this.state.step === 1) {
      return this.renderForName()
    } else if (this.state.step === 2) {
      return this.renderForPassword()
    } else if (this.state.step === 3) {
      return this.renderForPhone()
    } else if (this.state.step === 4) {
      return this.renderForLine()
    } else if (this.state.step === 5) {
      return this.renderForRecommend()
    } else if (this.state.step === 6) {
      return this.renderForSentMeets()
    }

    return null
  }
}
