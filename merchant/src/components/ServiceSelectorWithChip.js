import React from 'react'
import { connect } from 'react-redux'
import { Field } from 'redux-form'
import { Chip, Button, Dialog, DialogTitle, DialogContent } from '@material-ui/core'

import { load as loadServices } from 'tools/modules/service'
import ServiceSelectorDetail from 'components/ServiceSelectorDetail'

@connect(
  (state, props) => ({
    services: state.service.allServices,
    selected: state.form[props.meta.form].values[props.fields.name],
  }),
  { loadServices }
)
export default class ServiceSelectorWithChip extends React.Component {
  state = {}

  static defaultProps = {
    categories: [],
    services: [],
    selected: [],
    style: {},
  }

  componentDidMount() {
    this.props.loadServices()
  }

  render() {
    const { fields, services, selected, style } = this.props

    return (
      <div style={style}>
        <Button size='small' variant='contained' color='primary' onClick={() => this.setState({open: true})}>
          サービス選択
        </Button>
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {fields.map((name, idx) =>
            <div key={idx} style={{margin: 5}}>
              <Field
                name={name}
                component={({input}) => {
                  const target = services.find(l => l.id === input.value.id)
                  return <Chip onDelete={() => fields.remove(idx)} label={target && target.name}/>
                }}
                style={{width: 250}}
              />
            </div>
          )}
        </div>
        <Dialog open={!!this.state.open} onClose={() => this.setState({open: false})}>
          <DialogTitle>サービス選択</DialogTitle>
          <DialogContent>
            <ServiceSelectorDetail
              multiple
              services={services.filter(s => !selected.includes(s.id))}
              onSelect={services => {
                const ids = [...fields.map((name, idx) => fields.get(idx).id)]
                services.forEach(s => !ids.includes(s.id) && fields.push(s))
                this.setState({open: false})
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}
