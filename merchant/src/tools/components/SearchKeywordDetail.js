import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form'
import { MenuItem, Button, Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { load, update, create, remove } from 'tools/modules/searchKeyword'

import { loadAll as loadServices } from 'modules/service'
import { load as loadCategory } from 'tools/modules/category'
import ConfirmDialog from 'components/ConfirmDialog'
import renderSelect from 'components/form/renderSelect'
import renderTextInput from 'components/form/renderTextInput'
import renderNumberInput from 'components/form/renderNumberInput'

@withWidth()
@withTheme
@reduxForm({
  form: 'searchKeyword',
  validate: values => {
    const errors = {}
    if (!values.keyword) {
      errors.keyword = '必須項目です'
    }
    if (!values.keyword) {
      errors.keyword = '必須項目です'
    }
    if (values.searchVolume === undefined || values.searchVolume.length === 0) {
      errors.searchVolume = '必須項目です'
    }

    return errors
  },
})
@connect(
  state => ({
    searchKeyword: state.searchKeyword.searchKeyword,
    services: state.service.services,
    values: state.form.searchKeyword.values || { service: '' },
    sub: state.category.category,
  }),
  { loadServices, loadCategory, load, update, create, remove }
)
export default class SearchKeywordDetail extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      tag: '',
    }
  }

  componentDidMount() {
    const id = this.props.match.params.id
    const key = this.props.match.params.key

    Promise.all([
      id === 'new' ? Promise.resolve() : this.props.load(id).then(res => {
        return {...res.searchKeyword, service: res.searchKeyword.service.id}
      }),
      this.props.loadCategory(key),
      this.props.loadServices(),
    ])
    .then((datas) => {
      let [searchKeyword, sub, services] = datas

      if (id === 'new') {
        const selectableServices = services.services.filter(s => s.tags[0] === sub.name)
        searchKeyword = { service: selectableServices[0].id, searchVolume: 0 }
      }

      this.props.initialize(searchKeyword)
      this.setState({
        tag: sub.name,
      })
    })
  }

  upsert = async values => {
    const key = this.props.match.params.key
    if (values.id) {
      await this.props.update(values.id, values)
    } else {
      await this.props.create(values)
    }
    this.props.history.push(`/searchKeyword/${key}`)
  }

  render() {
    const { tag } = this.state
    const { searchKeyword, handleSubmit, values, theme, services, match } = this.props
    const { primary, grey } = theme.palette
    const key = match.params.key

    const styles = {
      root: {
        minHeight: '100%',
        background: grey[100],
        padding: 20,
      },
      chip: {
        margin: 5,
      },
      search: {
        marginTop: 10,
      },
      subheader: {
        background: 'rgba(255, 255, 255, .8)',
        height: 40,
        color: primary.main,
        fontWeight: 'bold',
        padding: '0 10px',
      },
    }

    const selectableServices = services ? services.filter(s => s.tags[0] === tag) : []

    return (
      <div style={styles.root}>
        <Typography variant='h6' style={{margin: '20px 0'}}>
          キーワード{ this.props.match.params.id === 'new' ? '追加' : '編集'}
        </Typography>
        <form onSubmit={handleSubmit(this.upsert)}>
          <div style={{fontSize: 13, fontWeight: 'bold', color: grey[700]}}>サービス</div>
          <Field name='service' component={renderSelect} style={{minWidth: 100, marginBottom: 10}}>
            {selectableServices.map(s =>
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            )}
          </Field>
          <Field name='keyword' label='キーワード' placeholder='例）結婚式 カメラマン' component={renderTextInput} readOnly={values.id ? true : false} />
          <Field name='searchVolume' label='検索数' component={renderNumberInput} style={{display: values.id ? 'block' : 'none'}} />
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button variant='contained' color='primary' type='submit'>{values.id ? '更新' : '作成'}</Button>
            <div style={{flex: 1}} />
            {values.id && <Button variant='contained' color='secondary' onClick={() => this.setState({removeOpen: true})}>削除</Button>}
          </div>
        </form>
        <ConfirmDialog
          open={this.state.removeOpen}
          title='キーワードを削除しますか？'
          onSubmit={() => this.props.remove(values.id).then(() => this.props.history.push(`/searchKeyword/${key}`))}
          onClose={() => this.setState({removeOpen: false})}
        >
          {this.state.removeOpen && <div>削除対象のキーワード：{searchKeyword.keyword}</div>}
        </ConfirmDialog>
      </div>
    )
  }
}
