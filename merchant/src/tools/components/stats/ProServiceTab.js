import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import deepcopy from 'deep-copy'
import { withStyles, withTheme, LinearProgress, FormControlLabel, Checkbox } from '@material-ui/core'
import { load as loadProService, update as updateProService } from 'tools/modules/proService'
import { updateBusinessHour } from 'tools/modules/schedule'
import { Button, Menu, MenuItem } from '@material-ui/core'
import { grey, green, indigo } from '@material-ui/core/colors'

import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'

import WeeklySchedule from 'components/WeeklySchedule'
import GoogleMapEdit from 'components/GoogleMapEdit'
import JobRequirement from 'components/JobRequirement'
import PriceValuesSetting from 'components/PriceValuesSetting'
import { BudgetSliderComponent as BudgetSlider } from 'components/BudgetSlider'
import renderCheckbox from 'components/form/renderCheckbox'
import { BusinessHourFields, businessHourFormSetting } from 'components/pros/BusinessHourEdit'
import ProServiceDescriptionSetting from 'components/ProServiceDescriptionSetting'

import { initializePriceValues, getQueries, getEstimateAcquisition, parsePriceValues, checkFilledBaseQuery } from 'lib/proService'
import { update as updateUser } from 'tools/modules/auth'
import { load as loadLabels } from 'tools/modules/proLabel'

@withStyles((theme) => ({
  container: {
    maxWidth: 600,
    flex: 1,
  },
  message: {
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
}))
@connect(state => ({
  proService: state.proService.proService,
}), { loadProService })
export default class ProServiceTab extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      previewAnchor: null,
      service: this.props.profile.services[0],
      baseQueries: [],
      discountQueries: [],
      addonQueries: [],
      loading: false,
    }
  }

  componentDidMount() {
    const { service } = this.state
    if (service) {
      this.load(service.id)
    }
  }

  selectPreviewService = service => {
    this.setState({
      previewAnchor: null,
      service,
      loading: true,
    })
    this.load(service.id)
  }

  updateState = () => {
    const { proService } = this.props
    const {
      baseQueries,
      discountQueries,
      addonQueries,
      hideTravelFee,
      singleBasePriceQuery,
    } = getQueries({jobRequirements: proService.jobRequirements, service: proService.service})
    const priceInitialValues = initializePriceValues(proService.priceValues, proService.chargesTravelFee)

    this.setState({baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery, priceInitialValues})
  }

  load = (serviceId) => {
    const { profile } = this.props
    this.props.loadProService(profile.pro.id, serviceId)
      .then(() => {
        this.updateState()
        this.setState({loading: false})
      })
  }

  render() {
    const { profile, classes, proService } = this.props
    const { service, previewAnchor, baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery, priceInitialValues, loading } = this.state

    if (!proService || !service) return null

    const showMatchMore = proService && proService.user.isMatchMore && service.matchMoreEditable

    return (
      <>
        <div style={{padding: '16px 48px 16px 24px', borderBottom: `1px solid ${grey[300]}`}}>
          <Button size='small' onClick={e => this.setState({previewAnchor: e.currentTarget})}>
            <div>{service.matchMoreEditable ? '【ご指名】' : ''}{service.name}</div>
            <KeyboardArrowDownIcon />
          </Button>
          <Menu
            open={!!previewAnchor}
            anchorEl={previewAnchor}
            onClose={() => this.setState({previewAnchor: null})}
          >
            {profile.services.map(s =>
              <MenuItem key={s.id} selected={service.name === s.name} onClick={() => this.selectPreviewService(s)}>{s.matchMoreEditable ? '【ご指名】' : ''}{s.name}</MenuItem>
            )}
          </Menu>
          {service.matchMoreEditable && <StartMatchMoreButton onStart={() => this.load(service._id)} user={proService.user} />}
        </div>
        {loading && <LinearProgress color='primary' />}
        <div style={{padding: '10px 20px'}}>
          <div className={classes.container}>
            <SetupList title='営業時間' isDone={proService.user.setupBusinessHour}>
              <BusinessHourForm
                onUpdate={this.load}
              />
            </SetupList>
            <SetupList title='サービス別自己紹介' isDone={proService.setupDescriptions}>
              <DescriptionForm />
            </SetupList>
            {!showMatchMore && service.showJobRequirements &&
              <SetupList title='仕事条件' isDone={proService.setupJobRequirements}>
                <JobRequirementsForm
                  onUpdate={this.updateState}
                />
              </SetupList>
            }
            {showMatchMore &&
              <>
                <SetupList title='仕事エリア' isDone={proService.setupLocation}>
                  <LocationForm />
                </SetupList>
                <SetupList title='仕事条件' isDone={proService.setupJobRequirements}>
                  <JobRequirementsForm
                    onUpdate={this.updateState}
                  />
                </SetupList>
                <SetupList title='価格設定' isDone={proService.setupPriceValues}>
                  <PriceValuesForm
                    service={proService.service}
                    baseQueries={baseQueries}
                    discountQueries={discountQueries}
                    addonQueries={addonQueries}
                    hideTravelFee={hideTravelFee}
                    singleBasePriceQuery={singleBasePriceQuery}
                    priceInitialValues={priceInitialValues}
                    onUpdate={this.updateState}
                  />
                </SetupList>
                <SetupList title='予算設定' isDone={proService.setupBudget}>
                  <BudgetForm />
                </SetupList>
                <SetupList title='ラクラクお得モード' isDone={proService.isPromoted}>
                  {proService.isPromoted === undefined ? '未設定' : proService.isPromoted ? 'ON' : 'OFF'}
                </SetupList>
              </>
            }
          </div>
        </div>
      </>
    )
  }
}

