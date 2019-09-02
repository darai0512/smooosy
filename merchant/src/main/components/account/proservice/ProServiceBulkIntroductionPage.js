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
    proServices: state.proService.proServices,
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
    const { user, proServices } = props
    this.matchMoreProServiceIds = Object.keys(props.proServices).filter(id => proServices[id].service.matchMoreEditable)
    this.lists = [
      {name: '営業時間', condition: user.setupBusinessHour},
      {name: '仕事エリア', condition: this.matchMoreProServiceIds.every(id => proServices[id].setupLocation)},
      {name: '仕事条件', condition: this.matchMoreProServiceIds.every(id => proServices[id].setupJobRequirements)},
      {name: '価格', condition: this.matchMoreProServiceIds.every(id => proServices[id].setupPriceValues)},
      {name: '予算', condition: this.matchMoreProServiceIds.every(id => proServices[id].setupBudget)},
    ]
    this.state = {
      submitLabel: '次へ',
    }
  }

  submit = () => {
    const { defaultCard } = this.props
    const [{condition: setupBusinessHour}, {condition: setupLocation}, {condition: setupJobRequirements}, {condition: setupPriceValues}, {condition: setupBudget}] = this.lists
    if (!setupBusinessHour) {
      return this.props.history.push('/setup-services/bulk/business-hour')
    } else if (!setupLocation) {
      return this.props.history.push('/setup-services/bulk/locations')
    } else if (!setupJobRequirements) {
      return this.props.history.push('/setup-services/bulk/job-requirements')
    } else if (!setupPriceValues) {
      return this.props.history.push('/setup-services/bulk/prices')
    } else if (!setupBudget || !defaultCard) {
      return this.props.history.push('/setup-services/bulk/budgets')
    }
    return this.props.history.push('/account/services')
  }

  render () {
    const { location: { pathname }, classes, handleSubmit, submitting } = this.props
    const { submitLabel } = this.state

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.submit)}>
        <ProServiceContainer
          stepper={<ProServiceProgress pathname={pathname} />}
          submitLabel={submitLabel}
          submitDisabled={submitting}
        >
          <h3 className={classes.title}>
            ご指名方式の設定をしましょう
          </h3>
          <div className={classes.container}>
            <div className={classes.msg}>
              <div>ご指名を受けるためには<span className={classes.bold}>以下の設定</span>をする必要があります。</div>
              <ol>
                {this.lists.map(l => (
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
