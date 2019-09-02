import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import moment from 'moment'
import { reduxForm, Field, FieldArray, formValueSelector, SubmissionError } from 'redux-form'
import { Button, Dialog, Snackbar, Table, TableBody, Paper, Menu, MenuItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { create, update, relatedMedia } from 'tools/modules/category'
import { open as openSnack } from 'tools/modules/snack'
import CustomRow from 'components/CustomRow'
import PageInformation from 'tools/components/PageInformation'
import Container from 'components/Container'
import GridPageInformation from 'components/GridPageInformation'
import ConfirmDialog from 'components/ConfirmDialog'
import renderNumberInput from 'components/form/renderNumberInput'
import renderSelect from 'components/form/renderSelect'
import renderTextArea from 'components/form/renderTextArea'
import renderTextInput from 'components/form/renderTextInput'
import storage from 'lib/storage'
import { imageSizes } from '@smooosy/config'
import { sections } from '@smooosy/config'

@withRouter
@reduxForm({
  form: 'CategoryBasicForm',
  initialValues: {
    key: '',
    name: '',
    providerName: '',
    parent: sections[0].key,
    priority: 0,
  },
  validate: values => {
    const errors = {}
    if (!values.key) {
      errors.key = '必須項目です'
    }
    if (!values.name) {
      errors.name = '必須項目です'
    }
    return errors
  },
})
@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { create, update, openSnack }
)
export class CategoryBasicForm extends React.Component {

  isAdmin = () => this.props.admin > 9

  submit = values => {
    const { category } = this.props
    if (this.props.isNew) {
      return this.props.create({
        ...values,
      })
      .then((c) => {
        this.props.history.push(`/categories/${c.key}`)
        this.props.initialize(c)
      })
      .catch((e) => {
        if (e.message === 'already exist') {
          const msg = 'カテゴリキーまたはカテゴリ名はすでに存在します'
          throw new SubmissionError({key: msg, name: msg})
        } else {
          this.props.openSnack('保存に失敗しました: ' + e.message)
        }
      })
    }
    this.props.update({
      id: category.id,
      ...values,
    })
    .then(() => {
      this.props.openSnack('保存しました')
      this.props.load()
    })
  }

  render() {
    const { category, submitting, handleSubmit, isNew } = this.props
    const section = sections.find(s => s.key == category.parent)

    return (
      <form>
        <Table style={{marginTop: 10}}>
          <TableBody>
            <CustomRow title='カテゴリキー'>
              {isNew ?
                <Field name='key' component={renderTextInput} type='text' />
              : <a href={`/t/${category.key}`} target='_blank' rel='noopener noreferrer'>{category.key}</a>}
            </CustomRow>
            <CustomRow title='カテゴリ名'>
              {this.isAdmin() ?
                <Field name='name' component={renderTextInput} type='text' />
              : category.name}
            </CustomRow>
            <CustomRow title='プロの呼び方'>
              {this.isAdmin() ?
                  <Field name='providerName' component={renderTextInput} type='text' />
                : category.providerName}
            </CustomRow>
            <CustomRow title='セクション'>
              {this.isAdmin() ?
                <Field name='parent' component={renderSelect} type='text'>
                  {sections.map(s => <MenuItem key={s.key} value={s.key}>{s.name}</MenuItem>)}
                </Field>
              : section ? section.name : ''}
            </CustomRow>
            <CustomRow title='優先度'>
              {this.isAdmin() ?
                <Field name='priority' component={renderNumberInput} type='number' afterLabel='/ 100' inputStyle={{width: 100}} />
              : <div>{category.priority} / 100</div>}
            </CustomRow>
          </TableBody>
        </Table>
        {this.isAdmin() &&
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button disabled={submitting} variant='contained' color='secondary' style={{marginTop: 10}} onClick={handleSubmit(this.submit)}>
              保存する
            </Button>
          </div>
        }
      </form>
    )
  }
}

@reduxForm({
  form: 'categorySeoForm',
})
@connect(
  state => ({
    admin: state.auth.admin,
  }),
  { update, openSnack }
)
export class CategorySeoForm extends React.Component {

