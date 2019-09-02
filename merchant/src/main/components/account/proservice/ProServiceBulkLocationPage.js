import React from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'
import { withStyles } from '@material-ui/core'

import { updateMany } from 'modules/proService'
import GoogleMapEdit from 'components/GoogleMapEdit'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'

@connect(
  state => ({
    proServices: state.proService.proServices,
  }),
  { updateMany }
)
@reduxForm({
  form: 'proServiceBulkLocation',
})
@withStyles(theme => ({
  root: {
    height: '100%',
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
  section: {
    padding: 20,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
    margin: '30px 0',
  },
}))
export default class ProServiceBulkLocationPage extends React.Component {
  constructor(props) {
    super(props)
    const { proServices } = props
    const matchMoreProServiceIds = []
    for (const id in proServices) {
      if (proServices[id].service.matchMoreEditable) {
        matchMoreProServiceIds.push(id)
      }
    }
    this.state = {
      matchMoreProServiceIds,
    }
    this.submitLabel = props.isSetup ? '更新して次へ' : '仕事エリアを更新する'
  }

  onMapChange = (location) => {
    if (!location) return
    this.setState({location})
    const { loc, address, prefecture, city } = location
    this.props.change('loc', loc)
    this.props.change('address', address)
    this.props.change('prefecture', prefecture)
    this.props.change('city', city)
  }

  onDistanceChange = (distance) => {
    this.props.change('distance', distance)
  }

  saveAndExit = values => this.submit(values).then(() => this.props.history.push('/account/services'))

  onSubmit = values => this.submit(values).then(() => this.props.next())

  submit = ({loc, address, prefecture, city, distance}) => {
    const { matchMoreProServiceIds } = this.state
    const data = {}
    for (const id of matchMoreProServiceIds) {
      data[id] = {loc, address, prefecture, city, distance: distance || this.props.proServices[id].distance, setupLocation: true }
    }
    return this.props.updateMany(data)
  }

  render () {
    const { handleSubmit, submitting, proServices, classes, location: { pathname } } = this.props
    const { location } = this.state
    if (!proServices) return null
    const ps = proServices[Object.keys(proServices).filter(id => proServices[id].service.matchMoreEditable)[0]]

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={this.props.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={submitting || !location}
          back={this.props.back}
        >
          <h3 className={classes.title}>
            仕事エリアを一括設定します
          </h3>
          <div className={classes.subText}>全サービスの仕事エリアを一括設定します</div>
          <div className={classes.section}>
            <GoogleMapEdit zoom={9} loc={ps.loc} address={ps.address} distance={ps.distance || ps.service.distance || 50000} onChange={this.onMapChange} onDistanceChange={this.onDistanceChange} />
          </div>
        </ProServiceContainer>
      </form>
    )
  }
}
