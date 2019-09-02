import React from 'react'
import { withStyles } from '@material-ui/core'
import { Link } from 'react-router-dom'
import { Button, Paper } from '@material-ui/core'

import RatingStar from 'components/RatingStar'
import UserAvatar from 'components/UserAvatar'
import SimpleReview from 'components/SimpleReview'
import GAEventTracker from 'components/GAEventTracker'
import { imageSizes, prefectures } from '@smooosy/config'
import { withAMP } from 'contexts/amp'
import { LazyLoadImage } from 'components/LazyLoad'

@withAMP
@withStyles(theme => ({
  root: {
    padding: '20px 0 40px',
    borderTop: `1px solid ${theme.palette.grey[500]}`,
    display: 'flex',
    flexDirection: 'column',
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
      width: '100%',
      padding: '15px 0 30px',
    },
  },
  pro: {
    display: 'flex',
    alignItems: 'flex-start',
    paddingBottom: 10,
  },
  avatar: {
    height: 80,
    width: 80,
    marginRight: 8,
    [theme.breakpoints.down('xs')]: {
      height: 60,
      width: 60,
    },
  },
  avatarImg: {
    borderRadius: '50%',
  },
  flex: {
    flex: 1,
  },
  name: {
    color: theme.palette.common.black,
    fontSize: 20,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  address: {
    fontSize: 16,
    color: theme.palette.grey[700],
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
  },
  stars: {
    width: 120,
  },
  description: {
    fontSize: 16,
    whiteSpace: 'pre-wrap',
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 5,
  },
  float: {
    float: 'right',
    margin: '0 0 5px 10px',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  floatXs: {
    margin: '0 auto 20px',
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inline-block',
    },
  },
  image: {
    width: 240,
    height: 180,
    objectFit: 'cover',
  },
  caption: {
    color: theme.palette.grey[500],
    fontSize: 13,
    textAlign: 'center',
  },
  reviews: {
    paddingBottom: 20,
  },
  review: {
    marginBottom: 10,
  },
  prices: {
    paddingBottom: 30,
  },
  price: {
    display: 'flex',
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  priceTitle: {
    color: theme.palette.grey[800],
    width: '30%',
    fontSize: 15,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      fontSize: 14,
    },
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.palette.red[500],
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  hideInXs: {
    paddingBottom: 30,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  services: {
    fontSize: 13,
    display: 'flex',
  },
  service: {
    width: 120,
    margin: '0 5px 5px 0',
  },
  serviceImage: {
    width: 120,
    height: 80,
    objectFit: 'cover',
  },
  serviceName: {
    color: theme.palette.common.black,
    fontWeight: 'bold',
    padding: 5,
  },
  chips: {
    paddingTop: 5,
  },
  chip: {
    margin: 1,
  },
  proButton: {
    fontSize: 18,
    height: 50,
    width: '100%',
  },
}))
export default class ProIntroduction extends React.Component {
  static defaultProps = {
    gaEvent: {},
    buttonProps: () => ({}),
  }

  serviceSort = (a, b) => {
    const { introduction } = this.props
    if (a.id === introduction.target) return -1
    if (b.id === introduction.target) return 1
    return 0
  }

  render () {
    const { introduction, prefLocationServices, gaEvent, buttonProps, classes, isAMP } = this.props
    const profile = introduction.profile

    return (
      <article className={classes.root}>
        <section>
          {introduction.image &&
            <div className={classes.float}>
              <LazyLoadImage className={classes.image} width={240} height={180} src={introduction.image + imageSizes.proIntroduction} />
              <p className={classes.caption}>{introduction.caption}</p>
            </div>
          }
          <div className={classes.pro}>
            <UserAvatar alt={profile.name} user={profile.pro} className={classes.avatar} />
            <div className={classes.flex}>
              <Link to={`/p/${profile.shortId}`} className={classes.name}>{profile.name}</Link>
              <div className={classes.address}>{profile.address}</div>
              {profile.reviewCount > 0 &&
                <div className={classes.rating}>
                  <div className={classes.stars}>
                    <RatingStar rating={profile.averageRating} />
                  </div>
                  <div>（{profile.reviewCount}件）</div>
                </div>
              }
            </div>
          </div>
          <div className={classes.description} dangerouslySetInnerHTML={{__html: introduction.message}} />
        </section>
        {introduction.image &&
          <div className={classes.floatXs}>
            <LazyLoadImage className={classes.image} width={240} height={180} src={introduction.image + imageSizes.proIntroduction} />
            <p className={classes.caption}>{introduction.caption}</p>
          </div>
        }
        {profile.reviews.length > 0 &&
          <section>
            <div className={classes.subtitle}>クチコミ</div>
            <div className={classes.reviews}>
              {profile.reviews.map(r => <SimpleReview key={r.id} review={r} className={classes.review} />)}
            </div>
          </section>
        }
        {introduction.prices.length > 0 &&
          <section>
            <div className={classes.subtitle}>参考価格</div>
            <div className={classes.prices}>
              {introduction.prices.map((p, idx) =>
                <div key={`${p.title}_${idx}`} className={classes.price}>
                  <label className={classes.priceTitle}>{p.title}</label>
                  <div className={classes.priceValue}>{p.value}</div>
                </div>
              )}
            </div>
          </section>
        }
        {
          !isAMP &&
          <aside className={classes.hideInXs}>
            <div className={classes.subtitle}>対応サービス</div>
            <div className={classes.services}>
              {profile.services.sort(this.serviceSort).slice(0, 5).map(s =>
                <Paper key={s.id} className={classes.service} component={Link} to={(prefLocationServices || []).find(ps => ps.service === s.id && ps.name === profile.prefecture) ? `/services/${s.key}/${prefectures[profile.prefecture]}` : `/services/${s.key}`}>
                  <LazyLoadImage src={s.image + imageSizes.service} className={classes.serviceImage} width={120} height={80} />
                  <div className={classes.serviceName}>{s.name}</div>
                </Paper>
              )}
            </div>
          </aside>
        }
        <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label}>
          <Button
            variant='contained'
            color='primary'
            classes={{root: classes.proButton}}
            {...buttonProps(profile.id)}
            rel='nofollow'
          >
            SMOOOSYでプロを探す
          </Button>
        </GAEventTracker>
      </article>
    )

  }
}
