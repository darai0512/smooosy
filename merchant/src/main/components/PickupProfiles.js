import React from 'react'
import { Paper, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import RatingStar from 'components/RatingStar'
import ReadMoreWithCSS from 'components/ReadMoreWithCSS'
import Loading from 'components/Loading'
import UserAvatar from 'components/UserAvatar'
import GAEventTracker from 'components/GAEventTracker'
import Link from 'components/LessRenderLink'
import { removeUselessWhiteSpaces } from 'lib/string'

const xs = 600
const sm = 800

const TRUNCATE_HEIGHT = 280
const TRUNCATE_LEAD_HEIGHT = 330

@withStyles(theme => ({
  contents: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: '24px 0 32px',
    margin: '0 auto',
    width: '90%',
    [theme.breakpoints.up(sm)]: {
      width: '100%',
    },
    [theme.breakpoints.down(xs)]: {
      width: '90%',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
    },
  },
  profile: {
    width: '49%',
    maxWidth: 500,
    marginBottom: 32,
    paddingBottom: 5,
    background: theme.palette.common.white,
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up(sm)]: {
      width: '32%',
    },
    [theme.breakpoints.down(xs)]: {
      width: '100%',
      marginBottom: 16,
    },
  },
  signupPro: {
    background: theme.palette.grey[200],
    justifyContent: 'center',
    alignItems: 'center',
    height: TRUNCATE_HEIGHT + 5,
    [theme.breakpoints.down(xs)]: {
      height: 200,
    },
  },
  dummyProfile: {
    width: '49%',
    [theme.breakpoints.up(sm)]: {
      width: '32%',
    },
    [theme.breakpoints.down(xs)]: {
      width: '100%',
    },
  },
  pro: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: 15,
    [theme.breakpoints.down(xs)]: {
      padding: 10,
    },
  },
  avatar: {
    width: 50,
    height: 50,
    marginRight: 8,
  },
  avatarImg: {
    borderRadius: '50%',
  },
  flex: {
    flex: 1,
  },
  proName: {
    color: theme.palette.common.black,
    fontSize: 16,
  },
  proAddress: {
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  proRating: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
  },
  review: {
    fontSize: 14,
    padding: '10px 15px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down(xs)]: {
      padding: 10,
    },
  },
  reviewText: {
    whiteSpace: 'pre-line',
  },
  stars: {
    width: 120,
  },
  description: {
    fontSize: 14,
    padding: '10px 15px',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    whiteSpace: 'pre-line',
    [theme.breakpoints.down(xs)]: {
      padding: 10,
    },
  },
  proButtonWrap: {
    margin: '10px 10px 5px',
  },
  proButton: {
    width: '100%',
  },
  becomePro: {
    margin: 20,
    fontWeight: 'bold',
    color: theme.palette.grey[800],
    textAlign: 'center',
  },
}))
export default class PickupProfiles extends React.Component {
  static defaultProps = {
    profiles: [],
    leads: [],
    buttonProps: null,
    becomePro: false,
  }

  render() {
    const { profiles, leads, buttonProps, becomePro, classes, customClasses, category, action, label, truncateHeight = TRUNCATE_HEIGHT } = this.props

    return profiles.length > 0 || leads.length > 0 ?
      <div className={classes.contents}>
        {
        [
          ...profiles.map(profile => {
            const review = profile.reviews.filter(r => r.rating > 3 && r.text && r.text.length > 30).pop() || null
            return (
              !review && !profile.description ? null :
              <Paper key={profile.id} className={classes.profile}>
                <ReadMoreWithCSS fixedHeight height={truncateHeight} customClasses={customClasses}>
                  <div className={classes.pro}>
                    <UserAvatar alt={profile.name} user={profile.pro} className={classes.avatar} />
                    <div className={classes.flex}>
                      <h3><Link to={`/p/${profile.shortId}`} className={classes.proName}>{profile.name}</Link></h3>
                      <div className={classes.proAddress}>{profile.address}</div>
                      {profile.reviewCount > 0 &&
                        <div className={classes.proRating}>
                          <div className={classes.stars}>
                            <RatingStar rating={profile.averageRating} />
                          </div>
                          <div>（{profile.reviewCount}件）</div>
                        </div>
                      }
                    </div>
                  </div>
                  {
                    review &&
                    <div className={classes.review}>
                      <p>{review.username}様からのクチコミ</p>
                      <div className={classes.stars}>
                        <RatingStar rating={review.rating} />
                      </div>
                      <div className={classes.reviewText}>{removeUselessWhiteSpaces(review.text)}</div>
                    </div>
                  }
                  {
                    profile.description &&
                    <div className={classes.description}>
                      {removeUselessWhiteSpaces(profile.description)}
                    </div>
                  }
                </ReadMoreWithCSS>
                {buttonProps &&
                  <div className={classes.proButtonWrap}>
                    <GAEventTracker category={category} action={action} label={label}>
                      <Button variant='contained' color='primary' classes={{root: classes.proButton}} {...buttonProps(profile)} rel='nofollow'>SMOOOSYでプロを探す（無料）</Button>
                    </GAEventTracker>
                  </div>
                }
              </Paper>
            )
          }),
          ...leads.map(lead => {
            return (
              <Paper key={lead.id} className={classes.profile}>
                <ReadMoreWithCSS fixedHeight height={TRUNCATE_LEAD_HEIGHT}>
                  <div className={classes.pro}>
                    <UserAvatar alt={lead.name} user={lead} className={classes.avatar} />
                    <div className={classes.flex}>
                      <h3 className={classes.proName}>{lead.name}</h3>
                      <div className={classes.proAddress}>{lead.address}</div>
                    </div>
                  </div>
                  <div className={classes.description}>
                    {lead.description}
                  </div>
                </ReadMoreWithCSS>
              </Paper>
            )
          }),
        ]
        }
        {becomePro &&
          <Paper className={[classes.profile, classes.signupPro].join(' ')}>
            <div className={classes.becomePro}>新しい顧客をお探しの事業者の方はこちら</div>
            <Link to='/pro'>
              <Button variant='contained' color='primary'>プロとして登録</Button>
            </Link>
          </Paper>
        }
        {[...Array(3)].map((_, i) => <div key={`dummy_${i}`} className={classes.dummyProfile} />)}
      </div>
    :
      <Loading style={{height: 300}} />
  }
}
