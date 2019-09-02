import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core'

const ReleatedList = withStyles(theme => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingBottom: 0,
    [theme.breakpoints.down('xs')]: {
      alignItems: 'start',
      paddingBottom: 30,
    },
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
  },
  link: {
    fontSize: 16,
    marginBottom: 5,
    color: theme.palette.grey[700],
  },
}))(({classes, title, lists}) => (
  <div className={classes.list}>
    <div className={classes.links}>
      <h3>{title}</h3>
      {
        lists && lists.map(l =>
          <Link key={l.key} className={classes.link} to={`/services/${l.key}`}>{l.name}</Link>
        )
      }
    </div>
  </div>
))

export default ReleatedList