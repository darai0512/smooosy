import React from 'react'
import { Toolbar, Typography, Checkbox, IconButton } from '@material-ui/core'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableFooter,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@material-ui/core'
import { withTheme, withStyles } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'


@withTheme
@withStyles({
  pagination: {
    height: 48,
    minHeight: 48,
  },
})
export default class EnhancedTable extends React.Component {
  static defaultProps = {
    color: '',
    title: '',
    columns: [], // { id, label, align, render }
    data: [],
    rowsPerPageOptions: [25, 50, 100],
    actions: [], // { icon, onClick }
    cellStyle: {},
  }

  constructor(props) {
    super(props)

    this.state = {
      order: 'asc',
      orderBy: '',
      selected: [],
      data: props.data.slice().map((d, i) => ({...d, defaultIndex: i})),
      page: 0,
      rowsPerPage: props.rowsPerPageOptions[0],
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.data === prevProps.data) return

    setTimeout(() => {
      this.handleRequestSort(this.state.orderBy, this.state.sort)
    }, 0)
  }

  handleRequestSort = (orderBy, sort) => {
    const order = this.state.orderBy === orderBy && this.state.order === 'desc' ? 'asc' : 'desc'

    let data = this.props.data.slice().map((d, i) => ({...d, defaultIndex: i}))
    if (orderBy) {
      data = data.sort((a, b) => {
        const aValue = sort ? sort(a) : a[orderBy] || '-'
        const bValue = sort ? sort(b) : b[orderBy] || '-'

        const o = order === 'desc' ? bValue > aValue : aValue > bValue
        return o ? 1 : -1
      })
    }

    this.setState({ data, order, orderBy, sort })
  }

  handleSelectAllClick = (event, checked) => {
    const { data, rowsPerPage, page } = this.state
    if (checked) {
      const selected = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => n.id)
      this.setState({ selected })
      return
    }
    this.setState({ selected: [] })
  }

  handleClick = (event, id) => {
    if (this.props.actions.length === 0) return

    const { selected } = this.state
    const selectedIndex = selected.indexOf(id)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      )
    }

    this.setState({ selected: newSelected })
  }

  handleChangePage = (event, page) => {
    this.setState({ page })
  }

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value })
  }

  isSelected = id => this.state.selected.indexOf(id) !== -1

  render() {
    const { style, title, color, columns, actions, rowsPerPageOptions, header, footer, cellStyle, children, theme, classes } = this.props
    const { data, order, orderBy, selected, rowsPerPage, page } = this.state
    const { common, grey, primary, secondary } = theme.palette

    const bgColor = color === 'primary' ? primary.main : common.white
    const textColor = color === 'primary' ? common.white : common.black
    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        ...style,
      },
      toolbar: {
        color: textColor,
        background: selected.length > 0 ? secondary.main : bgColor,
        borderBottom: `1px solid ${grey[300]}`,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      tableWrapper: {
        flex: 1,
        overflowX: 'auto',
        minWidth: '100%',
      },
      table: {
        minWidth: '100%',
      },
    }

    return (
      <div style={styles.root}>
        {(title || header || actions.length > 0) &&
          <Toolbar style={styles.toolbar}>
            <div style={styles.title}>
            {selected.length > 0 ?
              <Typography variant='subtitle1' style={{color: common.white}}>{selected.length}件選択中</Typography>
            :
              <div style={styles.title}>{title}</div>
            }
            </div>
            <div style={{flex: 1}} />
            {selected.length > 0 ?
              <div>
                {actions.map((action, i) =>
                  action.selectOne && selected.length > 1 ?
                    null
                  :
                  <IconButton key={i} onClick={() => {
                    action.onClick(selected)
                    action.reset && this.setState({selected: []})
                  }}>
                    <action.icon style={{color: common.white}} />
                  </IconButton>
                )}
                <IconButton onClick={() => this.setState({selected: []})}>
                  <CloseIcon style={{color: common.white}} />
                </IconButton>
              </div>
            : header}
          </Toolbar>
        }
        {children}
        <div style={styles.tableWrapper}>
          <Table style={styles.table}>
            <TableHead>
              <TableRow>
                {actions.length > 0 &&
                  <TableCell padding='checkbox'>
                    <Checkbox
                      color='primary'
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      checked={selected.length > 0}
                      onChange={this.handleSelectAllClick}
                    />
                  </TableCell>
                }
                {columns.map((column, i) =>
                  <TableCell
                    key={i}
                    align={column.align}
                    size={actions.length > 0 && i === 0 ? 'medium' : 'small'}
                  >
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={order}
                      onClick={() => this.handleRequestSort(column.id, column.sort)}
                    >
                      {column.label || column.id}
                    </TableSortLabel>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody style={{flex: 1, overflowY: 'auto'}}>
              {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, i) =>
                <TableRow
                  key={i}
                  hover={actions.length > 0}
                  style={{height: 36}}
                  onClick={event => this.handleClick(event, row.id)}
                  role='checkbox'
                  aria-checked={this.isSelected(row.id)}
                  tabIndex={-1}
                  selected={this.isSelected(row.id)}
                >
                  {actions.length > 0 &&
                    <TableCell padding='checkbox'>
                      <Checkbox color='primary' checked={this.isSelected(row.id)} style={{height: 36}} />
                    </TableCell>
                  }
                  {columns.map((column, i) =>
                    <TableCell
                      key={i}
                      align={column.align}
                      size={actions.length > 0 && i === 0 ? 'medium' : 'small'}
                      style={{...cellStyle, ...column.style}}
                    >
                      {column.render ?  column.render(row) : row[column.id]}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Table style={{borderTop: `1px solid ${grey[300]}`}}>
          <TableFooter style={{height: 48}}>
            <TableRow>
              <TableCell>{footer}</TableCell>
              <TablePagination
                classes={{toolbar: classes.pagination}}
                count={data.length}
                labelRowsPerPage='表示件数:'
                rowsPerPage={rowsPerPage}
                page={page}
                rowsPerPageOptions={rowsPerPageOptions}
                onChangePage={this.handleChangePage}
                onChangeRowsPerPage={this.handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  }
}
