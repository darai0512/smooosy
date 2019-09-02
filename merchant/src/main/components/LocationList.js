import React from 'react'
import Link from 'components/LessRenderLink'
import { withStyles } from '@material-ui/core/styles'

const LocationList = ({list, title, base, classes}) => {
  if (!list || list.length === 0) return null

  return [
    <h3 key='title' className={classes.title}>{title}</h3>,
    <span key='bar'> | </span>,
    ...list.map(a => [
      <Link key='link' to={`${base}/${a.key}`}>{a.name}</Link>,
      <span key='bar'> | </span>,
    ]),
  ]
}

export default withStyles({
  title: {
    marginTop: 5,
    fontWeight: 'bold',
  },
})(LocationList)
