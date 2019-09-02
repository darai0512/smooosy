import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import { findDOMNode } from 'react-dom'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { orange, lightGreen } from '@material-ui/core/colors'

import { onFocusChange } from 'tools/modules/dashboard'

const cardSource = {
  beginDrag(props, _, component) {
    // eslint-disable-next-line react/no-find-dom-node
    const rect = findDOMNode(component).getBoundingClientRect()
    props.beginDrag({
      column: props.column,
      index: props.index,
      id: props.item.id,
      height: rect.bottom - rect.top,
    })
    return {
      index: props.index,
      column: props.column,
      copy: false,
    }
  },
  endDrag(props) {
    props.endDrag()
  },
}

const cardTarget = {
  hover(props, monitor, component) {
    if (!component) return

    const item = monitor.getItem()
    const dragIndex = item.index
    const hoverIndex = props.index
    const dragColumn = item.column
    const hoverColumn = props.column

    // Determine rectangle on screen
    // eslint-disable-next-line react/no-find-dom-node
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // add or copy
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2
    const hoverClientX = clientOffset.x - hoverBoundingRect.left
    const copy = hoverClientX > hoverMiddleX

    // Don't replace items with themselves
    if (dragColumn === hoverColumn && dragIndex === hoverIndex && item.copy === copy) return

    // Get vertical center
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    // Dragging down
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
    // Dragging up
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return


    // Time to actually perform the action
    props.onMove({
      column: hoverColumn,
      index: hoverIndex,
    }, copy)

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex
    monitor.getItem().column = hoverColumn
    monitor.getItem().copy = copy
  },
}


@withTheme
@connect(
  (state, props) => ({
    focus: (props.item || {}).id === state.dashboard.focusCard,
  }),
  { onFocusChange }
)
@DropTarget('card', cardTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('card', cardSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class Card extends React.Component {
  deleteItem = e => {
    e.stopPropagation()
    this.props.deleteItem && this.props.deleteItem()
  }

  shouldComponentUpdate(nextProps) {
    const { item, dense, isDragging, focus, height, count, copy, index, column } = this.props
    return item !== nextProps.item || dense !== nextProps.dense || isDragging !== nextProps.isDragging
    || focus !== nextProps.focus || height !== nextProps.height || count !== nextProps.count
    || copy !== nextProps.copy || index != nextProps.index || column !== nextProps.column
  }

  onClick = () => {
    const { item, column, index } = this.props
    this.props.edit(item, column, index)
  }

  onMouseEnter = () => {
    const { item } = this.props
    this.props.onFocusChange(item.id)
  }

  onMouseLeave = () => {
    this.props.onFocusChange(null)
  }

  render() {
    const { item, dense, focus, deleteItem, isDragging, connectDragSource, connectDropTarget, theme } = this.props
    const { common, grey, primary, red, blue } = theme.palette

    const styles = {
      space: {
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        height: this.props.height || 47,
        marginBottom: 6,
        color: common.white,
        fontSize: 16,
        fontWeight: 'bold',
      },
      add: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 3,
        padding: 6,
        borderRadius: 4,
        background: this.props.copy ? grey[500] : grey[700],
      },
      copy: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 3,
        padding: 6,
        borderRadius: 4,
        background: this.props.copy ? grey[700] : grey[500],
      },
      root: {
        flexShrink: 0,
        marginBottom: 6,
        padding: 6,
        borderRadius: 4,
        background: isDragging ? grey[500] : focus ? lightGreen[100] : common.white,
        cursor: 'pointer',
      },
      content: {
        opacity: isDragging ? 0 : 1,
      },
      icon: {
        width: 18,
        height: 18,
        marginRight: 4,
      },
      summary: {
        color: item && item.subType === 'required' ? orange[900] : grey[900],
        fontWeight: 'bold',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: dense ? 'nowrap' : 'initial',
      },
      close: {
        display: deleteItem && focus ? 'block' : 'none',
        color: grey[500],
        width: 18,
        height: 18,
        marginLeft: 4,
      },
      text: {
        fontSize: 10,
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: dense ? 'nowrap' : 'initial',
      },
      proText: {
        color: red[500],
        fontSize: 10,
        width: '100%',
      },
      priceText: {
        color: blue[800],
        fontSize: 10,
      },
      options: {
        display: dense ? 'none' : 'block',
        marginTop: 6,
      },
      option: {
        fontSize: 10,
        color: grey[800],
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      image: {
        width: 20,
        height: 20,
        marginRight: 6,
        verticalAlign: 'middle',
      },
      count: {
        display: dense ? 'none' : 'block',
        fontSize: 10,
        textAlign: 'right',
      },
      published: {
        fontSize: 10,
        color: primary.main,
        textAlign: 'right',
      },
      unpublished: {
        fontSize: 10,
        color: grey[500],
        textAlign: 'right',
      },
    }

    if (this.props.space) {
      return connectDropTarget(
        <div style={styles.space}>
          <div style={styles.add}>+ 追加</div>
          <div style={styles.copy}>+ コピー</div>
        </div>
      )
    }

    return connectDragSource(connectDropTarget(
      <div
        style={styles.root}
        onClick={this.onClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        {this.props.renderCard({...this.props, styles, deleteItem: this.deleteItem})}
      </div>
    ), { dropEffect: 'copy' })
  }
}

export default Card
