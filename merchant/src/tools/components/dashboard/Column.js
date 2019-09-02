import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import { findDOMNode } from 'react-dom'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Button, Dialog, DialogContent, DialogActions, DialogTitle, withTheme, withStyles } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

import { update as updateService } from 'tools/modules/service'

import Card from 'tools/components/dashboard/Card'
import renderTextInput from 'components/form/renderTextInput'

const columnTargetForCard = {
  hover(props) {
    if (props.dest.column === props.column) return

    props.setMainState({
      dest: {
        column: props.column,
        index: props.dest.index || 0,
      },
    })
  },
  drop(props) {
    props.update()
  },
}

const columnSource = {
  beginDrag(props) {
    return {
      column: props.column,
    }
  },
}

const columnTarget = {
  hover(props, monitor, component) {
    const dragColumn = monitor.getItem().column
    const hoverColumn = props.column

    // Don't replace items with themselves
    if (dragColumn === hoverColumn)  return

    // Determine rectangle on screen
    // eslint-disable-next-line react/no-find-dom-node
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Get vertical center
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // Get pixels to the top
    const hoverClientX = clientOffset.x - hoverBoundingRect.left

    // Dragging down
    if (dragColumn < hoverColumn && hoverClientX < hoverMiddleX) return
    // Dragging up
    if (dragColumn > hoverColumn && hoverClientX > hoverMiddleX) return

    // Time to actually perform the action
    props.moveColumn(dragColumn, hoverColumn)

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().column = hoverColumn
  },
}

