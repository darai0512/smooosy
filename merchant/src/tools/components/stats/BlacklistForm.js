import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Button, MenuItem } from '@material-ui/core'
import { orange } from '@material-ui/core/colors'
import renderSelect from 'components/form/renderSelect'
import renderTextInput from 'components/form/renderTextInput'
import renderCheckbox from 'components/form/renderCheckbox'
import { update, remove } from 'tools/modules/blacklist'

@connect(
  // propsに受け取るreducerのstate
  () => ({}),
  // propsに付与するactions
  {update, remove}
)
@reduxForm({
  validate: values => {
    const errors = {}
    if (!values.name) {
      errors.name = '必須項目です'
    }
    return errors
  },
})
export default class BlacklistForm extends React.Component {

  submit = (values) => {
    const { initialValues } = this.props
    this.props.update(initialValues.id, values)
      .then(blacklist => this.props.initialize(blacklist))
  }

  remove = () => {
    const { initialValues } = this.props
    this.props.remove(initialValues.id)
  }


  render () {
    const { handleSubmit, dirty } = this.props

    return (
      <form onSubmit={handleSubmit(this.submit)} onChange={this.onChange} style={{padding: 10, background: dirty ? orange[100] : 'transparent'}} >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-around'}}>
          <div style={{display: 'flex', alignItems: 'center'}} >
            <Field name='type' component={renderSelect} style={{marginRight: 10}} >
              <MenuItem value='exact'>完全一致</MenuItem>
              <MenuItem value='prefix'>前方一致</MenuItem>
              <MenuItem value='suffix'>後方一致</MenuItem>
              <MenuItem value='partial'>部分一致</MenuItem>
              <MenuItem value='regexp'>正規表現</MenuItem>
            </Field>
            <Field name='text' component={renderTextInput} placeholder='パターン' inputStyle={{width: 150, marginTop: 5, marginRight: 10}}/>
            <Field name='note' component={renderTextInput} placeholder='メモ' inputStyle={{width: 150, marginTop: 5, marginRight: 10}}/>
            <Field name='enabled' component={renderCheckbox} label='適用' />
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button size='small' variant='contained' color='primary' type='submit' style={{marginRight: 10, height: 20}}>保存</Button>
            <Button size='small' variant='contained' color='secondary' style={{height: 20}} onClick={() => this.remove()}>削除</Button>
          </div>
        </div>
      </form>
    )
  }

}

