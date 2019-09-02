import React from 'react'
import { Avatar, Badge, StepIcon } from '@material-ui/core'
import { StepConnector, Stepper, Step, StepLabel } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import NavigationCheck from '@material-ui/icons/Check'
import NavigationClose from '@material-ui/icons/Close'
import withWidth from '@material-ui/core/withWidth'

import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'
import { avatarColors, MeetStatusType } from '@smooosy/config'

@withWidth()
@withStyles({
  badge: {
    width: 22,
    height: 22,
  },
  iconHidden: {
    display: 'none',
  },
  stepLine: {
    border: 'none',
  },
}, {withTheme: true})
export default class Insights extends React.PureComponent {
  render() {
    const { meet, user, theme, width, classes } = this.props

    const { grey } = theme.palette

    if (!meet) return null

    const request = meet.request

    const styles = {
      subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: '20px 0',
      },
      bar: {
        background: grey[300],
        height: 20,
        marginLeft: 20,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        textAlign: 'center',
        fontSize: 13,
      },
      stepper: {
        width: width === 'xs' ? 250 : 300,
        padding: 0,
      },
    }

    const maxPrice = meet.opponents.filter(m => m.priceType !== 'hourly').reduce((prev, m) => Math.max(prev, m.price), meet.priceType !== 'hourly' ? meet.price : 0)
    const maxHourlyPrice = meet.opponents.filter(m => m.priceType === 'hourly').reduce((prev, m) => Math.max(prev, m.price), meet.priceType === 'hourly' ? meet.price : 0)
    const slowMeet = meet.opponents.reduce((prev, m) => Math.max(prev, new Date(m.createdAt) - new Date(request.createdAt)), new Date(meet.createdAt) - new Date(request.createdAt))
    const myCompleted = {
      0: true,
      1: !!meet.chats[0].read,
      2: meet.chatStatus === MeetStatusType.RESPONDED,
      3: meet.status === 'progress' || meet.status === 'done',
    }

    const MyData = props =>
      <div style={{display: 'flex', alignItems: 'center', margin: '5px 0'}}>
        {(meet.status === 'progress' || meet.status === 'done') ?
          <Badge color='secondary' badgeContent={<NavigationCheck style={{width: 18, height: 18}} />} classes={{badge: classes.badge}}>
            <UserAvatar size={40} user={user} />
          </Badge>
        :
          <UserAvatar size={40} user={user} />
        }
        {props.children}
      </div>

    const OpponentData = props =>
      <div style={{display: 'flex', alignItems: 'center', margin: '5px 0'}}>
        {(props.meet.status === 'progress' || props.meet.status === 'done') ?
          <Badge color='secondary' badgeContent={<NavigationCheck style={{width: 18, height: 18}} />} classes={{badge: classes.badge}}>
            <Avatar style={{background: avatarColors[props.i]}}>{String.fromCharCode(65 + props.i)}</Avatar>
          </Badge>
        :
          <Avatar style={{background: avatarColors[props.i]}}>{String.fromCharCode(65 + props.i)}</Avatar>
        }
        {props.children}
      </div>

    return (
      <div style={{padding: width === 'xs' ? 10 : '10px 30px'}}>
        <MyData>
          <div style={{marginLeft: 20}}>
            <div style={{display: 'flex', alignItems: 'flex-end'}}>
              <div style={{marginRight: 10, width: 50}}>あなた</div>
              <div style={{fontSize: 13, color: grey[500]}}>{meet.profile.prefecture}{meet.profile.city}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{width: 120}}>
                <RatingStar rating={meet.profile.averageRating} />
              </div>
              <div style={{fontSize: 12, color: grey[500], marginLeft: 10}}>{meet.profile.reviews.length}件</div>
            </div>
          </div>
        </MyData>
        {meet.opponents.map((m, i) =>
          <OpponentData key={m.id} i={i} meet={m}>
            <div style={{marginLeft: 20}}>
              <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <div style={{marginRight: 10, width: 50}}>プロ {String.fromCharCode(65 + i)}</div>
                <div style={{fontSize: 13, color: grey[500]}}>{(m.profile || {}).prefecture}{(m.profile || {}).city}</div>
              </div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <div style={{width: 120}}>
                  <RatingStar rating={(m.profile || {}).averageRating || 0} />
                </div>
              </div>
            </div>
          </OpponentData>
        )}

