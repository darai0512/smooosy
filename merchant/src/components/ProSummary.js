import React from 'react'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'
import { connect } from 'react-redux'

import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'

const ProSummary = props => {
  const { user, profile, hideAddress, showOnline, classes, onClick, me, className } = props

  return (
    <div className={[classes.root, className].join(' ')} style={{cursor: onClick ? 'pointer': 'normal'}} onClick={() => onClick && onClick()}>
      <UserAvatar size={160} user={user} me={me} className={classes.avatar} alt={profile.name} suspend={profile.suspend} large />
      <div className={classes.summary}>
        {
          !(!profile.suspend || profile.suspend === '一時休止' || me && user.id === me._id) &&
          <div style={{fontSize: 12, color: red[500]}}>このユーザーはアカウントを停止されています</div>
        }
        <h4 className={classes.ellipsis}>{profile.name}</h4>
        {!hideAddress && <div className={classes.address}>{profile.address}</div>}
        <div className={classes.rating}>
          <RatingStar rating={profile.averageRating} />
        </div>
        {showOnline && moment().diff(user.lastAccessedAt, 'minutes') < 5 && <div className={classes.onlineText}><span className={classes.online}>●</span><span>オンライン</span></div> }
      </div>
    </div>
  )
}

export default withStyles(theme => ({
  root: {
    display: 'flex',
  },
  avatar: {
    minWidth: 64,
    minHeight: 64,
  },
  summary: {
    flex: 1,
    marginLeft: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  ellipsis: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
  },
  withMedia: {
    maxWidth: '130px',
  },
  address: {
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  rating: {
    width: 120,
  },
  onlineText: {
    fontSize: 10,
  },
  online: {
    width: 3,
    height: 3,
    color: '#3cb371',
  },
}))(connect(state => ({me: state.auth.user}))(ProSummary))