  submit = values => {
    const { category } = this.props
    let data = {
      description: values.description,
      pageDescription: values.pageDescription,
      mediaListPageDescription: values.mediaListPageDescription,
    }
    this.props.update({
      id: category.id,
      ...data,
    })
    .then(() => {
      this.props.openSnack('保存しました')
      this.props.load()
    })
  }

  render() {
    const { submitting, handleSubmit } = this.props

    return (
      <form>
        <Table style={{marginTop: 10}}>
          <TableBody>
            <CustomRow title='カテゴリ説明'>
              <Field name='description' component={renderTextInput} type='text' />
            </CustomRow>
            <CustomRow title='CP説明文'>
              <Field name='pageDescription' component={renderTextArea} type='text' />
            </CustomRow>
            <CustomRow title='記事一覧ページの説明文'>
              <Field name='mediaListPageDescription' component={renderTextArea} type='text' />
            </CustomRow>
          </TableBody>
        </Table>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button disabled={submitting} variant='contained' color='secondary' style={{marginTop: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
      </form>
    )
  }
}

const selector = formValueSelector('PageInformationForm')
const autoSaveKeyPrefix = 'cpcontent-autodraft-'

@withApiClient
@withStyles({
  paper: {
    maxWidth: 1024,
  },
})
@connect(
  state => ({
    pageInformation: selector(state, 'pageInformation') || [],
    media: state.category.media,
  }),
  { update, relatedMedia, openSnack }
)
@reduxForm({
  form: 'PageInformationForm',
  enableReinitialize: true,
  onChange: (values, dispatch, props) => {
    if (props.pageInformation && props.category) {
      const { pageInformation, category } = props
      const data = {
        id: category.id,
        date: new Date(),
        pageInformation: pageInformation,
      }
      storage.save(autoSaveKeyPrefix + category.id, data)
    }
  },
})
export class PageInformationForm extends React.Component {
  state = {drafts: []}

  selectMediaCallback = dialogCallback => {
    this.props.relatedMedia(this.props.category.id)
      .then(() => this.setState({dialogCallback}))
  }

  addImage = (data, type, index) => {
    if (!['jpg', 'png', 'gif'].includes(type.ext)) {
      throw new Error('未対応のファイルです')
    }
    this.props.change(`pageInformation[${index}].image`, data.url)
    if (data.user) {
      this.props.change(`pageInformation[${index}].user`, data.user)
    }
  }

  componentDidMount() {
    const autoSaveDraft = storage.get(autoSaveKeyPrefix + this.props.category.id)
    if (autoSaveDraft) {
      this.props.change('pageInformation', autoSaveDraft.pageInformation)
      this.props.openSnack('自動バックアップからCPコンテンツの下書きを読み込みました')
    }
  }

  autoDraftSave = () => {
    const { pageInformation, category } = this.props
    const data = {
      id: category.id,
      date: new Date(),
      pageInformation: pageInformation,
    }
    storage.save(autoSaveKeyPrefix + category.id, data)
  }

  contentDraftSave = values => {
    const { category } = this.props
    const data = {
      id: category.id,
      pageInformation: values.pageInformation,
    }

    return this.props.apiClient.put(`/api/admin/categories/${data.id}/contentDraft`, data)
      .then(res => res.data)
      .then(data => {
        storage.remove(autoSaveKeyPrefix + category.id)
        return data
      })
      .then(() => this.props.openSnack('下書き保存しました'))
  }

  contentDraftLoad = (anchor) => {
    const { category } = this.props
    this.props.apiClient
      .get(`/api/admin/categories/${this.props.category.id}/contentDraft`)
      .then(res => res.data)
      .then(drafts => {
        this.setState({anchor, drafts})
      })
      .catch(() => {
        if (storage.get(autoSaveKeyPrefix + category.id)) {
          this.setState({anchor, drafts: []})
        } else {
          this.props.openSnack('下書きはありません')
        }
      })
  }

  openDraft = (pageInformation) => {
    this.setState({anchor: null})
    this.props.change('pageInformation', pageInformation)
    this.props.openSnack('下書きを読み込みました')
  }

  removeAutoSaveDraft = () => {
    storage.remove(autoSaveKeyPrefix + this.props.category.id)
    this.props.reset()
    this.setState({anchor: null})
  }

  removeImage = idx => {
    this.props.change(`pageInformation[${idx}].image`, null)
    this.props.change(`pageInformation[${idx}].alt`, null)
    this.props.change(`pageInformation[${idx}].user`, null)
  }

  submit = ({pageInformation}) => {
    return this.props.update({
      id: this.props.category.id,
      pageInformation,
    }).then(() => {
      storage.remove(autoSaveKeyPrefix + this.props.category.id)
      this.setState({snack: '保存しました'})
      this.props.load()
    })
  }

  render() {
    const { category, pageInformation, media, handleSubmit, submitting, classes } = this.props
    const { dialogCallback, drafts } = this.state

    const styles = {
      addImage: {
        position: 'relative',
        width: 120,
        height: 120,
        maxWidth: 120,
        maxHeight: 120,
        margin: 4,
        cursor: 'pointer',
      },
      dummyAddImage: {
        width: 120,
        maxWidth: 120,
        margin: '0 4px',
      },
    }

    const autoSaveDraft = storage.get(autoSaveKeyPrefix + category.id)

    return (
      <form>
        <FieldArray
          name='pageInformation'
          component={PageInformation}
          pageInformation={pageInformation}
          endPoint='/api/admin/categories/pageInformation/getSignedUrl'
          addImage={this.addImage}
          removeImage={this.removeImage}
          selectMediaCallback={this.selectMediaCallback}
          initialValues={category.pageInformation}
        />
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button disabled={submitting} color='primary' style={{marginLeft: 10}} onClick={(e) => this.contentDraftLoad(e.target)}>
            下書き読み込み
          </Button>
          <Button disabled={submitting} variant='contained' color='primary' style={{marginLeft: 10}} onClick={handleSubmit(this.contentDraftSave)}>
            下書き保存
          </Button>
          <Button color='secondary' style={{marginLeft: 10}} onClick={() => this.setState({preview: true})}>
            プレビュー
          </Button>
          <Button disabled={submitting} variant='contained' color='secondary' style={{marginLeft: 10}} onClick={handleSubmit(this.submit)}>
            保存する
          </Button>
        </div>
        <Menu
          open={!!this.state.anchor}
          anchorEl={this.state.anchor}
          onClose={() => this.setState({anchor: null})}
          MenuListProps={{style: {padding: 0}}}
        >
          {
            drafts.map((d, idx) =>
              <MenuItem key={`${d.id}+${idx}`} onClick={() => this.openDraft(d.pageInformation)}>{`下書き${idx + 1}` + (d.user ? ` ${d.user}` : '') + (d.date ? ` ${moment(d.date).format('YYYY/MM/DD HH:mm:ss')}` : '')}</MenuItem>
            )
          }
          { autoSaveDraft && <MenuItem key={autoSaveKeyPrefix + category.id} onClick={this.removeAutoSaveDraft}>{`自動バックアップ削除 ${moment(autoSaveDraft.date).format('YYYY/MM/DD HH:mm:ss')}`}</MenuItem>}
        </Menu>
        <Snackbar
          open={!!this.state.snack}
          autoHideDuration={3000}
          message={this.state.snack || ''}
          onClose={() => this.setState({snack: ''})}
        />
        <Dialog
          open={!!this.state.preview}
          classes={{paper: classes.paper}}
          onClose={() => this.setState({preview: false})}
        >
          <Container gradient>
            <GridPageInformation information={pageInformation} />
          </Container>
        </Dialog>
        <ConfirmDialog
          alert
          title='写真を追加'
          open={!!dialogCallback}
          onClose={() => this.setState({dialogCallback: false})}
          onSubmit={() => this.setState({dialogCallback: false})}
        >
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            {media && media.map(m =>
              <Paper
                key={m.id}
                style={styles.addImage}
                onClick={() => {
                  dialogCallback(m)
                  this.setState({dialogCallback: false})
                }}
              >
                <img src={m.url + imageSizes.c320} style={{width: '100%', height: '100%'}} />
              </Paper>
            )}
            {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummyAddImage} />)}
          </div>
        </ConfirmDialog>
      </form>
    )
  }
}