let Description = ({name, description, classes}) => (
  <div>
    <div className={classes.name}>{name}</div>
    <div className={classes.description}>{description ? description : <span className={classes.empty}>未設定</span>}</div>
  </div>
)

Description = withStyles((theme) => ({
  name: {
    fontWeight: 'bold',
  },
  description: {
    padding: 10,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
  },
  empty: {
    color: theme.palette.grey[500],
    fontWeight: 'bold',
  },
}))(Description)

let SetupList = ({title, isDone, children, classes}) => (
  <details>
    <summary className={isDone ? classes.doneTitle : classes.title}>
      {title}{isDone && <CheckCircleIcon className={classes.doneIcon} />}
    </summary>
    <dl>
      <dt>
        {children}
      </dt>
    </dl>
  </details>
)

SetupList = withStyles(() => ({
  title: {
    marginTop: 10,
    marginBottom: 10,
  },
  doneTitle: {
    fontWeight: 'bold',
    color: green[500],
    marginTop: 10,
    marginBottom: 10,
  },
  doneIcon: {
    marginLeft: 5,
    marginBottom: -5,
  },
}))(SetupList)

@withTheme
@connect(state => ({
  proService: state.proService.proService,
}), { updateBusinessHour })
class BusinessHourForm extends React.Component {
  initialize = () => {
    const { proService } = this.props
    return proService.user.schedule
  }

  submit = (values) => {
    const { updateBusinessHour, proService } = this.props
    return updateBusinessHour(proService.user._id, values)
      .then(() => this.props.onUpdate(proService.service._id))
  }

  render() {
    const { theme, proService } = this.props

    return (
      <ProServiceForm
        onInit={this.initialize}
        onSubmit={this.submit}
        form='businessHour'
        {...businessHourFormSetting}
      >
        {({disabled, error, warning}) => (
          disabled ?
            <>
              {typeof proService.user.schedule.startTime === 'number' && typeof proService.user.schedule.endTime === 'number' &&
                <div>
                  営業時間:
                  {proService.user.schedule.startTime}:00〜{proService.user.schedule.endTime}:00
                </div>
              }
              <WeeklySchedule schedules={proService.schedules} dayOff={proService.user.schedule.dayOff} hideWeekday />
            </>
          :
            <BusinessHourFields error={error} warning={warning} palette={theme.palette} />
        )}

      </ProServiceForm>
    )
  }
}

@connect(state => ({
  proService: state.proService.proService,
  labels: state.proLabel.labels,
}), { updateProService, loadLabels })
class DescriptionForm extends React.Component {
  componentDidUpdate(prevProps) {
    if (prevProps.proService.service._id !== this.props.proService.service._id) {
      this.props.loadLabels(this.props.proService.service._id)
    }
  }

  initialize = () => {
    const { proService } = this.props
    const labels = proService.labels || []
    const formLabels = {}
    labels.forEach(l => formLabels[l] = true)

    return {
      catchphrase: proService.catchphrase,
      description: proService.description,
      accomplishment: proService.accomplishment,
      advantage: proService.advantage,
      labels: formLabels,
    }
  }

  submit = ({catchphrase, description, accomplishment, advantage, labels}) => {
    const { updateProService, proService } = this.props
    return updateProService(proService._id, {
      catchphrase,
      description,
      accomplishment,
      advantage,
      labels: Object.keys(labels).filter(l => labels[l]),
      setupDescriptions: !!description,
    })
  }

