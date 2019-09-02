import React from 'react'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { findDOMNode } from 'react-dom'
import { Paper, IconButton } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ContentCreate from '@material-ui/icons/Create'
import NavigationClose from '@material-ui/icons/Close'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import ImageRotate90DegreesCcw from '@material-ui/icons/Rotate90DegreesCcw'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import withWidth from '@material-ui/core/withWidth'

import { imageSizes } from '@smooosy/config'

@DragDropContext(HTML5Backend)
export default class MediaRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      media: this.props.media,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.media !== prevProps.media) {
      this.setState({media: this.props.media})
    }
  }

  moveMedia = (dragIndex, hoverIndex, cb) => {
    const media = [...this.state.media]
    const dragMedia = media[dragIndex]
    media.splice(dragIndex, 1)
    media.splice(hoverIndex, 0, dragMedia)

    this.setState({media}, cb)
  }

  dropMedia = () => {
    this.props.updateList(this.state.media)
  }

  deleteMedia = (index) => {
    const media = [...this.state.media]
    media.splice(index, 1)

    this.setState({media})
    this.props.updateList(media)
  }

  render() {
    const { media } = this.state
    const { onClickEdit, updateMedia, listId } = this.props

    const styles = {
      photos: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 5px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }

    return (
      <div style={styles.photos}>
        {media.map((m, i) =>
          <Media key={m.id} index={i} media={m} moveMedia={this.moveMedia} dropMedia={this.dropMedia} onClickEdit={onClickEdit} deleteMedia={this.deleteMedia} listId={listId} updateMedia={updateMedia} length={media.length} />
        )}
      </div>
    )
  }
}

const mediaSource = {
  beginDrag(props) {
    return {index: props.index, listId: props.listId}
  },
}

const mediaTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    // Don't replace items in another MediaList
    if (props.listId !== monitor.getItem().listId) return

    // Don't replace items with themselves
    if (dragIndex === hoverIndex)  return

    // Determine rectangle on screen
    // eslint-disable-next-line react/no-find-dom-node
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Get horizontal center
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // Get pixels to the left
    const hoverClientX = clientOffset.x - hoverBoundingRect.left

    // Dragging right
    if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return
    // Dragging left
    if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return

    // Time to actually perform the action
    props.moveMedia(dragIndex, hoverIndex)

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex
  },
  drop(props) {
    props.dropMedia()
  },
}

@withWidth()
@DropTarget('media', mediaTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('media', mediaSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
@withStyles(theme => ({
  wrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    background: 'rgba(0, 0, 0, .5)',
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('xs')]: {
      opacity: 1,
      background: 'rgba(0, 0, 0, 0.12)',
    },
  },
  videoPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: - 20,
    marginLeft: -20,
    color: 'rgba(255, 255, 255, .5)',
  },
  img: {
    height: 100,
    width: 100,
  },
  iconButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    padding: 5,
  },
  edit: {
    top: 0,
    left: 0,
  },
  close: {
    top: 0,
    right: 0,
  },
  left: {
    bottom: 0,
    left: 0,
  },
  right: {
    bottom: 0,
    right: 0,
  },
  rotate: {
    bottom: 0,
    left: '50%',
    marginLeft: -15,
  },
  icon: {
    width: 20,
    height: 20,
    color: theme.palette.common.white,
  },
}))
class Media extends React.Component {
  sortMedia = (index, target) => {
    this.props.moveMedia(index, target, this.props.dropMedia)
  }

  rotateMedia = media => {
    if (!media) return
    let { id, rotation } = media
    rotation = (rotation || 0) + 90
    rotation = rotation === 360 ? 0 : rotation
    this.props.updateMedia(id, {rotation})
  }

  render () {
    const { index, media, length, onClickEdit, deleteMedia, isDragging, connectDragSource, connectDropTarget, classes } = this.props

    const styles = {
      photo: {
        width: 100,
        height: 100,
        margin: 5,
        position: 'relative',
        opacity: isDragging ? 0 : 1,
        cursor: 'move',
      },
    }

    return connectDragSource(connectDropTarget(
      <div style={styles.photo}>
        <Paper>
          <div ref={media.id} className={classes.img} style={{background: `url(${media.url}${imageSizes.c160}) center/cover`}}>
            {media.type === 'video' && <AvPlayCircleFilled className={classes.videoPlay} />}
          </div>
          <div className={classes.wrap}>
            <IconButton className={[classes.iconButton, classes.edit].join(' ')} onClick={() => onClickEdit(media.id)}><ContentCreate className={classes.icon} /></IconButton>
            <IconButton className={[classes.iconButton, classes.close].join(' ')} onClick={() => deleteMedia(index)}><NavigationClose className={classes.icon} /></IconButton>
            {index !== 0 &&
              <IconButton className={[classes.iconButton, classes.left].join(' ')} onClick={() => this.sortMedia(index, index - 1)}><NavigationChevronLeft className={classes.icon} /></IconButton>
            }
            {media.type === 'image' &&
              <IconButton className={[classes.iconButton, classes.rotate].join(' ')} onClick={() => this.rotateMedia(media)}><ImageRotate90DegreesCcw className={classes.icon} /></IconButton>
            }
            {index !== length - 1 &&
              <IconButton className={[classes.iconButton, classes.right].join(' ')} onClick={() => this.sortMedia(index, index + 1)}><NavigationChevronRight className={classes.icon} /></IconButton>
            }
          </div>
        </Paper>
      </div>
    ))
  }
}
