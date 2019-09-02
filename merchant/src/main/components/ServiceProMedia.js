import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'

import MediaSlider from 'components/MediaSlider'
import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'
import LPButton from 'components/LPButton'
import GAEventTracker from 'components/GAEventTracker'
import { LazyLoadImage } from 'components/LazyLoad'
import { imageSizes } from '@smooosy/config'


@withStyles(theme => ({
  root: {
    justifyContent: 'center',
  },
  proMedia: {
    position: 'relative',
    width: '15vw',
    height: '15vw',
    maxWidth: 160,
    maxHeight: 160,
    padding: 2,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      width: '31vw',
      height: '31vw',
      padding: 1,
    },
  },
  dummyProMedia: {
    width: '15vw',
    maxWidth: 160,
    padding: 2,
    [theme.breakpoints.down('xs')]: {
      width: '31vw',
      padding: 1,
    },
  },
  mediaImg: {
    width: '100%',
    height: '100%',
    '&:hover': {
      opacity: .8,
    },
  },
  address: {
    fontSize: 12,
    color: theme.palette.grey[300],
  },
}))
export default class ServiceProMedia extends React.Component {
  state = {
    slideNumber: null,
  }

  render() {
    const { className, media, gaEvent, user, currentPath, classes } = this.props
    const { slideNumber } = this.state

    return (
      <div className={className + ' ' + classes.root}>
        {media.map((m, i) =>
          <div key={`proMedia_${m.id}`} className={classes.proMedia} onClick={() => this.setState({slideNumber: i})}>
            <LazyLoadImage key={`img_${m.id}`} src={m.url + imageSizes.c160} className={classes.mediaImg} alt={m.text} title={m.text} />
          </div>
        )}
        {[...Array(6)].map((_, i) => <div key={`dummy_${i}`} className={classes.dummyProMedia} />)}
        <MediaSlider
          media={media}
          slideNumber={slideNumber}
          onClose={() => this.setState({slideNumber: null})}
          content={media =>
            <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <UserAvatar user={media.profile.pro} alt={media.profile.name} style={{width: 50, height: 50, marginRight: 8}} />
                <div>
                  <div>{media.profile.name}</div>
                  <div className={classes.address}>{media.profile.address}</div>
                  {media.profile.reviews.length > 0 &&
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                      <div style={{width: 120}}>
                        <RatingStar rating={media.profile.averageRating} />
                      </div>
                      <div style={{fontSize: 12}}>（{media.profile.reviews.length}件）</div>
                    </div>
                  }
                </div>
              </div>
              {media.profile.pro.id !== user.id &&
                <GAEventTracker {...gaEvent}><LPButton component={Link} to={`${currentPath}?modal=true&sp=${media.profile.id}`} rel='nofollow'>SMOOOSYでプロを探す（無料）</LPButton></GAEventTracker>
              }
            </div>
          }
        />
      </div>
    )
  }
}
