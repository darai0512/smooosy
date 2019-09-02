import React from 'react'
import RelatedList from 'components/RelatedList'
import { withStyles } from '@material-ui/core'

export default withStyles(theme => ({
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      justifyContent: 'start',
    },
  },
}))(({classes, recommends, trends}) => (
  <div className={classes.footer}>
    {recommends.length > 0 && <RelatedList title='おすすめのサービス' lists={recommends} />}
    {trends.length > 0 && <RelatedList title='SMOOOSYで人気のサービス' lists={trends} />}
    <RelatedList title='' lists={[]} />
  </div>
))
