import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { Paper, Avatar, Button, IconButton, CircularProgress } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import NavigationClose from '@material-ui/icons/Close'
import ImageAddAPhoto from '@material-ui/icons/AddAPhoto'
import MediaRow from 'components/MediaRow'
import renderTextInput from 'components/form/renderTextInput'
import renderTextArea from 'components/form/renderTextArea'
import ConfirmDialog from 'components/ConfirmDialog'
import { open as openSnack } from 'modules/snack'
import { getFileType } from 'lib/file'
import { parseVideoId } from 'lib/youtube'
import { imageSizes, fileMime } from '@smooosy/config'

const MEDIA_MAX = 24

@withWidth()
@reduxForm({
  form: 'media',
})
@withTheme
@connect(
  () => ({}),
  { openSnack }
)
export default class MediaListEdit extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      addMediaList: false,
      editMedia: false,
      checked: [],
    }
  }

  onClickAdd = () => {
    const idList = this.props.mediaList.media.map(m => m.id)
    const addMediaList = this.props.mediaAll.filter(m => idList.indexOf(m.id) === -1)
    this.setState({addMediaList})
  }

  createAndPrependMedia = (file) => {
    const { id, service, media } = this.props.mediaList
    const { createMedia, upsertList } = this.props
    return getFileType(file)
      .then(type => createMedia({...type, file}))
      .then(newMedia => {
        const data = {media: [newMedia.id, ...media.map(m => m.id)]}
        if (service) {
          data.service = service.id
        }
        return upsertList(id, data)
      })
  }

  handleUpload = (e) => {
    const limit = MEDIA_MAX - this.props.mediaList.media.length

    let files = [...e.target.files].filter(file => file && file.type && file.type.indexOf('image/') === 0)
    e.target.value = null

    if (files.find(e => e.size > 10 * 1024 * 1024)) {
      this.props.openSnack('10MB以下の写真のみ登録可能です')
      files = files.filter(e => e.size < 10 * 1024 * 1024)
    }
    if (files.length > limit) {
      this.props.openSnack(`写真は${MEDIA_MAX}枚まで登録可能です`)
    }

    files = files.slice(0, limit)
    if (files.length === 0) return

    this.setState({uploading: true, addMediaList: false})

    const upload = () => {
      const file = files.shift()
      this.createAndPrependMedia(file)
        .catch(e => this.props.openSnack(e.message))
        .then(() => {
          if (files.length) {
            upload()
          } else {
            this.setState({uploading: false})
          }
        })
    }
    upload()
  }

  toggle = (media) => {
    const checked = [...this.state.checked]
    const index = checked.indexOf(media.id)
    if (index === -1) {
      checked.push(media.id)
    } else {
      checked.splice(index, 1)
    }
    this.setState({checked})
  }

  prependMedia = () => {
    const { id, service, media } = this.props.mediaList
    const data = {media: [...this.state.checked, ...media.map(m => m.id)]}
    if (service) {
      data.service = service.id
    }
    this.props.upsertList(id, data)
    this.setState({addMediaList: false, checked: []})
  }

  onClickEdit = (id) => {
    const editMedia = this.props.mediaAll.filter(m => m.id === id)[0]
    if (!editMedia) return

    this.props.initialize(editMedia)
    this.props.reset()
    this.setState({editMedia})
  }

  updateList = (media) => {
    const { id, service } = this.props.mediaList
    const data = {media: media.map(m => m.id)}
    if (service) {
      data.service = service.id
    }
    this.props.upsertList(id, data)
  }

  saveMedia = (values) => {
    this.props.updateMedia(values.id, {text: values.text})
    this.props.reset()
    this.setState({editMedia: false})
  }

  createMovie = ({videoUrl}) => {
    videoUrl = videoUrl || ''
    const { id, service, media } = this.props.mediaList
    const { createMedia, upsertList } = this.props

    const videoId = parseVideoId(videoUrl)

    if (!videoId) {
      window.alert('https://youtube.com/watch?v=XXX の形式でURLを入力してください')
      return
    }

    createMedia({video: {youtube: videoId}}).then(newMedia => {
      const data = {media: [newMedia.id, ...media.map(m => m.id)]}
      if (service) {
        data.service = service.id
      }
      return upsertList(id, data)
    })
    this.setState({movie: false, addMediaList: false})
  }

  render() {
    const { editMedia, addMediaList, checked, movie } = this.state
    const { title, updateMedia, mediaList, handleSubmit, width, theme } = this.props

    const { common, grey, secondary } = theme.palette

    if (!mediaList) return null

    const limit = MEDIA_MAX - mediaList.media.length - checked.length

    const styles = {
      title: {
        margin: 10,
        fontWeight: 'bold',
        color: grey[700],
      },
      row: {
        display: 'flex',
        alignItems: 'center',
        margin: '10px 0 40px',
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
        background: grey[50],
      },
      addButton: {
        margin: 10,
        background: common.white,
        color: grey[700],
        cursor: 'pointer',
        boxShadow: 'rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px',
      },
      addImage: {
        position: 'relative',
        width: width === 'xs' ? '18vw' : 100,
        height: width === 'xs' ? '18vw' : 100,
        maxWidth: 100,
        maxHeight: 100,
        margin: 4,
        cursor: limit ? 'pointer' : 'not-allowed',
      },
      dummyAddImage: {
        width: width === 'xs' ? '18vw' : 100,
        maxWidth: 100,
        margin: '0 4px',
      },
      checkNumber: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        fontSize: 20,
        color: secondary.main,
        border: `5px solid ${secondary.main}`,
        background: 'rgba(0, 0, 0, .5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
      },
    }

    return (
      <div>
        {mediaList.service && (mediaList.id === 'new' || mediaList.media.length === 0) ?
          <div>
            <div style={styles.title}>
              「{mediaList.service.name}」用に設定する
            </div>
            <Avatar
              alt='画像追加'
              size={50}
              style={styles.addButton}
              onClick={this.onClickAdd}
            >
              {this.state.uploading ? <CircularProgress size={30} /> : <ImageAddAPhoto />}
            </Avatar>
          </div>
          :
          <div>
            <div style={styles.title}>
              {title}
              {title && `(${mediaList.media.length}/24)`}
            </div>
            <div style={styles.row}>
              {mediaList.media.length < 24 &&
                <Avatar
                  alt='画像追加'
                  size={50}
                  style={styles.addButton}
                  onClick={this.onClickAdd}
                >
                  {this.state.uploading ? <CircularProgress size={30} /> : <ImageAddAPhoto />}
                </Avatar>
              }
              <MediaRow media={mediaList.media} listId={mediaList.id} updateList={this.updateList} onClickEdit={this.onClickEdit} updateMedia={updateMedia} />
            </div>
          </div>
        }
        <input type='file' ref={(e) => this.uploadButton = e} style={{display: 'none'}} onChange={this.handleUpload} accept={[fileMime.types.image.jpeg, fileMime.types.image.png, fileMime.types.image.gif].join(',')} multiple={true} />
        <ConfirmDialog
          title={`写真・動画を追加${mediaList.service ? `（${mediaList.service.name}）` : ''}`}
          open={!!addMediaList}
          label='追加する'
          onSubmit={this.prependMedia}
          onClose={() => this.setState({addMediaList: false})}
        >
          <div style={{marginBottom: 10, fontWeight: 'bold', color: grey[700]}}>新規追加</div>
          <Button variant='contained' color='primary' disabled={limit === 0} onClick={() => this.uploadButton && this.uploadButton.click()}>写真を追加（複数可）</Button>
          <p style={{marginTop: 5}}>写真は10MB以下のJPEG, PNG, GIFに対応しています</p>
          <Button variant='contained' color='primary' disabled={limit === 0} style={{marginTop: 10}} onClick={() => this.setState({movie: true})}>動画を追加</Button>
          {addMediaList && addMediaList.length !== 0 &&
            <>
              <div style={{margin: '20px 0 10px', fontWeight: 'bold', color: grey[700]}}>アップロード済みから選択</div>
              <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
                {addMediaList.map(m => {
                  const index = checked.indexOf(m.id)
                  return (
                    <Paper style={styles.addImage} onClick={() => (index > -1 || limit) && this.toggle(m)} key={`add_${m.id}`}>
                      <img alt={m.text} src={m.url + imageSizes.c160} style={{width: '100%', height: '100%'}} />
                      {m.type === 'video' && <AvPlayCircleFilled style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, color: 'rgba(255, 255, 255, .5)'}} />}
                      {index > -1 && <div style={styles.checkNumber}>{index + 1}</div>}
                    </Paper>
                  )
                })}
                {[...Array(8)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummyAddImage} />)}
              </div>
            </>
          }
        </ConfirmDialog>
        <form>
          <ConfirmDialog
            title='コメントの編集'
            open={!!editMedia}
            label='保存する'
            onSubmit={handleSubmit(this.saveMedia)}
            onClose={() => this.setState({editMedia: false})}
          >
            <IconButton style={{position: 'absolute', top: 0, right: 0}} onClick={() => this.setState({editMedia: false})}>
              <NavigationClose />
            </IconButton>
            <div style={{margin: '10px auto', textAlign: 'center', position: 'relative'}}>
              <img alt={editMedia.text} src={editMedia.url + imageSizes.r320} style={{height: 200}} />
              {editMedia.type === 'video' && <AvPlayCircleFilled style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, color: 'rgba(255, 255, 255, .5)'}} />}
            </div>
            <Field name='text' component={renderTextArea} type='text' textareaStyle={{resize: 'none'}} />
          </ConfirmDialog>
          <ConfirmDialog
            title='YouTubeのURLを追加'
            open={!!movie}
            onClose={() => this.setState({movie: false})}
            label='追加する'
            onSubmit={handleSubmit(this.createMovie)}
          >
            <Field name='videoUrl' component={renderTextInput} type='text' />
          </ConfirmDialog>
        </form>
      </div>
    )
  }
}
