import React from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm } from 'redux-form'
import { Button, IconButton, Paper } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core'
import { red } from '@material-ui/core/colors'
import { create, update } from 'tools/modules/profileIntroduction'
import AddIcon from '@material-ui/icons/AddCircleOutline'
import CloseIcon from '@material-ui/icons/Close'
import Check from '@material-ui/icons/Check'

import Editor from 'components/Editor'
import FileUploader from 'components/FileUploader'
import renderTextInput from 'components/form/renderTextInput'
import ConfirmDialog from 'components/ConfirmDialog'
import { imageSizes, fileMime } from '@smooosy/config'


@withWidth()
@withTheme
@connect(
  (state) => ({
    mediaLists: state.media.mediaLists,
  }),
  {create, update}
)
@reduxForm({
  form: 'profileIntroductionEdit',
  validate: values => {
    const errors = {}
    if (!values.message) {
      errors.message = '必須項目です'
    }
    return errors
  },
})
export default class ProfileIntroductionEdit extends React.Component {

  state = {
    dialogCallback: null,
  }

  submit = (values) => {
    const { profile, target, introduction } = this.props
    const data = {
      profile: profile.id,
      target: target.id,
      reference: target.reference,
      ...values,
      prices: (values.prices || []).filter(p => p.title !== '' && p.value !== ''),
    }
    if (introduction) {
      this.props.update(introduction.id, data)
        .then(this.props.onClose)
    } else {
      this.props.create(data)
        .then(this.props.onClose)
    }
  }

  setImage = (data) => {
    this.props.change('image', data.url)
  }

  removeImage = () => {
    this.props.change('image', null)
  }

  componentDidMount = () => {
    const { introduction } = this.props
    if (introduction) {
      this.props.initialize(introduction)
    }
  }

  render () {
    const { handleSubmit, profile, target, mediaLists, width, theme } = this.props
    const { primary } = theme.palette
    const { dialogCallback, checked } = this.state

    const media = []
    for (let list of mediaLists) {
      if (list.service.id !== target) continue
      media.push(...list.media)
    }
    const idList = media.map(m => m.id)
    media.push(...profile.media.filter(m => idList.indexOf(m.id) === -1))


    const styles = {
      image: {
        position: 'relative',
      },
      imageClose: {
        position: 'absolute',
        top: 0,
        left: 272,
        zIndex: 1,
        background: 'rgba(255, 255, 255, .5)',
      },
      pickupMedia: {
        position: 'relative',
        margin: 5,
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {},
      },
      addImage: {
        position: 'relative',
        width: width === 'xs' ? '18vw' : 120,
        height: width === 'xs' ? '18vw' : 120,
        maxWidth: 120,
        maxHeight: 120,
        margin: 4,
        cursor: 'pointer',
      },
      dummyAddImage: {
        width: width === 'xs' ? '18vw' : 120,
        maxWidth: 120,
        margin: '0 4px',
      },
      checkNumber: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        fontSize: 20,
        color: primary.main,
        border: `5px solid ${primary.main}`,
        background: 'rgba(0, 0, 0, .5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
      },
    }

    return (
      <form>
        <div>{target.name}</div>
        <Field name='message' label='プロの紹介文' component={Editor} ready />
        <label>紹介画像</label>
        <Field name='image' component={({input}) =>
          <div style={styles.image}>
            {input.value ?
              <>
                <img src={input.value + imageSizes.proIntroduction} style={{objectFit: 'cover'}} />
                <IconButton style={styles.imageClose} onClick={() => this.removeImage()}>
                  <CloseIcon />
                </IconButton>
              </>
             :
              <>
                <Button variant='contained' color='primary' onClick={() => this.setState({dialogCallback: m => this.setImage(m)})}>
                  プロの画像から選択
                </Button>
                <FileUploader
                  acceptance={[fileMime.types.image.all]}
                  endPoint={({type}) => `/api/admin/profileIntroductions/getSignedUrl?ext=${type.ext}&mime=${type.mime}`}
                  handleFile={({data}) => this.setImage(data)}
                >
                  <Button variant='outlined' color='primary' style={{marginLeft: 10}}>
                    アップロード
                  </Button>
                </FileUploader>
              </>
            }
          </div>
        } />
        <Field name='caption' label='画像キャプション' component={renderTextInput} />
        <ConfirmDialog
          title='プロ紹介画像を選択'
          open={!!dialogCallback}
          label='追加する'
          onSubmit={() => this.setState({dialogCallback: null})}
          onClose={() => this.setState({dialogCallback: null})}
        >
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            {media.map(m => (
                <Paper key={`add_${m.id}`} style={styles.addImage} onClick={() => {
                  dialogCallback(m)
                  this.setState({dialogCallback: null})
                }}>
                  <img src={m.url + imageSizes.c160} style={{width: '100%', height: '100%'}} />
                  {checked === m.id && <div style={styles.checkNumber}><Check /></div>}
                </Paper>
            ))}
            {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummyAddImage} />)}
          </div>
        </ConfirmDialog>
        <FieldArray name='prices' component={renderPriceArrayField} />
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button size='medium' variant='contained' color='primary' onClick={handleSubmit(this.submit)}>更新</Button>
        </div>
      </form>
    )
  }
}

const renderPriceArrayField = ({fields, error}) => (
  <div>
    {fields.map((field, idx) =>
      <div key={idx}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <label>{`価格例${idx + 1}`}</label>
          {fields.length > 0 &&
            <IconButton style={{width: 24, height: 24}} onClick={() => fields.remove(idx)}><CloseIcon /></IconButton>
          }
        </div>
        <Field
          name={`${field}.title`}
          component={renderTextInput}
          placeholder={`価格パターン${idx + 1}`}
        />
        <Field
          name={`${field}.value`}
          component={renderTextInput}
          placeholder={`金額${idx + 1}`}
        />
      </div>
    )}
    {error && <div style={{color: red[500]}}>{error}</div>}
    <div style={{display: 'flex', justifyContent: 'center'}}>
      <Button color='primary' onClick={() => fields.push({title: '', value: ''})}>
        <AddIcon />
        価格例を追加
      </Button>
    </div>
  </div>
)
