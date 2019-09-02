import React from 'react'
import { connect } from 'react-redux'
import { IconButton } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import EditorAttachFile from '@material-ui/icons/AttachFile'
import DeleteIcon from '@material-ui/icons/Close'

import { withApiClient } from 'contexts/apiClient'
import FileHandler from 'components/FileHandler'
import { open as openSnack } from 'modules/snack'
import { imageSizes } from '@smooosy/config'

@connect(
  () => ({}),
  { openSnack }
)
@withApiClient
export default class FileUploader extends React.Component {
  handleFile = (file, type, key) => {
    let fileType
    const images = ['jpg', 'png', 'gif']
    const audio = ['mp3', 'm4a', 'ogg', 'opus', 'flac', 'wav']
    const files = ['tif', 'bmp', 'webp', 'pdf', 'zip', 'tar', 'gz']
    if (images.includes(type.ext)) {
      fileType = 'image'
    } else if (audio.includes(type.ext)) {
      fileType = 'audio'
    } else if (files.includes(type.ext)) {
      fileType = 'file'
    } else {
      throw new Error('未対応のファイルです')
    }

    const endPoint = this.props.endPoint({file, type, key, fileType})
    this.props.apiClient
      .get(endPoint)
      .then(res => res.data)
      .then(data => {
        this.props.apiClient
          .put(data.signedUrl, file, {headers: {'Content-Type': type.mime}})
          .then(() => this.props.handleFile({data, file, type, fileType, key}))
          .catch(() => {
            if (this.props.onError) {
              this.props.onError({data, file, type, key})
            } else {
              this.props.openSnack('画像のアップロードに失敗しました', {anchor: {vertical: 'bottom', horizontal: 'left'}})
            }
          })
      })
      .catch(() => this.props.openSnack('画像のアップロードに失敗しました', {anchor: {vertical: 'bottom', horizontal: 'left'}}))
  }

  render() {
    const { children, ...custom } = this.props
    let onError = this.props.onError
    if (!onError) onError = message => this.props.openSnack(message, {anchor: {vertical: 'bottom', horizontal: 'left'}})

    return (
      <FileHandler {...custom} handleFile={this.handleFile} onError={onError}>
        {children}
      </FileHandler>
    )
  }
}

@withTheme
export class FileThumbnail extends React.Component {
  render() {
    const { files, theme } = this.props
    const { grey } = theme.palette

    const styles = {
      image: {
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        borderRadius: 8,
        background: '#fff',
      },
      file: {
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        color: grey[800],
        wordBreak: 'break-all',
        border: `5px solid ${grey[500]}`,
        background: '#fff',
      },
      fileName: {
        fontWeight: 'bold',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxHeight: '4em',
        display: '-webkit-box',
        width: '90%',
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
      },
      deleteIcon: {
        position: 'absolute',
        top: -5,
        right: 5,
        background: grey[800],
        width: 20,
        height: 20,
      },
    }
    if (files.length === 0) return <div />
    return (
      <div style={{marginTop: 5, display: 'flex', flexWrap: 'wrap'}}>
        {files.map((file, idx) =>
          <div key={idx} style={{height: 125, width: 125, padding: '0 10px 10px 0', position: 'relative'}}>
            {file.type === 'image' ?
              <img src={file.url + imageSizes.r320} style={styles.image}/>
            : ['audio', 'file'].includes(file.type) ?
              <div style={styles.file}>
                <EditorAttachFile style={{color: grey[800]}} />
                <div style={styles.fileName}>{file.name}</div>
              </div>
            : null}
            <IconButton style={styles.deleteIcon} onClick={() => this.props.onRemove(file, idx)}><DeleteIcon style={{color: '#fff', height: 20, width: 20}} /></IconButton>
          </div>
        )}
      </div>
    )
  }
}
