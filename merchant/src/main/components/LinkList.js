import React from 'react'
import { withStyles } from '@material-ui/core'
import Link from 'components/LessRenderLink'


let LinkList = ({list = [], linkFunction = () => {}, classes}) => (
  <div className={classes.root}>
    {list.map(l =>
      <Link key={l.key} to={linkFunction(l)} className={classes.link}>{l.name}</Link>
    )}
  </div>
)


LinkList = withStyles(theme => ({
  root: {
    columnCount: 4,
    [theme.breakpoints.down('sm')]: {
      columnCount: 3,
    },
    [theme.breakpoints.down('xs')]: {
      columnCount: 1,
    },
  },
  link: {
    display: 'block',
    marginBottom: 5,
    color: theme.palette.grey[700],
  },
}), {withTheme: true})(LinkList)

export default LinkList
