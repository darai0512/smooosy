import React from 'react'
import { Field } from 'redux-form'
import { Button, Chip, Dialog, DialogContent, DialogTitle } from '@material-ui/core'

import ServiceSelectorDetail from 'components/ServiceSelectorDetail'

export default class SelectServiceChip extends React.Component {
  state = {
    openDialog: false,
  }

  selectService = (selectedServices) => {
    const { fields } = this.props
    selectedServices.forEach(s => fields.push(s))
    this.setState({openDialog: false})
  }

  render() {
    const { fields = [], services, title, style, classes = {}, className } = this.props
    const { openDialog } = this.state

    const selected = fields.getAll()
    return (
      <div className={className}>
        <Button className={classes.button} size='small' variant='contained' color='primary' onClick={() => this.setState({openDialog: true})}>{title}</Button>
        <Dialog open={!!openDialog} onClose={() => this.setState({openDialog: false})}>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <ServiceSelectorDetail multiple
              services={services.filter(s => !selected.some(ss => (ss._id || ss) === s._id))}
              onSelect={this.selectService}
            />
          </DialogContent>
        </Dialog>
        <div>
        {fields.map((name, idx) => {
          const s = fields.get(idx)
          const service = services.find(ss => (s._id || s) === ss._id)
          return <Field
            key={idx}
            name={name}
            component={() => {
              return <Chip key={service._id} label={service.name} className={classes.chip} style={style} onDelete={() => fields.remove(idx) } />
            }}
          />
        })}
        </div>
      </div>
    )
  }
}
