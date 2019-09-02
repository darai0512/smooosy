import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'

let ArticleCategoryTree = ({wpCategories, classes}) => (
  wpCategories.map(c =>
    <React.Fragment key={c.key}>
      <h4 className={classes.categoryLink}>
        <Link to={`/t/${c.key}/media`}>{c.name}</Link>
      </h4>
      {c.services.map(s =>
        <div key={s.key} className={classes.link}>
          <Link to={`/services/${s.key}/media`}>{s.name}</Link>
        </div>
      )}
    </React.Fragment>
  )
)

ArticleCategoryTree = withStyles(theme => ({
  categoryLink: {
    margin: '20px 0 10px',
    '&:hover': {
      textDecoration: 'underline',
    },
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
  ':hover': {},
  link: {
    margin: '0 0 5px 20px',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 10,
      paddingRight: 10,
    },
  },
}))(ArticleCategoryTree)

export default ArticleCategoryTree