  render() {
    const { proService, labels } = this.props

    return (
      <ProServiceForm
        onInit={this.initialize}
        onSubmit={this.submit}
        form='proServiceDescription'
      >
        {({disabled}) => (
          disabled ?
            <>
              <Description name='サービスの説明' description={proService.description} />
              <Description name='キャッチコピー' description={proService.catchphrase} />
              <Description name='特徴' description={labels.map(l => (
                  <FormControlLabel disabled label={l.text} control={<Checkbox checked={(proService.labels || []).includes(l._id)} />} key={l._id} />
                ))} />
              <Description name='実績' description={proService.accomplishment} />
              <Description name='アピールポイント' description={proService.advantage} />
            </>
          :
            <ProServiceDescriptionSetting labels={labels} proService={proService} />
        )}
      </ProServiceForm>
    )
  }
}

@connect(state => ({
  proService: state.proService.proService,
}), { updateProService })
class LocationForm extends React.Component {
  initialize = () => {
    const { proService } = this.props
    return {
      loc: proService.loc,
      address: proService.address,
      prefecture: proService.prefecture,
      city: proService.city,
      distance: proService.distance || proService.service.distance || 50000,
    }
  }

  submit = ({loc, address, prefecture, city, distance}) => {
    const { updateProService, proService } = this.props
    return updateProService(proService._id, {
      loc,
      address,
      prefecture,
      city,
      distance,
      setupLocation: true,
    })
  }

  render() {
    const { proService } = this.props

    return (
      <ProServiceForm
        onInit={this.initialize}
        onSubmit={this.submit}
        form='proServiceLocation'
      >
        {({disabled, reload, onMapChange, onDistanceChange}) => (
          <div>
            {!reload &&
              <>
                {proService.service.matchMoreEditable ?
                  <GoogleMapEdit
                    zoom={9}
                    loc={proService.loc}
                    address={proService.address}
                    distance={proService.distance || proService.service.distance || 50000}
                    onChange={onMapChange}
                    onDistanceChange={onDistanceChange}
                    disabled={disabled}
                  />
                  :
                  <GoogleMapEdit
                    loc={proService.loc}
                    address={proService.address}
                    onChange={onMapChange}
                    disabled={disabled}
                  />
                }
              </>
            }
          </div>
        )}
      </ProServiceForm>
    )
  }
}

@connect(state => ({
  proService: state.proService.proService,
}), { updateProService })
class JobRequirementsForm extends React.Component {
  state = {
    jobRequirements: [],
  }

  initialize = () => {
    const { proService } = this.props
    this.setState({
      jobRequirements: deepcopy(proService.jobRequirements.filter(jr => jr.query.usedForPro && jr.query.options.length > 0)),
    })
    return {}
  }

  onAnswerChange = ({id, answers}) => {
    const { jobRequirements } = this.state

    const jr = jobRequirements.find(
      jr => jr.query._id === id
    )

    jr.answers = answers.filter(a => a.checked)

    this.setState({ jobRequirements })
  }

  submit = () => {
    return this.props.updateProService(this.props.proService._id, {
      jobRequirements: this.state.jobRequirements,
      setupJobRequirements: true,
    }).then(() => this.props.onUpdate())
  }

  render() {
    const { jobRequirements } = this.state

    return (
      <ProServiceForm
        onInit={this.initialize}
        onSubmit={this.submit}
        form='proServiceJobRequirements'
      >
        {({disabled}) => (
          <>
            {jobRequirements.map(jr =>
              <JobRequirement
                key={jr.query._id}
                jobRequirement={jr}
                onAnswerChange={this.onAnswerChange}
                disabled={disabled}
              />
            )}
          </>
        )}
      </ProServiceForm>
    )
  }
}

const AUTOMOBILE_REPAIR_KEY = 'automobile-body-repair-and-paint'
@connect(state => ({
  proService: state.proService.proService,
}), { updateProService })
class PriceValuesForm extends React.Component {
  initialize = () => {
    return this.props.priceInitialValues
  }

  submit = (values) => {
    const { updateProService, proService } = this.props
    const warn = checkFilledBaseQuery((values).base, proService)
    const priceValues = parsePriceValues(values)

    return updateProService(proService._id, {
      priceValues: warn.length ? proService.priceValues : priceValues,
      setupPriceValues: true,
      chargesTravelFee: values.chargesTravelFee,
    }).then(() =>  this.props.onUpdate())
  }

  render() {
    const { proService, service, baseQueries, discountQueries, addonQueries, hideTravelFee, singleBasePriceQuery, priceInitialValues } = this.props

    const editable = proService.setupLocation && proService.setupJobRequirements

    return (
      <ProServiceForm
        editable={editable}
        onInit={this.initialize}
        onSubmit={this.submit}
        priceInitialValues={priceInitialValues}
        form='proServicePriceValues'
      >
        {({disabled}) => (
          <PriceValuesSetting
            baseRequired={service.key !== AUTOMOBILE_REPAIR_KEY}
            disabled={disabled}
            baseQueries={baseQueries}
            discountQueries={discountQueries}
            addonQueries={addonQueries}
            singleBasePriceQuery={singleBasePriceQuery}
            allowsTravelFee={service.allowsTravelFee && !hideTravelFee}
            estimatePriceType={service.estimatePriceType}
          />
        )}
      </ProServiceForm>
    )
  }
}