@withTheme
@DropTarget('column', columnTarget, connect => ({
  connectColumnDrop: connect.dropTarget(),
}))
@DragSource('column', columnSource, (connect, monitor) => ({
  connectColumnDrag: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
@DropTarget('card', columnTargetForCard, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
class Column extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }
  }

  beginDrag = source => {
    this.props.setMainState({
      source,
      dest: {column: source.column},
    })
  }

  onMove = (dest, copy) => {
    const { source } = this.props
    this.props.setMainState({dest, copy})
    if (source.column === dest.column) {
      const items = [...this.props.items]
      const target = items[source.index]
      items.splice(source.index, 1)
      items.splice(dest.index, 0, target)

      this.setState({items})
    }
  }

  endDrag = () => {
    this.setState({items: null})
    this.props.setMainState({source: {}, dest: {}})
  }

  openDialog = () => this.setState({open: true})
  onCloseDialog = () => {
    this.props.filter()
    this.setState({open: false})
  }

  render() {
    let { items, column, source, dest, dense, deleteItem, connectDropTarget, connectColumnDrag, connectColumnDrop, isDragging, theme, service, target } = this.props
    const { grey, red } = theme.palette

    items = this.state.items || items
    const spaceIndex = column !== source.column && column === dest.column ? dest.index : undefined

    const styles = {
      root: {
        flexShrink: 0,
        maxHeight: '100%',
        width: 200,
        marginRight: 6,
        padding: 6,
        background: grey[300],
        borderRadius: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        opacity: isDragging ? 0 : 1,
      },
      list: {
        flex: 1,
        minHeight: 60,
        marginBottom: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflowY: 'auto',
      },
      new: {
        color: grey[600],
      },
      singleBasePriceQuery: {
        background: red[50],
        borderRadius: 3,
        padding: 5,
        cursor: 'pointer',
      },
      divider: {
        border: `dashed 1px ${grey[800]}`,
        margin: '6px 0',
      },
    }


    return connectColumnDrag(connectColumnDrop(
      <div style={styles.root}>
        {this.props.renderHead(this.props)}
        {target === 'QueryDashboard' &&
          <>
            <div style={styles.divider} />
            {service.singleBasePriceQuery ?
              <div style={styles.singleBasePriceQuery} onClick={this.openDialog}>
                <div style={{color: red[500], fontSize: 12, fontWeight: 'bold'}}>単一基本料金</div>
                <div style={{fontWeight: 'bold'}}>{service.singleBasePriceQuery.title}</div>
                <div style={{color: grey[800], fontSize: 10}}>{service.singleBasePriceQuery.helperText}</div>
                <div style={{fontSize: 10}}>{service.singleBasePriceQuery.label}</div>
              </div>
              :
              <Button style={{color: grey[600]}} onClick={this.openDialog}><AddIcon style={{fontSize: 18, color: grey[600]}} />単一基本料金を設定</Button>
            }
            <div style={styles.divider} />
          </>
        }
        {connectDropTarget(
          <div style={styles.list}>
            {items.slice(0, spaceIndex).map((q, i) =>
              <Card
                key={i}
                item={q}
                count={this.props.count[q.id]}
                index={i}
                column={column}
                dense={dense}
                beginDrag={this.beginDrag}
                onMove={this.onMove}
                endDrag={this.endDrag}
                edit={this.props.edit}
                deleteItem={deleteItem ? () => deleteItem(column, i) : null}
                renderCard={this.props.renderCard}
              />
            )}
            {spaceIndex >= 0 &&
              <Card
                space
                index={spaceIndex}
                column={column}
                height={source.height}
                copy={this.props.copy}
                onMove={this.onMove}
              />
            }
            {spaceIndex >= 0 && items.slice(spaceIndex).map((q, i) =>
              <Card
                key={i}
                item={q}
                count={this.props.count[q.id]}
                index={spaceIndex + i + 1}
                column={column}
                dense={dense}
                beginDrag={this.beginDrag}
                onMove={this.onMove}
                endDrag={this.endDrag}
                renderCard={this.props.renderCard}
              />
            )}
          </div>
        )}
        {this.props.newItem && <Button size='small' style={styles.new} onClick={this.props.newItem}>
          質問を追加する
        </Button>}
        <SingleBasePriceDialog
          form={`singleBasePriceQuery_${service._id}`}
          open={this.state.open}
          onClose={this.onCloseDialog}
          initialValues={service.singleBasePriceQuery}
          service={service}
        />
      </div>
    ))
  }
}

export default Column

@reduxForm()
@connect(null, { updateService })
@withStyles(theme  => ({
  delete: {
    color: theme.palette.red[500],
    marginRight: 'auto',
  },
  titleSubText: {
    color: theme.palette.red[600],
    fontSize: 16,
  },
}))
class SingleBasePriceDialog extends React.Component {
  submit = values => {
    const { service } = this.props
    return this.props.updateService({singleBasePriceQuery: values, id: service._id})
      .then(() => this.props.onClose())
  }

  deleteSingleBasePriceQuery = () => {
    const { service } = this.props
    return this.props.updateService({singleBasePriceQuery: null, id: service._id})
      .then(() => this.props.onClose())
  }

  render() {
    const { service, handleSubmit, submitting, onClose, open, classes } = this.props
    if (!service || !service.queries) return null

    const baseQueries = service.queries.filter(q => q.priceFactorType === 'base').length
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          単一基本料金設定
          {baseQueries && <div className={classes.titleSubText}>現在{baseQueries}個の基本料金質問があります。単一基本料金を設定する場合は基本料金の質問は0個にしてください。</div>}
        </DialogTitle>
        <form onSubmit={handleSubmit(this.submit)}>
          <DialogContent>
            <Field name='title' label='料金質問タイトル' component={renderTextInput} />
            <Field name='helperText' label='補助テキスト' component={renderTextInput} />
            <Field name='label' label='入力欄横に表示される選択肢テキスト' component={renderTextInput} />
          </DialogContent>
          <DialogActions>
            <Button className={classes.delete} onClick={this.deleteSingleBasePriceQuery} variant='outlined'>削除する</Button>
            <Button onClick={onClose} variant='contained'>キャンセル</Button>
            <Button type='submit' disabled={submitting} color='primary' variant='contained'>保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    )
  }
}
