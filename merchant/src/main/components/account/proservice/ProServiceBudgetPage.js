import React from 'react'
import qs from 'qs'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Collapse from '@material-ui/core/Collapse'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'

import { update as updateProService } from 'modules/proService'
import { paymentInfo } from 'modules/point'

import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice/ProServiceProgress'
import BudgetSlider from 'components/BudgetSlider'
import CreditCardInfo from 'components/CreditCardInfo'
import Notice from 'components/Notice'
import CampaignBanner from 'components/pros/CampaignBanner'
import { readAll as readNotices } from 'modules/notice'
import { scrollToElement } from 'lib/scroll'

@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '20px 0',
    color: theme.palette.grey[800],
  },
  slider: {
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    margin: '20px 0',
    padding: 20,
  },
  card: {
    marginTop: 10,
    background: theme.palette.common.white,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
  },
  cardInfo: {
    marginBottom: 20,
  },
}))
@reduxForm({
  form: 'proServiceBudget',
})
@connect(
  state => ({
    defaultCard: state.point.defaultCard,
    proService: state.proService.proService,
    user: state.auth.user,
  }),
  { updateProService, paymentInfo, readNotices }
)
export default class ProServiceBudgetPage extends React.Component {

  constructor(props) {
    super(props)
    const {
      location: { pathname },
      proService: { budget },
      match: { params: { id } },
    } = props

    const isSetup = /setup\-services/.test(pathname)
    this.state = {
      isSetup,
      loaded: false,
      prevPage: isSetup ? `/setup-services/${id}/prices` : `/account/services/${id}`,
      nextPage: isSetup ? `/setup-services/${id}/complete` : `/account/services/${id}`,
      submitLabel: '予算を更新する',
    }

    this.props.initialize({budget: budget || 0})
  }

  componentDidMount () {
    this.props.paymentInfo()
      .then(() => this.setState({loaded: true}))
    this.props.readNotices({
      type: 'lowBudget',
    })
  }

  onChange = (value) => {
    this.props.change('budget', value)
  }

  saveAndExit = values => {
    this.props.updateProService(
      this.props.match.params.id,
      {budget: values.budget, setupBudget: true}
    ).then(() => this.props.history.push('/account/services'))
  }

  submit = values => {
    const { defaultCard, updateProService, match: { params: { id } }, location: { search } } = this.props
    const { isSetup, nextPage } = this.state
    const query = qs.parse(search, {ignoreQueryPrefix: true})
    if (!defaultCard) {
      this.setState({noCreditCard: true})
      setTimeout(() => scrollToElement(this.cardRef, -10), 100)
      return
    }

    updateProService(id, {
      budget: values.budget,
      setupBudget: true,
      isPromoted: isSetup && parseInt(query.promo, 10) === 1,
    }).then(() => this.props.history.push(nextPage))
  }

  render () {
    const { location: { pathname }, proService, handleSubmit, classes,  user: { isInArrears } } = this.props
    const { loaded, submitLabel, prevPage, noCreditCard } = this.state
    const service = proService.service
    const isSetup = /setup\-services/.test(pathname)

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.submit)}>
        <ProServiceContainer
          stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={submitLabel}
          prevPage={prevPage}
        >
          <h3 className={classes.title}>{service.name}の予算を設定しましょう</h3>
          <div className={classes.slider}>
            <BudgetSlider isSetup={isSetup} defaultValue={proService.budget} service={service} onChange={this.onChange} />
          </div>
          {loaded &&
            <div className={classes.cardInfo} ref={e => this.cardRef = e}>
              {isInArrears ?
                <Notice type='error'>決済に失敗しました。別のクレジットカードで試してみてください。</Notice>
              : noCreditCard ?
                <Notice type='error'>クレジットカードを登録してください。</Notice>
              : null}
              <div className={classes.card}>
                <CreditCardInfo onCreated={() => this.setState({noCreditCard: false})} />
              </div>
            </div>
          }
          <CampaignBanner />
          <MatchMoreFAQ profile={proService.profile} service={proService.service} />
        </ProServiceContainer>
      </form>
    )
  }
}

