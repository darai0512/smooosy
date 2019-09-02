import React from 'react'
import { Field } from 'redux-form'
import { Chip, MenuItem, Select } from '@material-ui/core'

const renderSelect2Chip = props => {
  const { fields, list, style } = props
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', ...style}}>
      {fields.map((name, idx) =>
        <div key={idx} style={{margin: 5}}>
          <Field
            name={name}
            component={({input}) => {
              const target = list.find(l => l.id === input.value)
              return <Chip onDelete={() => fields.remove(idx)} label={target && target.name}/>
            }}
            style={{width: 250}}
          />
        </div>
      )}
      <div>
        <Select
          style={{minWidth: 150}}
          value=''
          onChange={e => props.fields.push(e.target.value)}
        >
          {list.map(l =>
            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
          )}
        </Select>
      </div>
    </div>
  )
}

export default renderSelect2Chip