import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, FormSection } from 'redux-form'
import qs from 'qs'
import { withStyles, Divider } from '@material-ui/core'

import BudgetSlider from 'components/BudgetSlider'
import CreditCardInfo from 'components/CreditCardInfo'
import Notice from 'components/Notice'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'
import { MatchMoreFAQ } from './ProServiceBudgetPage'

import { updateMany } from 'modules/proService'
import { paymentInfo } from 'modules/point'
import { readAll as readNotices } from 'modules/notice'
import Loading from 'components/Loading'
import { scrollToElement } from 'lib/scroll'
import CampaignBanner from 'components/pros/CampaignBanner'

@connect(state => ({
  defaultCard: state.point.defaultCard,
  proServices: state.proService.proServices,
  user: state.auth.user,
}), { updateMany, paymentInfo, readNotices })
@reduxForm({
  form: 'proServiceBulkbudgets',
})
@withStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },
  title: {
    textAlign: 'center',
    paddingTop: 20,
    color: theme.palette.grey[800],
    fontSize: 28,
  },
  subText: {
    color: theme.palette.grey[700],
    textAlign: 'center',
    padding: '0 5px',
  },
  sectionWrap: {
    flex: 1,
    maxWidth: 800,
    width: '100%',
    margin: '0 auto',
  },
  section: {
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionRoot: {
    margin: '40px 0 10px',
  },
  confirm: {
    width: '100%',
    position: 'sticky',
    bottom: 0,
    padding: 10,
    background: theme.palette.common.white,
    borderRadius: 0,
  },
  button: {
    fontSize: 18,
    height: 50,
  },
  divider: {
    marginTop: 40,
  },
}))
export default class ProServiceBulkBudgetPage extends React.Component {
  constructor(props) {
    super(props)
    const { proServices } = props
    const budgets = {}
    const sortedIds = Object.keys(proServices).sort((a, b) => proServices[b].reqCount - proServices[a].reqCount)
    for (const id of sortedIds) {
      if (proServices[id].service.matchMoreEditable) {
        budgets[id] = proServices[id].budget
      }
    }
    this.state = {
      budgets,
      loaded: false,
    }
    this.submitLabel = props.isSetup ? '更新して次へ' : '予算設定を更新する'
  }

  componentDidMount () {
    this.props.paymentInfo()
      .then(() => this.setState({loaded: true}))
    this.props.readNotices({
      type: 'lowBudget',
    })
  }

  onChange = (serviceId) => (value) => {
    const { budgets } = this.state
    budgets[serviceId] = value
    this.setState({ budgets })
  }

  saveAndExit = () => this.submit().then(() => this.props.history.push('/account/services'))

  onSubmit = () => {
    if (!this.props.defaultCard) {
      this.setState({noCreditCard: true})
      setTimeout(() => scrollToElement(this.cardRef, -10), 100)
      return
    }
    return this.submit(true).then(this.props.next)
  }

  submit = (promo = false) => {
    const { budgets } = this.state
    const { proServices, user, isSetup, location: { search } } = this.props
    const query = qs.parse(search, {ignoreQueryPrefix: true})
    const data = {}
    for (const id in budgets) {
      data[id] = {budget: budgets[id], setupBudget: true}
      if (promo
        && isSetup
        && user.setupBusinessHour
        && proServices[id].setupLocation
        && proServices[id].setupJobRequirements
        && proServices[id].setupPriceValues
        && parseInt(query.promote, 10) === 1
      ) {
        data[id].isPromoted = true
      }
    }
    return this.props.updateMany(data)
  }

  render() {
    const { proServices, handleSubmit, classes, isSetup, user, submitting, location: { pathname } } = this.props
    const { budgets, loaded, noCreditCard } = this.state

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={submitting}
          back={this.props.back}
        >
          <h3 className={classes.title}>
            予算の設定
          </h3>
          <div className={classes.subText}>1週間の予算をサービスごとに設定しましょう</div>
          <div className={classes.sectionRoot} ref={e => this.cardRef = e}>
            <div className={classes.sectionTitle}>クレジットカード情報</div>
            {loaded ?
              <div className={classes.section}>
                {user.isInArrears ?
                  <Notice type='error'>決済に失敗しました。別のクレジットカードで試してみてください。</Notice>
                : noCreditCard ?
                  <Notice type='error'>クレジットカードを登録してください。</Notice>
                : null}
                <div className={classes.card}>
                  <CreditCardInfo onCreated={() => this.setState({noCreditCard: false})} />
                </div>
              </div>
            :
              <div className={classes.section}>
                <Loading />
              </div>
            }
          </div>
          <CampaignBanner />
          <Divider className={classes.divider} />
          <div className={classes.sectionWrap}>
            {Object.keys(budgets).map(id => {
              return (
                <div className={classes.sectionRoot} key={id} >
                  <div className={classes.sectionTitle}>{proServices[id].service.name}</div>
                  <div className={classes.section}>
                    <FormSection name={id}>
                      <div className={classes.slider}>
                        <BudgetSlider isSetup={isSetup} defaultValue={budgets[id]} service={proServices[id].service} onChange={this.onChange(id)} />
                      </div>
                    </FormSection>
                  </div>
                </div>
              )
            })}
          </div>
          <MatchMoreFAQ />
        </ProServiceContainer>
      </form>
    )
  }
}