        <div style={{margin: '10px 0', borderTop: `1px solid ${grey[300]}`}} />
        <div style={styles.subtitle}>進捗状況</div>
        <div style={{display: 'flex'}}>
          <div style={{width: 40}} />
          <Stepper alternativeLabel activeStep={4} style={styles.stepper}>
            {['見積', '既読', '返信', '成約'].map((label) =>
              <Step connector={<StepConnector classes={{line: classes.stepLine}} />} key={label}><StepLabel classes={{iconContainer: classes.iconHidden}} style={{marginTop: -16}}>{label}</StepLabel></Step>
            )}
          </Stepper>
        </div>
        <MyData>
          <MeetProgress completed={myCompleted} excluded={meet.status === 'exclude'} />
        </MyData>
        {meet.opponents.map((m, i) => {
          const completed = {
            0: true,
            1: !!m.chats[0].read,
            2: m.chatStatus === MeetStatusType.RESPONDED,
            3: m.status === 'progress' || m.status === 'done',
          }
          return (
            <OpponentData key={m.id} meet={m} i={i}>
              <MeetProgress completed={completed} excluded={m.status === 'exclude'} />
            </OpponentData>
          )
        })}
        <div style={{margin: '10px 0', borderTop: `1px solid ${grey[300]}`}} />
        <div style={styles.subtitle}>見積もり価格</div>
        <MyData>
          <div style={{...styles.bar, width: 20 + 150 * meet.price / (meet.priceType === 'hourly' ? maxHourlyPrice : maxPrice)}}>{meet.priceType === 'hourly' ? '時給' : ['tbd', 'needMoreInfo'].includes(meet.priceType) ? '未確定' : null}</div>
        </MyData>
        {meet.opponents.map((m, i) =>
          <OpponentData key={m.id} i={i} meet={m}>
            <div style={{...styles.bar, width: 20 + 150 * m.price / (m.priceType === 'hourly' ? maxHourlyPrice : maxPrice)}}>{m.priceType === 'hourly' ? '時給' : ['tbd', 'needMoreInfo'].includes(meet.priceType) ? '未確定' : null}</div>
          </OpponentData>
        )}

        <div style={{margin: '10px 0', borderTop: `1px solid ${grey[300]}`}} />
        <div style={styles.subtitle}>応募までの時間</div>
        <MyData>
          <div style={{...styles.bar, width: 20 + 150 * (new Date(meet.createdAt) - new Date(request.createdAt)) / slowMeet}} />
        </MyData>
        {meet.opponents.map((m, i) =>
          <OpponentData key={m.id} i={i} meet={m}>
            <div style={{...styles.bar, width: 20 + 150 * (new Date(m.createdAt) - new Date(request.createdAt)) / slowMeet}} />
          </OpponentData>
        )}
      </div>
    )
  }
}

const MeetProgress = withStyles(theme => ({
  labelContainer: {
    height: 0,
  },
  stepper: {
    width: 300,
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      width: 250,
    },
  },
}), {withTheme: true})(props => {
  const { completed, excluded, theme, classes } = props
  const { red } = theme.palette
  return (
    <Stepper alternativeLabel className={classes.stepper}>
      {[...new Array(4)].map((_, idx) =>
        <Step key={idx}>
          <StepLabel
            icon={
              <StepIcon
                active={false}
                completed={completed[idx]}
                icon={excluded && idx === 3 ? <NavigationClose style={{color: red[500]}} /> : idx + 1}
              />}
            classes={{labelContainer: classes.labelContainer}}
          />
        </Step>
      )}
    </Stepper>
  )
})
