import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, FormSection } from 'redux-form'
import deepcopy from 'deep-copy'
import { withStyles, Divider } from '@material-ui/core'

import JobRequirement from 'components/JobRequirement'
import CampaignWarning from './CampaignWarning'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'
import { updateMany } from 'modules/proService'

@connect(state => ({
  proServices: state.proService.proServices,
}), { updateMany })
@reduxForm({
  form: 'proServiceBulkJobRequirements',
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
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionRoot: {
    margin: '40px 0',
  },
  confirm: {
    width: '100%',
    position: 'sticky',
    display: 'flex',
    bottom: 0,
    padding: 10,
    background: theme.palette.common.white,
    borderRadius: 0,
  },
  button: {
    fontSize: 18,
    height: 50,
  },
  bottomNotice: {
    color: theme.palette.grey[800],
    fontSize: 14,
  },
}))
export default class ProServiceJobRequirementsPage extends React.Component {
  constructor(props) {
    super(props)
    const { proServices } = props
    const jobRequirements = {}
    const sortedIds = Object.keys(proServices).sort((a, b) => proServices[b].reqCount - proServices[a].reqCount)
    for (const id of sortedIds) {
      const proService = proServices[id]
      const shouldShow =
        props.isSetup ? proService.service.matchMoreEditable :
        proService.service.matchMoreEditable || proService.service.showJobRequirements
      if (shouldShow) {
        jobRequirements[id] = deepcopy(proService.jobRequirements.filter(jr => jr.query.usedForPro && jr.query.options.length > 0))
      }
    }
    this.state = {
      jobRequirements,
    }
    this.submitLabel = props.isSetup ? '更新して次へ' : '仕事条件を更新する'
  }

  onAnswerChange = (serviceId) => ({id, answers}) => {
    const { jobRequirements } = this.state

    const jr = jobRequirements[serviceId].find(
      jr => jr.query._id === id
    )

    jr.answers = answers.filter(a => a.checked)

    this.setState({ jobRequirements })
  }

  saveAndExit = () => this.submit().then(() => this.props.history.push('/account/services'))

  onSubmit = () => this.submit().then(this.props.next)

  submit = () => {
    const { jobRequirements } = this.state
    const data = {}
    for (const id in jobRequirements) {
      data[id] = {jobRequirements: jobRequirements[id], setupJobRequirements: true}
    }
    return this.props.updateMany(data)
  }

  render() {
    const { proServices, handleSubmit, classes, submitting, location: { pathname } } = this.props
    const { jobRequirements } = this.state

    const disabled = Object.keys(jobRequirements).some(id => !this.isSubmittable(jobRequirements[id])) || submitting
    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={this.props.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={disabled}
          back={this.props.back}
        >
          <h3 className={classes.title}>
            仕事条件の一括設定
          </h3>
          <div className={classes.subText}>条件に合う依頼をより多くお届けします</div>
          <CampaignWarning />
          <div className={classes.sectionWrap}>
            {Object.keys(jobRequirements).map((id, i) => {
              const jr = jobRequirements[id]
              const last = i === Object.keys(jobRequirements).length - 1
              return (
                <React.Fragment key={id}>
                  <div className={classes.sectionRoot}>
                    <div className={classes.serviceName}>{proServices[id].service.name}</div>
                    <div>
                      <FormSection name={id}>
                        {jr.map(j =>
                          <JobRequirement key={j.query._id} jobRequirement={j} onAnswerChange={this.onAnswerChange(id)} />
                        )}
                      </FormSection>
                    </div>
                  </div>
                  {!last && <Divider />}
                </React.Fragment>
              )
            })}
          </div>
          <div className={classes.bottomNotice}>※ 条件から外れる依頼もお届けすることがあります。</div>
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