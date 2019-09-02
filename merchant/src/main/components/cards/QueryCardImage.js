import React from 'react'
import qs from 'qs'
import { Button, IconButton, CircularProgress, Radio, RadioGroup } from '@material-ui/core'
import { FormControl, FormControlLabel } from '@material-ui/core'
import NavigationClose from '@material-ui/icons/Close'
import FileUploader from 'components/FileUploader'
import Notice from 'components/Notice'
import { withStyles } from '@material-ui/core/styles'
import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardProgress from 'components/cards/QueryCardProgress'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { fileMime } from '@smooosy/config'


@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    background: '#fafafa',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    height: 600,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
    },
  },
  content: {
    padding: '0 24px 24px',
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      padding: '0 16px 16px',
    },
  },
  images: {
    margin: '20px 0px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  imageWrap: {
    position: 'relative',
    width: '45%',
    height: 300,
    margin: '0px 10px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      height: '70vw',
    },
  },
  uploading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 1,
  },
  note: {
    outline: 0,
    width: '100%',
    height: '25%',
    padding: '8px 12px',
    fontSize: 16,
    wordWrap: 'break-word',
    lineHeight: '24px',
    appearance: 'none',
    borderRadius: '0px 0px 4px 4px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    resize: 'none',
    display: 'inline-block',
    border: 'none',
    verticalAlign: 'middle',
    ':focus': {
      borderColor: '#448AFF',
    },
  },
  radioButton: {
    fontSize: '18px',
  },
  imageCloseButton: {
    width: 24,
    height: 24,
    padding: 0,
    position: 'absolute',
    top: 8,
    right: 8,
    background: theme.palette.grey[800],
    opacity: 0.5,
  },
  imageClose: {
    color: theme.palette.common.white,
  },
  require: {
    marginLet: 10,
    fontSize: 14,
  },
  notice: {
    marginTop: 15,
  },
}))
export default class QueryCardImage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      images: [],
      uploading: {},
    }
  }

  init = props => {
    const images = props.query.answers || []
    this.setState({
      images,
      addPhoto: (props.query.subType === 'required') || images.length > 0,
    })
  }

  UNSAFE_componentWillMount() {
    this.init(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.query.id !== nextProps.query.id) {
      this.init(nextProps)
    }
  }

  onCreateObjectURL = (url, key) => {
    const { uploading } = this.state
    uploading[key] = url
    this.setState({uploading})
  }

  handleFile = ({data, key}) => {
    const { images, uploading } = this.state
    delete uploading[key]
    images.push({image: data.imageUrl})
    this.setState({images, uploading})
  }

  handleFileError = ({key}) => {
    const { uploading } = this.state
    delete uploading[key]
    this.setState({uploading, fileError: '画像のアップロードに失敗しました'})
  }

  removeImage = (idx) => {
    const { images } = this.state
    images.splice(idx, 1)
    this.setState({images})
  }

  handleTextChange = (event, index) => {
    const { images } = this.state
    images[index].text = event.target.value
    this.setState({images})
  }

  next = (event) => {
    const { images } = this.state
    const answers = images
    this.props.next({event, queryId: this.props.query.id, answers})
  }

  prev = (event) => {
    const { images } = this.state
    const answers = images
    this.props.prev({event, queryId: this.props.query.id, answers})
  }

  toggle = (value) => {
    const addPhoto = value === 'yes'
    this.setState({addPhoto})
  }

  render() {
    const { onClose, progress, isFirstQuery, isLastQuery, query, classes } = this.props
    const { images, uploading } = this.state

    const styles = {
      image: {
        width: '100%',
        height: '75%',
        borderRadius: '4px 4px 0px 0px',
      },
    }

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <QueryCardProgress value={progress} />
        <div className={classes.content}>
          <QueryCardHeader sub={query.subType === 'requred' ? '必須' : '任意'} helperText={query.helperText}>
            {query.text}
          </QueryCardHeader>
          {query.subType !== 'required' &&
            <FormControl>
              <RadioGroup name='addPhoto' value={this.state.addPhoto ? 'yes' : 'no'} onChange={(event, value) => this.toggle(value)}>
                <FormControlLabel value='no' control={<Radio color='primary' />} label='添付しない'/>
                <FormControlLabel value='yes' control={<Radio color='primary' />} label='添付する' />
              </RadioGroup>
            </FormControl>
          }
          {this.state.addPhoto &&
            <div>
              <FileUploader
                endPoint={({type}) => `/api/requests/getSignedUrl?${qs.stringify(type)}`}
                acceptance={[fileMime.types.image.all]}
                handleFile={this.handleFile}
                onError={this.handleFileError}
                onCreateObjectURL={this.onCreateObjectURL}
              >
                <Button color='primary' variant='contained' component='span'>画像を選択</Button>
              </FileUploader>
              {this.state.fileError && <Notice type='error' className={classes.notice}>{this.state.fileError}</Notice>}
              <div className={classes.images}>
                {images.map((image, idx) =>
                  <div key={`${query.id}_${idx}`} className={classes.imageWrap}>
                    <IconButton className={classes.imageCloseButton} onClick={() => this.removeImage(idx)}>
                      <NavigationClose className={classes.imageClose} />
                    </IconButton>
                    <div style={{...styles.image, background: `url(${image.image + '&w=640&h=-&t=r'}) center/cover`}} />
                    <textarea placeholder='画像の説明' className={classes.note} value={image.text} onChange={event => this.handleTextChange(event, idx)} />
                  </div>
                )}
                {Object.keys(uploading).map((key, idx) =>
                  <div key={`${query.id}_${idx}`} className={classes.imageWrap}>
                    <div className={classes.uploading}>
                      <CircularProgress size={60} />
                    </div>
                    <div style={{...styles.image, background: `url(${uploading[key]}) center/cover`, opacity: 0.5}} />
                  </div>
                )}
              </div>
            </div>
          }
        </div>
        <QueryCardFooter
          className='nextQuery image'
          disabledBack={Object.keys(uploading).length > 0}
          disabledNext={(query.subType === 'required' && images.length === 0) || Object.keys(uploading).length > 0}
          onPrev={isFirstQuery ? null : (event) => this.props.prev({event})}
          onNext={(event) => this.next(event)}
          prevTitle='戻る'
          nextTitle={Object.keys(uploading).length > 0 ? 'アップロード中' : isLastQuery ? '送信する' : '次へ'}
        />
      </div>
    )
  }
}
