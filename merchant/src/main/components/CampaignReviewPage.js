import React from 'react'
import { connect } from 'react-redux'
import { withWidth, withStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import LinearProgress from '@material-ui/core/LinearProgress'
import { amber, red } from '@material-ui/core/colors'
import { load as loadMeet } from 'modules/meet'
import { review, updateReview } from 'modules/meet'
import { sendLog } from 'modules/auth'

import Loading from 'components/Loading'
import RatingStar from 'components/RatingStar'
import CampaignReviewTerm from 'components/CampaignReviewTerm'
import renderTextArea from 'components/form/renderTextArea'
import { imageOrigin, BQEventTypes } from '@smooosy/config'
import { withRollOut } from 'contexts/rollOut'

const TextArea = renderTextArea

@withRollOut
@withWidth()
@withStyles((theme) => ({
  root: {
    position: 'reletive',
    paddingTop: 60,
  },
  term: {
    maxWidth: 800,
  },
  contents: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 60,
  },
  title: {
    wordBreak: 'keep-all',
  },
  titleSub: {
    color: theme.palette.grey[300],
  },
  content: {
    padding: 10,
    maxWidth: 800,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ratingStar: {
    width: 300,
    margin: '0 auto',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 800,
  },
  completeIcon: {
    width: 180,
    height: 180,
    margin: 20,
  },
  banner: {
    background: amber[500],
    textAlign: 'center',
    wordBreak: 'keep-all',
    fontWeight: 'bold',
    fontSize: 14,
    padding: 5,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  bannerDeadline: {
    color: theme.palette.red[500],
  },
}))
@connect(
  state => ({
    user: state.auth.user,
    meet: state.meet.meet,
  }),
  { loadMeet, review, updateReview, sendLog }
)
export default class CampaignReviewPage extends React.Component {

  getTempData = () => {
    let campaignReviews = {}
    try {
      campaignReviews = JSON.parse(localStorage.campaignReviews || '{}')
    } catch (e) {
      campaignReviews = {}
    }

    return campaignReviews
  }

  saveTempData = (key, value) => {
    let campaignReviews = this.getTempData()
    if (!campaignReviews[this.props.match.params.id]) {
      campaignReviews[this.props.match.params.id] = {}
    }
    campaignReviews[this.props.match.params.id][key] = value
    localStorage.campaignReviews = JSON.stringify(campaignReviews)
  }

  removeTempData = (key) => {
    const meetId = this.props.match.params.id
    const campaignReviews = this.getTempData()
    if (campaignReviews[meetId] && campaignReviews[meetId][key]) {
      delete campaignReviews[meetId][key]
      localStorage.campaignReviews = JSON.stringify(campaignReviews)
    }
  }

  constructor(props) {
    super(props)

    const campaignReviews = this.getTempData()
    const campaignReview = campaignReviews[this.props.match.params.id] || {}
    this.state = {
      step: parseInt(this.props.match.params.idx) || 0,
      rating: campaignReview.rating || null,
      episode: campaignReview.episode || '',
      decision: campaignReview.decision || '',
      evaluation: campaignReview.evaluation || '',
      thanks: true,
      error: null,
      submitError: null,
    }

    this.episodePlaceholder = '今回依頼した〇〇を以前は自分でしたことがありますが、想像以上に時間や手間がかかってしまいとても大変でした。今回は時間があまりなかったこともあり、プロに依頼した方が安上がりかもしれないし仕事も確実だと思っていたので、今回思い切って依頼することにしました。'
    this.decisionPlaceholder = '良心的な価格設定と、柔軟なサービス提供です。〇〇や〇〇といったわがままにも対応していただき私のニーズにぴったりのサービスが受けられるというのが一番の決め手でした。また、これらのやりとりをチャットで行いましたがレスポンスも素早く丁寧で、不安な事もすぐに解決できたので信頼できるプロだと感じました。'
    this.evaluationPlaceholder = '打ち合わせや当日は、やりとりをしていた時と同じくとても親切で人当たりが良かったので安心しました。仕事も迅速でとても気遣いのできる方でこのプロに依頼して良かったと思います。また、自分では想像していなかった〇〇の提案もしていただき感謝しています。また次の機会があれば是非お願いしたいです。'

    this.actions = [
      {prevLabel: '戻る', nextLabel: '次へ'},
      {prevLabel: '戻る', nextLabel: '次へ'},
      {prevLabel: '戻る', nextLabel: '送信する'},
      {prevLabel: '戻る', nextLabel: '追記する'},
      {prevLabel: '戻る', nextLabel: '追記する'},
      {nextLabel: '閉じる'},
    ]
  }

  componentDidMount() {
    const rollouts = this.props.rollouts || {}
    if (!rollouts.enableReviewCampaign || this.state.step < 0 || this.state.step >= this.actions.length) {
      this.props.history.replace('/requests')
      return
    }
    this.props.loadMeet(this.props.match.params.id).then(() => {
      if (this.state.step >= 1) {
        const moveStep = this.getMoveStep(0)
        if (this.state.step != moveStep) {
          this.setState({step: moveStep})
          this.props.history.replace(`/reviews/${this.props.match.params.id}/${moveStep}`)
        }
      }
    })

    if (this.state.step === 0) {
      this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
        component: 'form',
        index: 0,
        action_type: 'open',
      })
    }
  }

  componentDidUpdate() {
    const step = parseInt(this.props.match.params.idx) || 0
    if (step >= this.actions.length) {
      this.props.history.replace('/requests')
      return
    }
    if (this.state.step !== step) {
      this.setState({step})
    }
  }

  goBack = () => {
    const { meet } = this.props
    this.props.history.replace(`/requests/${meet.request._id}/responses/${meet._id}`, {backFromReviewCampaign: true})
  }

  getMoveStep = (move = 0) => {
    const { step } = this.state
    const { meet } = this.props
    if (!meet) return 0

    const isReviewExists = !!(meet.review && meet.review.details)
    const reviewStep = isReviewExists ? meet.review.details.length + 2 : 0

    if (move === 0) { // stay (just check)
      if (isReviewExists) {
        if (step >= 1 && reviewStep !== step) {
          return reviewStep
        }
      } else {
        if (step >= 3) {
          return 0
        }
      }
    } else if (move > 0) { // next
      if (isReviewExists && step + move < reviewStep) {
        return reviewStep
      }
    } else { // back
      if (step >= 3) {
        return 0
      }
    }
    return step + move
  }

  prevStep = () => {
    if (this.state.step === 0) {
      this.goBack()
    } else {
      this.prev()
    }
  }

  nextStep = () => {
    const { step, rating, episode, decision, evaluation, thanks } = this.state
    const { user } = this.props

    if (step === 5) {
      this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
        component: 'form',
        index: this.state.step,
        action_type: 'close',
      })
      this.goBack()
    } else if (step === 4) {
      // meets.js の API 側でも確認をしているため、注意
      // 今後もキャンペーンをしていくなら共通化する
      if (decision.length < 100) {
        this.setState({error: '※文字数が足りません'})
        return
      }

      const details = [
          { title: '選んだ決め手', answer: decision },
      ]
      // レビュー追記
      this.props.updateReview(this.props.match.params.id, {details})
        .then(() => {
          this.removeTempData('decision')
          this.next()
        })
        .catch(() => {
          this.setState({submitError: 'エラーが発生しました。お手数ですがやり直してください。'})
        })
    } else if (step === 3) {
      if (episode.length < 100) {
        this.setState({error: '※文字数が足りません'})
        return
      }

      const details = [
        { title: '依頼した背景', answer: episode },
      ]
      // レビュー追記
      this.props.updateReview(this.props.match.params.id, {details})
        .then(() => {
          this.removeTempData('episode')
          this.next()
        })
        .catch(() => {
          this.setState({submitError: 'エラーが発生しました。お手数ですがやり直してください。'})
        })
    } else if (step === 2) {
      if (evaluation.length < 100) {
        this.setState({error: '※文字数が足りません'})
        return
      }

      const details = [
        { title: '仕事内容', answer: evaluation },
      ]
      // レビュー送信処理
      this.props.review(this.props.match.params.id, {rating, user: user.id, username: user.lastname, thanks, details})
        .then(() => {
          this.removeTempData('rating')
          this.removeTempData('evaluation')
          this.next()
        })
        .catch(() => {
          this.setState({submitError: 'エラーが発生しました。お手数ですがやり直してください。'})
        })
    } else if (step === 1) {
      if (!rating) {
        this.setState({error: '※評価の選択は必須です'})
        return
      }
      this.next()
    } else {
      this.next()
    }
  }

  prev = () => {
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'form',
      index: this.state.step,
      action_type: 'back',
    })
    const step = this.getMoveStep(-1)
    this.props.history.replace(`/reviews/${this.props.match.params.id}/${step}`)
    this.setState({ step, submitError: null })
  }

  next = () => {
    this.props.sendLog(BQEventTypes.web.REVIEW_CAMPAIGN, {
      component: 'form',
      index: this.state.step,
      action_type: 'next',
    })
    const step = this.getMoveStep(1)
    this.props.history.replace(`/reviews/${this.props.match.params.id}/${step}`)
    this.setState({ step })
  }

  handleRating = (rating) => {
    this.saveTempData('rating', rating)
    this.setState({rating, error: null})
  }

  onChangeEpisode = (e) => {
    this.saveTempData('episode', e.target.value)
    this.setState({episode: e.target.value, error: null})
  }

  onChangeDecision = (e) => {
    this.saveTempData('decision', e.target.value)
    this.setState({decision: e.target.value, error: null})
  }

  onChangeEvaluation = (e) => {
    this.saveTempData('evaluation', e.target.value)
    this.setState({evaluation: e.target.value, error: null})
  }

  render () {
    const { meet, classes, width } = this.props
    const { step, rating, episode, decision, evaluation, thanks, error, submitError } = this.state

    if (!meet) return <Loading />
    const profile = meet.profile

    const styles = {
      caption: {
        marginTop: width == 'xs' ? 0 : 20,
        fontSize: width == 'xs' ? 12 : 16,
      },
      rateHeader: {
        margin: width == 'xs' ? '10px 0' : '20px 0',
        fontSize: width == 'xs' ? 16 : 20,
      },
      formHeader: {
        margin: width == 'xs' ? '10px 0' : '20px 0',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'left',
        fontSize: width == 'xs' ? 12 : 20,
        textAlign: 'left',
      },
      question: {
        fontSize: width == 'xs' ? 16 : 20,
        fontWeight: 'bold',
      },
      limit: {
        fontSize: width == 'xs' ? 12 : 14,
      },
      textArea: {
        minHeight: 200,
        fontSize: width == 'xs' ?  14 : 16,
      },
      tail: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
      },
      error: {
        color: red[500],
      },
      submitError: {
        marginTop: 20,
        color: red[500],
      },
    }

    const questionHeader = (i) => (
      <div style={styles.formHeader}>
        <div className={[classes.title, i === 1 ? null : classes.titleSub].join(' ')}>
        <span style={styles.question}>１．事業者の仕事はいかがでしたか？</span>
          <span style={styles.limit}>※100文字以上</span>
        </div>
        {i > 1 &&
        <>
          <div className={[classes.title, i === 2 ? null : classes.titleSub].join(' ')}>
            <span style={styles.question}>２．依頼した背景は何ですか？</span>
            <span style={styles.limit}>※100文字以上</span>
          </div>
          <div className={[classes.title, i === 3 ? null : classes.titleSub].join(' ')}>
            <span style={styles.question}>３．事業者を選んだ決め手は何ですか？</span>
            <span style={styles.limit}>※100文字以上</span>
          </div>
        </>
        }
      </div>
    )

    return (
      <div className={classes.root}>
        {(step === 3 || step === 4) && <div className={classes.banner}>
          {`もう${5 - step}問回答して Amazon ギフト券をもらおう！`}
          <span className={classes.bannerDeadline}>6/30(日)まで</span>
        </div>}
        {step > 0 && <LinearProgress variant='determinate' value={100 * (step - 1) / (this.actions.length - 2)} />}
        <div className={classes.contents}>
          {step === 0 ?
              <div className={classes.term}>
                <CampaignReviewTerm showTitle />
              </div>
            : step === 1 ?
              <div className={classes.content}>
                <div style={styles.caption}>「{profile.name}」様のクチコミにご協力ください</div>
                <h2 style={styles.rateHeader}>{profile.name}様はいかがでしたか？</h2>
                <div className={classes.ratingStar}>
                  <RatingStar canChange rating={rating} onChange={this.handleRating} />
                </div>
                <div style={styles.error}>{error}</div>
              </div>
            : step === 2 ?
              <div className={classes.content}>
                <div style={styles.caption}>「{profile.name}」様のクチコミにご協力ください</div>
                {questionHeader(1)}
                <div className={classes.form}>
                  <TextArea value={evaluation} placeholder={this.evaluationPlaceholder} onChange={this.onChangeEvaluation} textareaStyle={styles.textArea} />
                  <div style={styles.tail}>
                    <div>
                      <div style={styles.error}>{error}</div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            style={{height: 'auto'}}
                            checked={thanks}
                            onChange={(e) => this.setState({thanks: e.target.checked})} />
                        }
                        label='ありがとうも一緒に送る'
                      />
                    </div>
                    <div>{evaluation.length}文字</div>
                  </div>
                  <div style={styles.submitError}>{submitError}</div>
                </div>
              </div>
            : step === 3 ?
              <div className={classes.content}>
                <div style={styles.caption}>「{profile.name}」様のクチコミにご協力ください</div>
                {questionHeader(2)}
                <div className={classes.form}>
                  <TextArea value={episode} placeholder={this.episodePlaceholder} onChange={this.onChangeEpisode} textareaStyle={styles.textArea}/>
                  <div style={styles.tail}>
                    <div style={styles.error}>{error}</div>
                    <div>{episode.length}文字</div>
                  </div>
                  <div style={styles.submitError}>{submitError}</div>
                </div>
              </div>
            : step === 4 ?
              <div className={classes.content}>
                <div style={styles.caption}>「{profile.name}」様のクチコミにご協力ください</div>
                {questionHeader(3)}
                <div className={classes.form}>
                  <TextArea value={decision} placeholder={this.decisionPlaceholder} onChange={this.onChangeDecision} textareaStyle={styles.textArea} />
                  <div style={styles.tail}>
                    <div style={styles.error}>{error}</div>
                    <div>{decision.length}文字</div>
                  </div>
                  <div style={styles.submitError}>{submitError}</div>
                </div>
              </div>
            : step === 5 ?
              <div className={classes.content}>
                <h2 style={{fontSize: width == 'xs' ? 18 : 20}}>ご協力ありがとうございました！</h2>
                <img className={classes.completeIcon} src={`${imageOrigin}/static/users/present.png`} />
                <div>ギフト券につきましてはキャンペーン終了後、順次送付いたします。</div>
              </div>
            : null
          }
        </div>
        <CampaignFooter
          prevLabel={this.actions[step].prevLabel}
          nextLabel={this.actions[step].nextLabel}
          prevStep={this.prevStep}
          nextStep={this.nextStep} />
      </div>
    )
  }
}

let CampaignFooter = ({classes, prevLabel, nextLabel, prevStep, nextStep}) => (
  <div className={classes.root}>
    <div className={classes.actions}>
      {prevLabel ? <Button className={classes.actionButton} onClick={prevStep} >{prevLabel}</Button> : <div />}
      <Button className={classes.actionButton} size='medium' variant='contained' color='primary' onClick={nextStep}>{nextLabel}</Button>
    </div>
  </div>
)

CampaignFooter = withStyles((theme) => ({
  root: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
    background: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    display: 'flex',
    justifyContent: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    padding: 10,
  },
  actionButton: {
    minWidth: 100,
  },
}))(CampaignFooter)