@connect(state => ({
  proService: state.proService.proService,
}), { updateProService })
class BudgetForm extends React.Component {
  initialize = () => {
    const { proService } = this.props
    return {
      budget: proService.budget,
      isPromoted: proService.isPromoted,
    }
  }

  submit = (values) => {
    const { updateProService, proService } = this.props
    return updateProService(proService._id, {
      budget: values.budget,
      setupBudget: true,
      isPromoted: values.isPromoted,
    })
  }

  render() {
    const { proService } = this.props

    const editable = proService.setupLocation && proService.setupJobRequirements && proService.setupPriceValues

    return (
      <ProServiceForm
        editable={editable}
        onInit={this.initialize}
        onSubmit={this.submit}
        form='proServiceBudget'
      >
        {({disabled}) => (
          <>
            <Field name='isPromoted' disabled={disabled || !editable} component={renderCheckbox} label='らくらくお得モードON' labelStyle={{width: '100%'}} />
            <div>
              <Field
                name='budget'
                component={({input: { onChange, value } }) => {
                  return (
                    <BudgetSlider
                      value={value}
                      service={proService.service}
                      estimateAcquisition={getEstimateAcquisition({service: proService.service, budget: value})}
                      onChange={onChange}
                      disabled={disabled}
                    />
                  )
                }}
              />
            </div>
          </>
        )}
      </ProServiceForm>
    )
  }
}

@reduxForm()
@connect(state => ({
  proService: state.proService.proService,
}), { updateProService })
class ProServiceForm extends React.Component {
  state = {
    disabled: true,
    reload: false,
  }

  componentDidMount() {
    this.initialize()
  }

  componentDidUpdate(prevProps) {
    if (this.state.reload) this.setState({reload: false})
    if (prevProps.proService._id !== this.props.proService._id) {
      this.initialize()
    }
    if (prevProps.priceInitialValues !== this.props.priceInitialValues) {
      this.initialize()
    }
  }

  initialize = () => {
    this.props.initialize(this.props.onInit())
    this.setState({
      disabled: true,
      reload: true,
    })
  }

  submit = (values) => {
    this.props.onSubmit(values)
      .then(() => this.setState({disabled: true}))
  }

  onMapChange = (location) => {
    if (!location) return
    const { loc, address, prefecture, city } = location
    this.props.change('loc', loc)
    this.props.change('address', address)
    this.props.change('prefecture', prefecture)
    this.props.change('city', city)
  }

  onDistanceChange = (distance) => {
    this.props.change('distance', distance)
  }

  render() {
    const { handleSubmit, submitting, error, warning, editable = true, children } = this.props
    const { disabled, reload } = this.state

    return (
      <form onSubmit={handleSubmit(this.submit)}>
        <FormButtons
          disabled={disabled}
          editable={disabled && editable}
          submitting={submitting}
          onCancel={this.initialize}
          onEdit={() => this.setState({disabled: false})}
        />
        {children({
          disabled,
          error,
          warning,
          reload,
          // for location
          onMapChange: this.onMapChange,
          onDistanceChange: this.onDistanceChange,
        })}
      </form>
    )
  }
}


const FormButtons = ({disabled, editable = true, submitting, onCancel, onEdit}) => {
  return (
    <div style={{display: 'flex'}}>
      <Button variant='contained' color='secondary' disabled={!editable} onClick={onEdit}>編集</Button>
      {!disabled &&
        <div style={{display: 'flex', marginLeft: 'auto'}}>
          <Button variant='contained' onClick={onCancel}>キャンセル</Button>
          <div style={{width: 10}} />
          <Button disabled={submitting} variant='contained' color='secondary' type='submit'>保存</Button>
        </div>
      }
    </div>
  )
}

const StartMatchMoreButton = connect(null, {
  updateUser,
})(withStyles(theme => ({
  button: {
    color: theme.palette.common.white,
    background: indigo[500],
    '&:hover': {
      background: indigo[700],
    },
  },
}))(({classes, updateUser, onStart, user}) => {
  const startMathMore = useCallback(() => {
    updateUser({isMatchMore: true, id: user._id})
     .then(onStart)
  }, [user, updateUser, onStart])

  if (user.isMatchMore) return null

  return (
    <Button variant='contained' className={classes.button} onClick={startMathMore}>ご指名開始</Button>
  )
}))
