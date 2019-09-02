import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, FieldArray } from 'redux-form'
import { Button } from '@material-ui/core'

import { cacheInvalidation } from 'tools/modules/aws'
import { open as openSnack } from 'tools/modules/snack'
import renderArrayField from 'components/form/renderArrayField'

@reduxForm({
  form: 'cacheInvalidation',
  initialValues: {
    path: [
      '/api/services/*',
      '/services/*',
      '/media/wp-json/*',
    ],
  },
  validate: values => {
    const errors = {}
    if (values.path.filter(p => p).length === 0) {
      errors.path = ['入力してください']
    }
    return errors
  },
})
@connect(
  () => ({}),
  { cacheInvalidation, openSnack },
)
export default class CacheInvalidationForm extends React.Component {
  state = {
    submitting: false,
  }

  submit = values => {
    this.setState({submitting: true})
    this.props.cacheInvalidation(values)
      .then(({Invalidation: {Id}}) => {
        this.props.openSnack(`作成成功 ID: ${Id}`)
      })
      .catch(() => {
        this.props.openSnack('削除に失敗しました、パスが合っているか確認してください')
      })
      .finally(() => this.setState({submitting: false}))
  }

  render() {
    const { handleSubmit, error } = this.props
    const { submitting } = this.state

    return (
      <form onSubmit={handleSubmit(this.submit)}>
        <FieldArray
          name='path'
          component={renderArrayField}
          error={error}
          placeholder='パス(正規表現可)'
          addLabel='パスを追加'
        />
        <div style={{height: 20}} />
        <Button color='secondary' variant='contained' type='submit' disabled={submitting}>実行</Button>
      </form>
    )
  }
}
