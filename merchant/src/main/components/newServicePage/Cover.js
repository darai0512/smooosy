import React from 'react'
import { LazyLoadImage } from 'components/LazyLoad'
import { withStyles } from '@material-ui/core'

const Cover = withStyles(theme => ({
  root: {
    position: 'relative',
    height: '80vh',
    background: theme.palette.grey[100],
    overflow: 'hidden',
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 76px)',
    },
  },
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    background: theme.palette.grey[500],
  },
  mask: {
    position: 'absolute',
    height: '100%',
    background: 'linear-gradient(0deg,transparent,rgba(0,0,0,.3))',
    [theme.breakpoints.down('xs')]: {
      background: 'linear-gradient(0deg,transparent,rgba(0,0,0,.4))',
    },
  },
  coverContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      paddingTop: 70,
    },
  },
}))(({image, classes, children}) => {
  return (
    <div className={classes.root}>
      <LazyLoadImage layout='fill' className={[classes.fullSize, classes.image].join(' ')} src={image} />
      <div className={[classes.fullSize, classes.mask].join(' ')} />
      <div className={[classes.fullSize, classes.coverContent].join(' ')}>
        {children}
      </div>
    </div>
  )
})

export default Cover