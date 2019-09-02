import React from 'react'
import { withStyles } from '@material-ui/core'
import { withAMP } from 'contexts/amp'
import { Hidden } from '@material-ui/core'
import { Link } from 'react-router-dom'
import GAEventTracker from 'components/GAEventTracker'

const bannerList = new Set([
  'audition-photographers',
  'drone-aerial-photographers',
  'housing-architecture-photographers',
  'matchmaking-photographers',
  'portrait-photographers',
  'product-photographers',
  'shichigosan-photographers',
  'wedding-photographers',
  'wedding-videographers',
])


const LPBanner = ({serviceOrCategoryKey, to, gaEvent, isAMP, classes}) => (
  <>
    {/* <Hidden implementation='css' smDown>
      <GAEventTracker
        category={gaEvent.category}
        action={gaEvent.action}
        label={gaEvent.label}
        >
        <Link to={to} className={classes.link}>
          <img
            layout='responsive'
            src={bannerList.has(serviceOrCategoryKey) ? `https://smooosy.com/img/static/${serviceOrCategoryKey}_pc.jpg` : 'https://smooosy.com/img/static/otherservices_pc.jpg'}
            width={isAMP ? 10 : 'auto'}
            height={isAMP ? 1 : 'auto'}
            className={classes.bannerImg} />
        </Link>
      </GAEventTracker>
    </Hidden> */}
    <Hidden implementation='css' smUp>
      <GAEventTracker
        category={gaEvent.category}
        action={gaEvent.action}
        label={gaEvent.label}
        >
        <Link to={to} className={classes.link}>
          <img
            layout='responsive'
            src={bannerList.has(serviceOrCategoryKey) ? `https://smooosy.com/img/static/${serviceOrCategoryKey}_m.jpg` : 'https://smooosy.com/img/static/otherservices_m.jpg'}
            width={isAMP ? 3.947 : 'auto'}
            height={isAMP ? 1 : 'auto'}
            className={classes.bannerImg} />
        </Link>
      </GAEventTracker>
    </Hidden>
  </>
)

export default withAMP(
  withStyles(() => ({
    link: {
      display: 'block',
      background: '#ecf4db',
    },
    bannerImg: {
      margin: '0 auto',
      maxWidth: 1100,
      objectFit: 'cover',
      width: '100%',
    },
  }))(LPBanner)
)
