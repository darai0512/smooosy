import React from 'react'
import { TableRow, TableCell } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const CustomRow = ({ title, titleStyle, children, classes }) => (
  <TableRow className={classes.root}>
    <TableCell padding='none' className={classes.title} style={titleStyle}>{title}</TableCell>
    <TableCell className={classes.body}>{children}</TableCell>
  </TableRow>
)

export default withStyles(() => ({
  root: {
    height: 'initial',
  },
  title: {
    padding: 10,
    height: 'initial',
    overflow: 'initial',
    textOverflow: 'initial',
    whiteSpace: 'initial',
    width: '30%',
  },
  body: {
    padding: 10,
    height: 'initial',
    overflow: 'initial',
    textOverflow: 'initial',
    whiteSpace: 'initial',
    wordBreak: 'break-all',
  },
}))(CustomRow)
