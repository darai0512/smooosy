import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import deepcopy from 'deep-copy'

import { withStyles } from '@material-ui/core/styles'

import { update as updateProService } from 'modules/proService'

import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice//ProServiceProgress'
import JobRequirement from 'components/JobRequirement'


@connect(
  state => ({
    proService: state.proService.proService,
  }),
  { updateProService }
)
@reduxForm({
  form: 'proServiceJobRequirements',
})
@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    color: theme.palette.grey[800],
  },
  subtitle: {
    textAlign: 'center',
    color: theme.palette.grey[800],
  },
  jobRequirements: {
    marginTop: '20px',
  },
  bottomNotice: {
    textAlign: 'left',
    marginTop: '20px',
    color: theme.palette.grey[800],
    fontSize: 14,
  },
}))
export default class ProServiceJobRequirementsPage extends React.Component {
  constructor(props) {
    super(props)
    const {
      location: { pathname },
      proService: { jobRequirements },
      match: { params: { id } },
    } = props

    const isSetup = /setup\-services/.test(pathname)
    this.state = {
      jobRequirements: deepcopy(jobRequirements.filter(jr => jr.query.usedForPro && jr.query.options.length > 0)),
      prevPage: isSetup ? `/setup-services/${id}/locations` : `/account/services/${id}`,
      nextPage: isSetup ? `/setup-services/${id}/prices` : `/account/services/${id}`,
      submitLabel: isSetup ? '更新して次へ' : '仕事条件を更新する',
    }
  }

  onAnswerChange = ({id, answers}) => {
    const { jobRequirements } = this.state

    const jr = jobRequirements.find(
      jr => jr.query._id === id
    )

    jr.answers = answers.filter(a => a.checked)

    this.setState({ jobRequirements })
  }

  saveAndExit = values => {
    return this.onSubmit(values).then(() => this.props.history.push('/account/services'))
  }

  onSubmit = () => {
    return this.submit().then(() => this.props.history.push(this.state.nextPage))
  }

  submit = () => {
    return this.props.updateProService(
      this.props.match.params.id,
      { jobRequirements: this.state.jobRequirements, setupJobRequirements: true },
    )
  }

  render() {
    const { location: { pathname }, proService: { service }, handleSubmit, classes } = this.props
    const { prevPage, submitLabel } = this.state

    const { jobRequirements } = this.state
    const isSetup = /setup\-services/.test(pathname)

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={submitLabel}
          submitDisabled={!this.isSubmittable(jobRequirements)}
          prevPage={prevPage}
        >
          <h3 className={classes.title}>
            どのような{service.name}の依頼をご希望ですか？
          </h3>
          <h5 className={classes.subtitle}>
            条件に合う依頼をより多くお届けします
          </h5>
          <div className={classes.jobRequirements}>
            {jobRequirements.map(jr =>
              <JobRequirement key={jr.query._id} jobRequirement={jr} onAnswerChange={this.onAnswerChange} />
            )}
          </div>
          <div className={classes.bottomNotice}>
            ※ 条件から外れる依頼もお届けすることがあります。
            {service.showJobRequirements && <span>仕事条件の詳細は<a href='https://help.smooosy.com/articles/3052963-' target='_blank' rel='noopener noreferrer'>こちら</a>。</span>}
          </div>
        </ProServiceContainer>
      </form>
    )
  }

  isSubmittable = (jobRequirements) => {
    // If there's only one option for a question, it's ok to leave this
    // option unchecked.
    return (
      jobRequirements.filter(jr => jr.query.options.length === 1 || jr.answers.length || jr.query.noOptionsChosenOkForPro).length === jobRequirements.length
    )
  }
}
