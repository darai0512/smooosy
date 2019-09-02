import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import { LazyLoadImage } from 'components/LazyLoad'
import { imageSizes } from '@smooosy/config'

let PickupMedia = (props) => {
  const { className, pickupMedia, classes } = props
  return (
    <div className={className}>
     {pickupMedia.map(m =>
        <div key={m.id} className={classes.pickupMedia}>
          <LazyLoadImage layout='fill' src={m.url + imageSizes.c320} alt={m.text} width='320' height='320' className={classes.pickupImg} />
          <p className={classes.mediaCaption}>photo by {m.user.lastname}{m.user.firstname}</p>
        </div>
      )}
    </div>
  )
}

PickupMedia = withStyles(theme => ({
  pickupMedia: {
    position: 'relative',
    width: '31vw',
    height: '31vw',
    maxWidth: 316,
    maxHeight: 316,
    margin: 2,
    [theme.breakpoints.down('xs')]: {
      margin: 1,
    },
  },
  pickupImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mediaCaption: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: '2px 4px',
    fontSize: 10,
    color: 'rgba(255, 255, 255, .8)',
    textShadow: '0 0 5px rgba(0, 0, 0, .8)',
    [theme.breakpoints.down('xs')]: {
      padding: '1px 2px',
      fontSize: 6,
    },
  },
}))(PickupMedia)

export default PickupMedia
