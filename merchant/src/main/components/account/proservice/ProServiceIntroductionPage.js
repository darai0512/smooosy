import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core'
import AssignmentIcon from '@material-ui/icons/Assignment'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import { orange, green } from '@material-ui/core/colors'

import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice/ProServiceProgress'

@connect(
  state => ({
    defaultCard: state.point.defaultCard,
    proService: state.proService.proService,
    user: state.auth.user,
  })
)
@reduxForm({
  form: 'proServiceIntroduction',
})
@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    fontSize: 32,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
      alignItems: 'center',
    },
  },
  msg: {
    marginTop: 20,
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
  item: {
    marginBottom: 10,
  },
  assign: {
    color: orange[500],
    width: 120,
    height: 120,
    [theme.breakpoints.down('xs')]: {
      width: 80,
      height: 80,
    },
  },
  list: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  doneList: {
    fontWeight: 'bold',
    fontSize: 20,
    color: green[500],
  },
  align: {
    display: 'flex',
    alignItems: 'center',
  },
  doneIcon: {
    width: 32,
    height: 32,
    marginLeft: 5,
  },
}))
export default class ProServiceIntroduction extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      prevPage: '/account/services',
      submitLabel: '次へ',
    }
  }

  submit = () => {
    const { defaultCard, proService, user, match: { params: { id } } } = this.props
    const { setupDescriptions, setupLocation, setupJobRequirements, setupPriceValues, setupBudget } = proService
    if (!user.setupBusinessHour) {
      return this.props.history.push(`/setup-services/${id}/business-hour`)
    } if (!setupDescriptions) {
      return this.props.history.push(`/setup-services/${id}/descriptions`)
    } else if (!setupLocation) {
      return this.props.history.push(`/setup-services/${id}/locations`)
    } else if (!setupJobRequirements) {
      return this.props.history.push(`/setup-services/${id}/job-requirements`)
    } else if (!setupPriceValues) {
      return this.props.history.push(`/setup-services/${id}/prices`)
    } else if (!setupBudget || !defaultCard) {
      return this.props.history.push(`/setup-services/${id}/budgets`)
    }
  }

  render () {
    const { location: { pathname }, defaultCard, proService, user, classes, handleSubmit, submitting } = this.props
    const { submitLabel, prevPage } = this.state
    const service = proService.service

    const lists = [
      {name: '営業時間', condition: user.setupBusinessHour},
      {name: 'サービス別自己紹介', condition: proService.setupDescriptions},
      {name: '仕事エリア', condition: proService.setupLocation},
      {name: '仕事条件', condition: proService.setupJobRequirements},
      {name: '価格', condition: proService.setupPriceValues},
      {name: '予算', condition: proService.setupBudget && defaultCard},
    ]


    return (
      <form className={classes.root} onSubmit={handleSubmit(this.submit)}>
        <ProServiceContainer
          stepper={<ProServiceProgress pathname={pathname} />}
          submitLabel={submitLabel}
          submitDisabled={submitting}
          prevPage={prevPage}
        >
          <h3 className={classes.title}>
            {service.name}の設定をしましょう
          </h3>
          <div className={classes.container}>
            <div className={classes.msg}>
              <div>ご指名を受けるためには<span className={classes.bold}>以下の設定</span>をする必要があります。</div>
              <ol>
                {lists.map(l => (
                  l.condition ?
                    <li key={l.name} className={classes.doneList}><div className={classes.align}>{l.name}<CheckCircleIcon className={classes.doneIcon} /></div></li>
                    : <li key={l.name} className={classes.list}>{l.name}</li>
                ))}
              </ol>
            </div>
            <AssignmentIcon className={classes.assign}/>
          </div>
        </ProServiceContainer>
      </form>
    )
  }
}
