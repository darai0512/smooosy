import React from 'react'
import { withStyles } from '@material-ui/core/styles'

const Menus = ({classes, reviewCount, mediaCount, scrollToAbout, scrollToReview, scrollToMedia}) => (
  <div className={classes.menus}>
    <div className={classes.menu} onClick={scrollToAbout}>プロについて</div>
    {reviewCount > 0 && <div className={classes.menu} onClick={scrollToReview}>クチコミ({reviewCount})</div>}
    {mediaCount > 0 && <div className={classes.menu} onClick={scrollToMedia}>写真({mediaCount})</div>}
  </div>
)

export default withStyles(theme => ({
  menus: {
    display: 'flex',
    position: 'sticky',
    top: 0,
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    zIndex: 11, // 1 larger than ReadMoreWithCSS
  },
  menu: {
    padding: '15px 20px',
    fontSize: 14,
    color: theme.palette.grey[700],
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      padding: '15px 5px',
    },
    '&:hover': {
      color: theme.palette.common.black,
    },
  },
}))(Menus)
