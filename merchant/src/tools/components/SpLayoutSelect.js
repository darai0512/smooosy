import React from 'react'
import { connect } from 'react-redux'
import { MenuItem, Select } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { open as openSnack } from 'tools/modules/snack'
import { update as updateService, spFetch, spUnload } from 'tools/modules/service'

import Loading from 'components/Loading'
import PageLayoutForm from 'tools/components/PageLayoutForm'


@withStyles({
  select: {
    margin: 5,
    minWidth: 100,
  },
})
@connect(
  state => ({
    spInfo: state.service.spInfo,
  }),
  { updateService, spFetch, spUnload, openSnack }
)
export default class SpLayoutSelect extends React.Component {

  state = {
    type: 'top',
  }

  componentDidMount() {
    this.fetch(this.state.type)
  }

  fetch = type => {
    const { service } = this.props
    this.props.spUnload()
    this.setState({ type })

    const key = service.key
    const pref = ['pref', 'city'].includes(type) ? 'tokyo' : null
    const city = ['city'].includes(type) ? 'minato' : null
    this.props.spFetch({key, pref, city})
      .catch(() => this.props.openSnack('データの読み込みに失敗しました'))
  }

  onCreate = (pageLayout) => {
    const { service } = this.props
    const { type } = this.state

    // update service
    const data = {
      id: service.id,
      pageLayouts: service.pageLayouts || {},
    }
    data.pageLayouts[type] = pageLayout.id
    this.props.updateService(data)
  }

  selectType = event => {
    this.fetch(event.target.value)
  }

  render() {
    const { service, spInfo, classes } = this.props
    const { type } = this.state

    return (
      <div>
        <Select
          className={classes.select}
          value={type}
          onChange={this.selectType}
        >
          {['top', 'pref', 'city'].map(t =>
            <MenuItem key={t} value={t}>{t}</MenuItem>
          )}
        </Select>
        {!spInfo || !spInfo.service ? <Loading /> :
          <PageLayoutForm
            id={service.pageLayouts ? service.pageLayouts[type] : null}
            type={type}
            onCreate={this.onCreate}
            layoutProps={{
              service,
              priceProps: {
                price: spInfo.price,
                service: spInfo.service,
              },
              pickupProfilesProps: {
                service,
                profiles: spInfo.profiles,
                leads: spInfo.leads,
                buttonProps: () => {},
              },
              pickupProAnswersProps: {
                proQuestions: spInfo.service.proQuestions,
              },
              requestExampleProps: {
                request: spInfo.request,
                service: spInfo.service,
              },
              pageDescriptionProps: {
                service: spInfo.service,
                description: spInfo.service.pageDescription ?  spInfo.service.pageDescription.replace(/{{location([^}]*)}}/g, '') : '',
              },
              pageInformationProps: {
                pageInformation: spInfo.service.pageInformation,
              },
              proMediaProps: {
                service: spInfo.service,
                media: spInfo.media,
              },
              pickupMediaProps: {
                pickupMedia: service.pickupMedia,
              },
            }}
            isService={true}
          />
        }
      </div>
    )
  }
}