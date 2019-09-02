import React from 'react'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'

import VerifiedUserIcon from '@material-ui/icons/VerifiedUser'
import FaceIcon from '@material-ui/icons/Face'
import SupervisorIcon from '@material-ui/icons/SupervisorAccount'
import { amber } from '@material-ui/core/colors'

import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'
import ThanksButton from 'components/ThanksButton'

import { prefectures } from '@smooosy/config'


const ProSummary = ({classes, profile}) => (
  <div>
    <div className={classes.header}>
      <div className={classes.pro}>
        <div className={classes.avatar}>
          <UserAvatar size={160} user={profile.pro} alt={profile.name} className={classes.proImage} />
          {moment().diff(profile.pro.lastAccessedAt, 'minutes') < 5 &&
            <div className={classes.online}>
              <span className={classes.onlineDot}>●</span>
              <span>オンライン</span>
            </div>
          }
        </div>
        <div className={classes.proSummary}>
          <h1 className={classes.profileName}>{profile.name}</h1>
          <div className={classes.profileAddress}>
          {profile.categoryKey && prefectures[profile.prefecture] ?
            <><Link className={classes.profileAddressLink} to={`/t/${profile.categoryKey}/${prefectures[profile.prefecture]}`}>{profile.prefecture}</Link>{profile.address.replace(profile.prefecture, '')}</>
          : profile.address}
          </div>
          {profile.reviews.length > 0 &&
            <div className={classes.alignCenter}>
              <div className={classes.rating}>{profile.averageRating.toFixed(1)}</div>
              <div className={classes.stars}>
                <RatingStar rating={profile.averageRating} />
              </div>
              <span className={classes.count}>（{profile.reviews.length}件）</span>
            </div>
          }
          <div className={classes.additionalInfo}>
            {profile.experience && <div className={classes.additional}><FaceIcon className={classes.additionalIcon} />経験{profile.experience}年</div>}
            {profile.employees && <div className={classes.additional}><SupervisorIcon className={classes.additionalIcon} />従業員{profile.employees}人</div>}
          </div>
          {(profile.pro.identification || {}).status === 'valid' &&
            <div className={classes.alignCenter}>
              <VerifiedUserIcon className={classes.verifiedIcon} />
              <span className={classes.verified}>本人確認済み</span>
            </div>
          }
          <div className={classes.alignCenter}>
            <ThanksButton user={profile.pro} name={profile.name} />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default withStyles(theme => ({
  header: {
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      alignItems: 'center',
    },
  },
  pro: {
    marginTop: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      alignItems: 'center',
    },
  },
  avatar: {
    display: 'flex',
    flexDirection: 'column',
  },
  online: {
    textAlign: 'center',
    fontSize: 12,
  },
  onlineDot: {
    fontSize: 14,
    color: '#3cb371',
    marginRight: 5,
  },
  proSummary: {
    margin: '0 0 0 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  proImage: {
    width: 100,
    height: 100,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  profileAddress: {
    fontSize: 14,
    color: theme.palette.grey[700],
  },
  profileAddressLink: {
    color: theme.palette.grey[700],
    textDecoration: 'underline',
  },
  stars: {
    width: 100,
  },
  rating: {
    fontSize: 16,
    color: amber[700],
  },
  count: {
    fontSize: 14,
  },
  verifiedIcon: {
    marginRight: 5,
    width: 20,
    color: theme.palette.secondary.main,
  },
  verified: {
    fontSize: 14,
    color: theme.palette.grey[700],
  },
  share: {
    margin: '20px 0',
    minHeight: 31,
    display: 'flex',
    justifyContent: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
    },
  },
  alignCenter: {
    padding: 2,
    display: 'flex',
    alignItems: 'center',
  },
  additionalInfo: {
    fontSize: 12,
    color: theme.palette.grey[700],
    marginBottom: 5,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  additional: {
    marginRight: 20,
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  additionalIcon: {
    color: theme.palette.grey[700],
    width: 20,
    height: 20,
    marginRight: 5,
  },
}))(ProSummary)
