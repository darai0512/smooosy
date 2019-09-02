import React from 'react'
import { Field } from 'redux-form'
import { Button, IconButton } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import ClearIcon from '@material-ui/icons/Clear'

import renderNumberInput from 'components/form/renderNumberInput'
import positiveNumberValidate from 'tools/components/form/positiveNumberValidate'

const renderPricesToPoints = ({ fields, meta, classes }) => (
  <div>
    <h3>予算ポイントマッピング</h3>
    <ul style={{marginLeft: 0}}>
      {fields.map((priceMapping, index) => (
        <li key={index} style={{display: 'flex', alignItems: 'center'}}>
          <Field name={`${priceMapping}.price`} label='予算' type='number' component={renderNumberInput} inputStyle={{width: 150, marginRight: 5}} validate={positiveNumberValidate} parse={s => parseFloat(s)} />
          <Field name={`${priceMapping}.points`} label='ポイント' type='number' validate={positiveNumberValidate} component={renderNumberInput} parse={s => parseFloat(s)} />
          <IconButton color='secondary' onClick={() => fields.remove(index)}style={{paddingTop: 10}}><ClearIcon /></IconButton>
        </li>
      ))}
      <Button color='secondary' onClick={() => fields.push({})}>
        <AddIcon style={{width: 16, height: 16}} />
        項目を追加する
      </Button>
      {meta.error && <li className={classes.error}>{meta.error}</li>}
    </ul>
  </div>
)

export default renderPricesToPoints