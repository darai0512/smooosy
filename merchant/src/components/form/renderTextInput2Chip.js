import React from 'react'
import { Field } from 'redux-form'
import { Button, Chip, TextField } from '@material-ui/core'


export default class renderTextInput2Chip extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
    }
  }

  addChip = () => {
    const { text } = this.state
    if (text.length) {
      this.props.fields.push(text)
      this.setState({text: ''})
    }
  }

  render() {
    const { fields, style } = this.props
    return (
      <div style={{display: 'flex', flexWrap: 'wrap', ...style}}>
        {fields.map((service, idx) =>
          <div key={idx} style={{margin: 5}}>
            <Field
              name={service}
              component={({input}) => <Chip onDelete={() => fields.remove(idx)} label={input.value}/>}
              style={{width: 250}}
            />
          </div>
        )}
        <div>
          <TextField margin='dense' type='text' value={this.state.text} onChange={e => this.setState({text: e.target.value})}/>
          <Button style={{marginLeft: 5}} variant='outlined' size='small' onClick={this.addChip}>追加</Button>
        </div>
      </div>
    )
  }
}