@withStyles((theme) => ({
  root: {
    marginTop: 20,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
  },
  list: {
    padding: 0,
  },
  title: {
    fontSize: 16,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    fontWeight: 'bold',
  },
  body: {
    margin: 0,
    opacity: 1,
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  space: {
    marginTop: 20,
  },
}))
@connect(state => ({user: state.auth.user}))
export class MatchMoreFAQ extends React.Component {

  constructor(props) {
    super(props)
    const { service, profile = {}, classes, user } = props
    this.state = {
      open: [],
    }
    const name = profile.name || user.lastname

    this.faqs = [
      {title: '定額課金ですか？',
        body:
          <>
            <div>定額課金ではありません。「予算」を設定していただくと、その予算の範囲内でSMOOOSYでのマッチが行われます。設定した予算を超えて請求されることはありません。また、予算はいつでも再設定することができます。</div>
            <div className={classes.space}>予算の消費額は毎週月曜日にリセットされます。その時点で未使用の予算がある場合でも、翌週には繰り越しされないため、翌週の予算が高くなるということはありません。</div>
          </>,
      },
      {title: '予算は何に対して設定しますか？',
        body:
        <div>
          {service ? '現在{service.name}の予算を設定しています。' : ''}ご指名方式をご利用になるサービスごとに個別の予算を設定します。個別に予算を設定することで、それぞれのサービスに対して支出を管理することができます。
        </div>,
      },
      {title: '予算の上限に達したらどうなりますか？',
        body:
        <>
          <div>予算の上限に達すると、{name}様のプロフィールが{service ? `${service.name}の` : ''}依頼者に表示されなくなり、ご指名を受けることができなくなります。この場合は、{name}様にメールでお知らせします。予算を増やすことによって、再度依頼者にプロフィールを表示させることができます。</div>
          <div className={classes.space}>また、予算の消費額は月曜日にリセットされ、リセット以降は再度、検索結果に表示されるようになります。</div>
        </>,
      },
      {title: 'ご指名方式とは？',
        body:
        <ul>
          <li>ご指名方式を利用すると、依頼者の検索画面に、直接{name}様のプロフィールが表示されます。</li>
          <li>依頼者は、条件に合うプロを直接「指名」して連絡できます。</li>
          <li>依頼者からご指名で連絡があったとき、または依頼者に返信したときに、{name}様はポイントを消費します。</li>
          <li>費用がかかるのは前述のタイミングのみで、成約手数料などはかかりません。</li>
          <li>依頼者様は、事業者様のプロフィールや価格などを見た上で連絡するため、成約につながりやすくなります。</li>
          <li>ご指名方式の予算はいつでも再設定できます。</li>
        </ul>,
      },
      {title: 'ご指名方式のメリット・デメリットは？',
        body:
        <>
          <div>メリット：依頼者は事業者様のプロフィールや価格を見た上でご指名されるため、成約の可能性が高くなります。また、都度応募メッセージを作成する手間がなくなります。</div>
          <div className={classes.space}>デメリット：マッチ条件やスケジュールのアップデートをしていただく必要があります。</div>
        </>,
      },
      {title: 'ラクラクお得モードとは？',
        body:
        <>
          <div>ラクラクお得モードONの方は、OFFの方に比べ、検索結果の上位に表示されます。また、各案件で消費するポイント数は、OFFの方に比べ、20%割引されるため、とてもお得になります。一方で、ONにした場合は、依頼者からご指名があった場合すぐにポイントの消費が発生します。</div>
          <div className={classes.space}>ラクラクお得モードOFFの方は、ONの方に比べ、検索結果の下位に表示されます。また、消費ポイント数の割引は適用されません。一方で、OFFにした場合は、依頼者からのご指名に返信した場合にポイントの消費が発生します。依頼者からのご指名を辞退した場合は、ポイントは消費されません。</div>
          <div className={classes.space}>案件をたくさん獲得されたい方は、きちんと仕事条件やスケジュールを設定した上で、ラクラクお得モードをONにすることをおすすめします。設定をきちんとすることで、引き受けられない案件で指名をされて、ポイントを無駄に消費することが少なくなります。</div>
        </>,
      },
      {title: '毎週の予算サイクルは？',
        body:
        <>
          <div>予算サイクルは、月曜日午前0時にリセットされて、つぎの月曜日午前0時まで続きます。週の途中で予算の上限に達した場合、いつでも予算を増やして再度依頼者のご指名を受けることができます。</div>
          <div className={classes.space}>未使用の予算がある場合でも翌週には繰り越しされないため、翌週の予算が高くなるということはありません。</div>
        </>,
      },
      {title: '予算は変更できますか？',
        body:
        <>
          <div>予算はいつでも変更することができます。予算を増やした場合、すぐに反映されて、再度依頼者のご指名を受けられるようになります。</div>
          <div className={classes.space}>予算を引き下げた場合は、ご指名の件数を減らして更新された予算内に収まるように調整されます。週の半ばで予算を引き下げて、その週すでに引き下げられた予算を超えるポイント消費があった場合は、ポイントの返還はされません。</div>
        </>,
      },
    ]
  }

  handleClick = (idx) => {
    let open = this.state.open
    open[idx] = !open[idx]
    this.setState({ open })
  }

  render () {
    const { classes } = this.props
    const { open } = this.state

    return (
      <div className={classes.root}>
        <h3 className={classes.header}>よくある質問</h3>
        <List className={classes.list}>
          {this.faqs.map((faq, idx) => (
            <div key={`faq_${idx}`}>
              <ListItem
                button
                className={classes.title}
                onClick={() => this.handleClick(idx) }
              >
                <ListItemText primary={faq.title} />
                {open[idx] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={open[idx]} timeout='auto' unmountOnExit>
                <ListItem key={`body_${idx}`} className={classes.body} disabled={true}>
                  <div>
                    {faq.body}
                  </div>
                </ListItem>
              </Collapse>
            </div>
          )
          )}
        </List>
      </div>
    )
  }
}
