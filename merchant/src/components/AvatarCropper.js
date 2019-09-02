import React from 'react'
import { connect } from 'react-redux'
import { Dialog, Button, IconButton } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import NavigationClose from '@material-ui/icons/Close'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import FileHandler from 'components/FileHandler'
import UserAvatar from 'components/UserAvatar'
import { open as openSnack } from 'modules/snack'
import { dataURLtoBlob } from 'lib/file'
import { fileMime } from '@smooosy/config'

@connect(
  null,
  { openSnack }
)
@withTheme
export default class AvatarCropper extends React.Component {
  static defaultProps = {
    size: 80,
  }

  constructor(props) {
    super(props)
    this.state = {
      open: false,
      cropperSrc: null,
    }
  }

  onCreateObjectURL = url => {
    this.setState({open: true, cropperSrc: url})
  }

  handleImage = (canvas) => {
    const mime = 'image/jpeg'
    const dataURL = canvas.toDataURL(mime)
    const blob = dataURLtoBlob(dataURL, mime)
    this.props.handleImage(blob)
    this.setState({open: false})
  }

  render() {
    const { open, cropperSrc } = this.state
    const { user, size, theme } = this.props

    const { common, grey, primary } = theme.palette

    const styles = {
      root: {
        background: grey[50],
        position: 'relative',
        borderRadius: 4,
        color: common.black,
      },
      text: {
        padding: '12px 24px',
        fontSize: 18,
        fontWeight: 'bold',
      },
      crop: {
        padding: '30px 9px',
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      button: {
        background: primary.main,
        color: common.white,
        fontSize: 14,
        marginLeft: 20,
        padding: '8px 16px',
        borderRadius: 2,
        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px',
        cursor: 'pointer',
      },
    }

    return (
      <div>
        <FileHandler
          className='avatarCropperFileHandler'
          acceptance={[fileMime.types.image.all]}
          onError={message => this.props.openSnack(message)}
          onCreateObjectURL={this.onCreateObjectURL}
        >
          <div style={{display: 'flex', alignItems: 'center'}}>
            <UserAvatar size={size} user={user} style={{width: size, height: size, cursor: 'pointer'}} />
            <div style={styles.button}>写真を選択</div>
          </div>
        </FileHandler>
        <Dialog
          open={!!open}
          disableBackdropClick
          onClose={() => this.setState({open: false})}
        >
          <div style={styles.root}>
            <IconButton style={{position: 'absolute', top: 0, right: 0}} onClick={() => this.setState({open: false})}>
              <NavigationClose />
            </IconButton>
            <div style={styles.text}>アイコン画像を編集</div>
            <div style={styles.crop}>
              <Cropper
                ref={(e) => this.cropper = e}
                style={{width: '100%', maxHeight: 320, minHeight: 200}}
                viewMode={2}
                src={cropperSrc}
                aspectRatio={1}
                autoCropArea={1}
                responsive={false}
                zoomable={false}
              />
            </div>
            <div style={{display: 'flex', alignItems: 'center', padding: 24}}>
              <div style={{flex: 1}} />
              <Button
                className='avatarCropperButton'
                variant='contained'
                color='primary'
                onClick={() => this.cropper && this.handleImage(this.cropper.getCroppedCanvas({fillColor: '#ffffff', weight: 320, width: 320}))}
              >
                設定する
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    )
  }
}
