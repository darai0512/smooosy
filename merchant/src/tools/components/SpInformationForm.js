import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import { reduxForm, Field, FieldArray, formValueSelector } from 'redux-form'
import { Button, Dialog, MenuItem, Paper, Menu } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { open as openSnack } from 'tools/modules/snack'
import { update as updateService, relatedMedia } from 'tools/modules/service'
import ConfirmDialog from 'components/ConfirmDialog'
import Container from 'components/Container'
import GridPageInformation from 'components/GridPageInformation'
import renderSwitch from 'components/form/renderSwitch'
import PageInformation from 'tools/components/PageInformation'
import storage from 'lib/storage'
import { imageSizes } from '@smooosy/config'


const selector = formValueSelector('spInfoForm')
const autoSaveKeyPrefix = 'spcontent-autodraft-'

@withApiClient
@withStyles(theme => ({
  paper: {
    maxWidth: 1024,
  },
  addImage: {
    position: 'relative',
    width: 120,
    height: 120,
    maxWidth: 120,
    maxHeight: 120,
    margin: 4,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      width: '18vw',
      height: '18vw',
    },
  },
  dummyAddImage: {
    width: 120,
    maxWidth: 120,
    margin: '0 4px',
    [theme.breakpoints.down('xs')]: {
      width: '18vw',
    },
  },
}))
@connect(
  state => ({
    pageInformation: selector(state, 'pageInformation') || [],
    media: state.service.media,
  }),
  { updateService, relatedMedia, openSnack }
)
@reduxForm({
  form: 'spInfoForm',
  onChange: (values, dispatch, props) => {
    if (props.pageInformation && props.service) {
      const { pageInformation, service } = props
      const data = {
        id: service.id,
        date: new Date(),
        pageInformation: pageInformation,
      }
      storage.save(autoSaveKeyPrefix + service.id, data)
    }
  },
})
export default class SpInformationForm extends React.Component {
  state = {
    drafts: [],
  }

  componentDidMount() {
    const { service } = this.props
    const autoSaveDraft = storage.get(autoSaveKeyPrefix + service.id)
    if (autoSaveDraft) {
      this.props.change('pageInformation', autoSaveDraft.pageInformation)
      this.props.openSnack('自動バックアップからSPコンテンツの下書きを読み込みました')
    }
  }

  selectMediaCallback = dialogCallback => {
    this.props.relatedMedia(this.props.service.id)
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

  removeImage = idx => {
    this.props.change(`pageInformation[${idx}].image`, null)
    this.props.change(`pageInformation[${idx}].alt`, null)
    this.props.change(`pageInformation[${idx}].user`, null)
  }

  contentDraftSave = values => {
    const { service } = this.props
    const data = {
      id: values.id,
      pageInformation: values.pageInformation,
    }

    return this.props.apiClient.put(`/api/admin/services/${service.id}/contentDraft`, data)
      .then(res => res.data)
      .then(data => {
        storage.remove(autoSaveKeyPrefix + service.id)
        return data
      })
      .then(() => this.props.openSnack('下書き保存しました'))
  }

  contentDraftLoad = (anchor) => {
    const { service } = this.props
    this.props.apiClient
      .get(`/api/admin/services/${service.id}/contentDraft`)
      .then(res => res.data)
      .then(drafts => {
        this.setState({anchor, drafts})
      })
      .catch(() => {
        if (storage.get(autoSaveKeyPrefix + service.id)) {
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
    const { service } = this.props
    storage.remove(autoSaveKeyPrefix + service.id)
    this.props.reset()
    this.setState({anchor: null})
  }

  submit = values => {
    const { service } = this.props
    return this.props.updateService({
      id: values.id,
      pageInformation: values.pageInformation,
      spContentTopFlag: values.spContentTopFlag, // TODO: 移行後消す
    }).then(() => {
      this.props.openSnack('保存しました')
      storage.remove(autoSaveKeyPrefix + service.id)
      this.props.load()
    })
  }

  render() {
    const { service, pageInformation, media, handleSubmit, submitting, classes } = this.props
    const { drafts, dialogCallback, preview } = this.state

    const autoSaveDraft = storage.get(autoSaveKeyPrefix + service.id)

    return (
      <form>
        <FieldArray
          name='pageInformation'
          component={PageInformation}
          pageInformation={pageInformation}
          endPoint='/api/admin/services/pageInformation/getSignedUrl'
          addImage={this.addImage}
          removeImage={this.removeImage}
          selectMediaCallback={this.selectMediaCallback}
          initialValues={service.pageInformation}
          isService={true}
        />
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          {/* TODO: 移行後消す */}
          <Field name='spContentTopFlag' component={renderSwitch} label='SPコンテンツ順序入れ替え' />
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
          { autoSaveDraft && <MenuItem key={autoSaveKeyPrefix + service.id} onClick={this.removeAutoSaveDraft}>{`自動バックアップ削除 ${moment(autoSaveDraft.date).format('YYYY/MM/DD HH:mm:ss')}`}</MenuItem>}
        </Menu>
        <Dialog
          open={!!preview}
          classes={{paper: classes.paper}}
          onClose={() => this.setState({preview: false})}
        >
          <Container>
            <GridPageInformation
              information={pageInformation}
              priceProps={{price: service.price, service}}
              />
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
                className={classes.addImage}
                onClick={() => {
                  dialogCallback(m)
                  this.setState({dialogCallback: false})
                }}
              >
                <img src={m.url + imageSizes.c320} style={{width: '100%', height: '100%'}} />
              </Paper>
            )}
            {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} className={classes.dummyAddImage} />)}
          </div>
        </ConfirmDialog>
      </form>
    )
  }
}
