import React from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm } from 'redux-form'
import { Button, CircularProgress, Chip } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import AddIcon from '@material-ui/icons/Add'

import ConfirmDialog from 'components/ConfirmDialog'
import Prompt from 'components/Prompt'
import renderTextInput from 'components/form/renderTextInput'
import renderSwitch from 'components/form/renderSwitch'

const renderTag = ({ input, meta, onDelete, ...custom }) => (
  <Chip onDelete={() => onDelete(input.value)} style={{margin: '0px 10px 10px 0px'}} {...custom} label={input.value} />
)

const renderTags = ({ fields, meta, onDelete, onAddTag, style, ...custom }) => (
  <div style={{display: 'flex', flexWrap: 'wrap', ...(style || {})}} {...custom}>
    { fields.map((name, idx) => <Field name={name} component={renderTag} key={`tag_${idx}`} onDelete={onDelete} />) }
    <Button style={{margin: '0px 10px 10px 0px'}} onClick={onAddTag}>
      <AddIcon style={{width: 16, height: 16}} />
      タグを追加する
    </Button>
  </div>
)

@reduxForm({
  form: 'proQuestion',
  enableReinitialize: true,
  initialValues: {},
})
@connect(
  state => ({
    values: state.form.proQuestion.values || {},
  })
)
@withTheme
export default class ProQuestionForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  handleRequestDeleteTag = (tag) => {
    this.props.change('tags', this.props.values.tags.filter(e => e !== tag))
  }

  handleAddTag = (tag) => {
    tag && this.props.change('tags', [...(this.props.values.tags || []), ...tag.split(/[,\s]+/)])
    this.setState({tagFormOpen: false})
  }

  render() {
    const { handleSubmit, submitting, values, services } = this.props

    return (
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', height: '80vh'}}>
        <div style={{flex: 1, overflowX: 'hidden', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16}}>
          <Field autoFocus={true} name='text' label='質問タイトル' component={renderTextInput} />
          <div style={{height: 'auto', padding: '10px 0px'}}>
            <FieldArray
              name='tags'
              component={renderTags}
              onDelete={this.handleRequestDeleteTag}
              style={{display: 'flex', alignItems: 'center'}}
              onAddTag={() => this.setState({tagFormOpen: true})}
            />
          </div>
        </div>
        <div style={{padding: 10, display: 'flex', alignItems: 'center', boxShadow: '0px -2px 2px rgba(0, 0, 0, .2)', zIndex: 10}}>
          {values.id && this.props.onRemove &&
            <Button color='secondary' onClick={() => this.setState({confirmOpen: true})}>
              この質問を削除する
            </Button>
          }
          {services && <div>{services.length}回利用</div>}
          <div style={{flex: 1}}/>
          <Field name='isPublished' component={renderSwitch} label='公開する' />
          <Button
            variant='contained'
            type='submit'
            disabled={submitting}
            color='primary'
          >
            {submitting ? <CircularProgress size={20} color='secondary' /> : values.id ? '更新する' : '作成する'}
          </Button>
        </div>
        <ConfirmDialog
          title='本当に削除してよろしいですか？'
          open={!!this.state.confirmOpen}
          onSubmit={() => this.props.onRemove(values)}
          onClose={() => this.setState({confirmOpen: false})}
        >
          {services &&
            <div>
              <div style={{fontWeight: 'bold'}}>利用しているサービス</div>
              {services.map((s, i) => <div key={i}>{s}</div>)}
            </div>
          }
        </ConfirmDialog>
        <Prompt
          title='タグ入力'
          open={!!this.state.tagFormOpen}
          onClose={() => this.setState({tagFormOpen: null})}
          onSubmit={this.handleAddTag}
        />
      </form>
    )
  }
}
