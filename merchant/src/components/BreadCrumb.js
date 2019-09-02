import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import { withRouter } from 'react-router'
const { webOrigin } = require('@smooosy/config')

const BreadCrumb = ({breads, style, classes, classRoot, location}) => {
  const structuredData = {
    '@context': 'http://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [],
  }
  breads.forEach((b, i) => {
    structuredData.itemListElement.push({
      '@type': 'ListItem',
      'position': i+1,
      'name': b.text,
      'item': i < breads.length - 1 ? (b.path ? `${webOrigin}${b.path}` : null) : `${webOrigin}${location.pathname}`,
    })
  })

  return (
    <>
    <Helmet>
      <script type='application/ld+json'>{JSON.stringify(structuredData)}</script>
    </Helmet>
    <nav>
      <ol className={classRoot ? [classes.root, classRoot].join(' ') : classes.root} style={style}>
      {breads.map((b, i) =>
        i < breads.length - 1 ?
          <li key={i} className={classes.list}>
            <Link to={b.path}>{b.text}</Link>
            <span> » </span>
          </li>
        :
          <li key={i} className={classes.list}>{b.text}</li>
      )}
      </ol>
    </nav>
    </>
  )
}

export default withRouter(withStyles(theme => ({
  root: {
    fontSize: 13,
    width: '100%',
    margin: '0 auto',
    listStyle: 'none',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  list: {
    display: 'inline',
  },
}))(BreadCrumb))
