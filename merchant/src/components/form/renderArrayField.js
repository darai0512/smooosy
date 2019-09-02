import React from 'react'
import { Field } from 'redux-form'
import { Button, IconButton } from '@material-ui/core'
import { red } from '@material-ui/core/colors'
import AddIcon from '@material-ui/icons/AddCircleOutline'
import CloseIcon from '@material-ui/icons/Close'
import renderTextInput from 'components/form/renderTextInput'

const renderArrayField = ({fields, type = 'text', error, placeholder = 'その', addLabel = '追加', width}) => (
  <div>
    {fields.map((field, idx) =>
      <div key={idx} style={{display: 'flex'}}>
        <Field
          name={field}
          type={type}
          component={renderTextInput}
          style={{width}}
          placeholder={`${placeholder}${idx + 1}`}
        />
        {fields.length > 1 &&
          <IconButton style={{width: 40, height: 40, marginLeft: 5}} onClick={() => fields.remove(idx)}><CloseIcon /></IconButton>
        }
      </div>
    )}
    {error && <div style={{color: red[500]}}>{error}</div>}
    <Button color='primary' onClick={() => fields.push('')}>
      <AddIcon />
      {addLabel}
    </Button>
  </div>
)

export default renderArrayField