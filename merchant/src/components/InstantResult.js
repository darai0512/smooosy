import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Paper, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import { amber } from '@material-ui/core/colors'

import PlaceIcon from '@material-ui/icons/Place'

import { open as openSnack } from 'modules/snack'
import MediaSlider from 'components/MediaSlider'
import ProSummary from 'components/ProSummary'
import CustomChip from 'components/CustomChip'
import PriceBreakdown from 'components/PriceBreakdown'
import WeeklySchedule from 'components/WeeklySchedule'
import ReadMore from 'components/ReadMore'
import ListItem from '@material-ui/core/ListItem'
import UserAvatar from 'components/UserAvatar'
import RatingStar from 'components/RatingStar'
import { imageSizes } from '@smooosy/config'
import { scheduleConflictReason, getRegularHoliday } from 'lib/proService'
import { priceFormat, removeUselessWhiteSpaces } from 'lib/string'


const MAX_DISPLAY_MEDIA = 4

@withStyles(theme => ({
  row: {
    display: 'flex',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  column: {
    minWidth: 210,
    display: 'flex',
    flexDirection: 'column',
  },
  mainColumn: {
    flex: 1,
    marginRight: 20,
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    },
  },
  sideMain: {
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      width: 280,
    },
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
    },
  },
  stretch: {
    flex: 1,
  },
  spaceTop: {
    marginTop: 10,
  },
  tag: {
    marginTop: 5,
    marginBottom: 5,
  },
  msgWrap: {
    marginTop: 5,
  },
  msg: {
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    overflowY: 'hidden',
  },
  imageWrap: {
    [theme.breakpoints.down('sm')]: {
      marginBottom: 20,
    },
    [theme.breakpoints.down('xs')]: {
      marginBottom: 0,
    },
  },
  images: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePaper: {
    width: 65,
    height: 65,
    marginRight: 5,
    marginBottom: 5,
    position: 'relative',
  },
  videoIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    color: 'rgba(255, 255, 255, .5)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
  },
  button: {
    marginTop: 10,
    [theme.breakpoints.down('xs')]: {
      flex: 1,
      padding: '8px 5px',
      fontSize: 13,
    },
  },
  readMore: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    color: theme.palette.common.white,
    fontWeight: 'bold',
    textShadow: `1px 1px 1px ${theme.palette.common.black}`,
    fontSize: 12,
    cursor: 'pointer',
  },
  hideMobile: {
    display: 'inherit',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  showMobile: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inherit',
    },
  },
  schedule: {
    width: '100%',
  },
  listPadding: {
    padding: 15,
  },
  mobileProSummary: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  last: {
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  placeMobile: {
    color: theme.palette.grey[700],
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    marginBottom: 5,
  },
  placeIcon: {
    fontSize: 20,
  },
}), { withTheme: true })
@connect(
  state => ({
    user: state.auth.user,
  }),
  { openSnack }
)
export default class InstantResult extends React.PureComponent {

  constructor(props) {
    super(props)
    this.state = {slideNumber: null}
  }

  onClick = () => {
    const { proService, user } = this.props
    // 自分自身
    if (proService.user._id === user._id) {
      this.props.openSnack('自分に依頼することはできません')
      return
    }

    this.props.onClick(proService)
  }

  onClickSeeProfile = () => {
    this.props.onClickSeeProfile({
      proService: this.props.proService,
      shortId: this.props.proService.profile.shortId,
    })
  }

  onClickProSummary = () => {
    this.props.onClickProfile({
      proService: this.props.proService,
      shortId: this.props.proService.profile.shortId,
    })
  }

  onClickMedia = (e, idx) => {
    e.stopPropagation()
    this.setState({slideNumber: idx})
  }

  render () {
    const { proService, className, classes, loading, withRequest, specialSent, minValue } = this.props
    const { slideNumber } = this.state
    const schedule = proService.user.schedule
    const profile = { ...proService.profile, address: proService.address }

    let message = removeUselessWhiteSpaces(proService.description || profile.description || '')

    const { proService: { user, schedules }, queryParams: { date, start, end }, theme } = this.props
    const reason = scheduleConflictReason({user, schedules, date, start, end})
    const label = withRequest ? (proService.existingMeet ? 'チャットする' : 'このプロにも連絡する') : null

    const tagToInfo = {
      userMeet: {
        background: theme.palette.primary.main,
        label: 'あなたが連絡したプロ',
      },
      proMeet: {
        background: theme.palette.secondary.main,
        label: 'あなたに見積もり送信したプロ',
      },
    }

    const tagInfo = tagToInfo[proService.tag]

    return (
      <div className={className}>
        <div className={classes.row}>
          <div className={classes.hideMobile}>
            <div className={[classes.column, classes.mainColumn].join(' ')}>
              <ProSummary
                user={proService.user}
                profile={profile}
                showOnline
                onClick={this.onClickProSummary}
              />
              {tagInfo &&
                <div className={classes.tag}>
                  <CustomChip label={tagInfo.label} style={{background: tagInfo.background, color: theme.palette.common.white}} />
                </div>
              }
              <div className={classes.msgWrap}>
                <ReadMore className={classes.msg}>{message}</ReadMore>
              </div>
              <div className={[classes.stretch, classes.spaceTop].join(' ')} />
              {schedule && typeof schedule.startTime === 'number' && typeof schedule.endTime === 'number' &&
                <div>
                  営業時間:
                  {schedule.startTime}:00〜{schedule.endTime}:00
                </div>
              }
              {schedule && schedule.dayOff &&
                <WeeklySchedule className={classes.schedule} schedules={proService.schedules} startingDay={date} dayOff={schedule.dayOff} hideWeekday />
              }
            </div>
            <div className={classes.column}>
              <div className={classes.sideMain}>
                <Price loading={loading} price={proService.price} existingMeet={proService.existingMeet} specialSent={specialSent} minValue={minValue} />
                <div className={classes.imageWrap}>
                  <div className={classes.images}>
                    {proService.media.slice(0, MAX_DISPLAY_MEDIA).map((m, idx) =>
                      <Paper key={m.id} className={classes.imagePaper} onClick={(e) => this.onClickMedia(e, idx)}>
                        <img className={classes.image} alt={m.text} src={m.url + imageSizes.c160} />
                        {proService.media.length > MAX_DISPLAY_MEDIA && idx === MAX_DISPLAY_MEDIA - 1 ?
                          <div className={classes.readMore}>さらに見る</div>
                        : m.type === 'video' ?
                          <AvPlayCircleFilled className={classes.videoIcon} />
                        : null}
                      </Paper>
                    )}
                  </div>
                </div>
              </div>
              <div className={classes.stretch} />
              {(!specialSent || proService.existingMeet) &&
                <Button
                  className={classes.button}
                  variant='contained'
                  color='primary'
                  onClick={this.onClick}
                  disabled={!proService.existingMeet && !!reason}
                >
                  {label || reason || 'このプロに連絡する'}
                </Button>
              }
            </div>
          </div>
          <ListItem classes={{root: classes.listPadding}} className={classes.showMobile}>
            <div className={[classes.column, classes.mainColumn].join(' ')}>
              <div className={classes.placeMobile}><PlaceIcon className={classes.placeIcon} />{proService.address}</div>
              <div className={classes.mobileProSummary}>
                <ProSummaryMobile
                  minValue={minValue}
                  user={proService.user}
                  profile={profile}
                  showOnline
                  ellipsis
                  tag={proService.tag}
                  loading={loading}
                  price={proService.price}
                  existingMeet={proService.existingMeet}
                  message={message}
                  review={proService.bestReview}
                  onClick={this.onClickProSummary}
                />
              </div>
              {(!specialSent || proService.existingMeet) &&
                <div style={{display: 'flex'}}>
                  <Button
                    className={classes.button}
                    onClick={this.onClickSeeProfile}
                    variant='outlined'
                    disabled={!proService.existingMeet && !!reason}
                  >
                    プロフィールを見る
                  </Button>
                  <div style={{width: 10}} />
                  <Button
                    className={classes.button}
                    variant='outlined'
                    color='primary'
                    onClick={this.onClick}
                    disabled={!proService.existingMeet && !!reason}
                  >
                    {label || reason || 'このプロに連絡する'}
                  </Button>
                </div>
              }
            </div>
          </ListItem>
        </div>
        <MediaSlider media={proService.media} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} />
      </div>
    )
  }
}

let Price = ({loading, price, existingMeet, specialSent, classes, minValue}) => (
  <div>
    {loading ?
      <div className={classes.loading}>
        <img className={classes.loadingImage} src='/images/loading-dot.svg' />
      </div>
    : price && price.total > 0 ?
      <PriceBreakdown highlightTotal price={price} />
    : existingMeet ?
      <div className={classes.ask}>
        {priceFormat(existingMeet)}
      </div>
    :
      <div className={classes.ask}>
        {specialSent ? '価格を問い合わせ中' : minValue ? `${minValue}円〜` : '価格を問い合わせる'}
      </div>
    }
  </div>
)

Price = withStyles(theme => ({
  loading: {
    height: 36,
    textAlign: 'center',
  },
  loadingImage: {
    height: '100%',
  },
  ask: {
    textAlign: 'right',
    fontSize: 18,
    color: theme.palette.red[400],
  },
}))(Price)


let ProSummaryMobile = props => {
  const { user, profile, showOnline, tag, loading, price, existingMeet, classes, minValue, message, review, onClick = () => {} } = props

  const tagToInfo = {
    userMeet: {
      label: '連絡したプロ',
      class: classes.userMeet,
    },
    proMeet: {
      label: '見積したプロ',
      class: classes.proMeet,
    },
  }

  const tagInfo = tagToInfo[tag]

  const holidays = getRegularHoliday(user)

  return (
    <div className={classes.root}>
      <div className={classes.summary}>
        <div className={classes.flex}>
          <div className={classes.user}>
            <UserAvatar user={user} className={classes.avatar} alt={profile.name} />
            {showOnline && moment().diff(user.lastAccessedAt, 'minutes') < 5 && <div className={classes.onlineText}><span className={classes.online}>●</span><span>オンライン</span></div> }
          </div>
          <div className={classes.infoSection} onClick={onClick}>
            <div className={classes.nameSection}>
              <h4 className={[classes.ellipsis, classes.name].join(' ')}>{profile.name}</h4>
              {tagInfo &&
                <div className={classes.tag}>
                  <CustomChip label={tagInfo.label} className={tagInfo.class} />
                </div>
              }
            </div>
            <div className={classes.section}>
              <div className={classes.leftSection}>
                <div className={classes.starBase}>
                  <div className={profile.reviewCount > 0 ? classes.averageRating : classes.newPro}>{profile.reviewCount > 0 ? Number.parseFloat(profile.averageRating).toFixed(1) : '新規登録プロ'}</div>
                  {profile.reviewCount > 0 &&
                    <>
                      <div className={classes.rating}><RatingStar rating={profile.averageRating} /></div>
                      <div className={classes.reviewCount}>{`(${profile.reviewCount})`}</div>
                    </>
                  }
                </div>
                {user.setupBusinessHour ?
                  <div className={classes.holiday}>
                    <div className={classes.holidayIcon}>休</div>
                    {holidays && holidays.length ? holidays.join(',') : 'なし'}
                  </div>
                : null}
              </div>
              <div className={classes.priceSection}>
                {loading ?
                  <div className={classes.loading}>
                    <img className={classes.loadingImage} src='/images/loading-dot.svg' />
                  </div>
                : price && price.total > 0 ?
                  <div className={classes.priceWrap}>
                    <div className={classes.priceNote}>
                      {price.estimatePriceType === 'fixed' ? '見積価格' : '概算価格'}
                    </div>
                    <div className={classes.price}>
                      {Number(price.total || 0).toLocaleString()}円{price.estimatePriceType === 'minimum' ? '〜' : ''}
                    </div>
                  </div>
                : existingMeet ?
                  <div className={classes.price}>{priceFormat(existingMeet)}</div>
                :
                  <div className={classes.priceWrap}>
                    <div className={classes.priceNote}>見積価格</div>
                    {minValue ? <div className={classes.price}>{minValue}円〜</div> : <div className={classes.ask}>価格を相談する</div>}
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        {review ?
          <div className={[classes.description, classes.review].join(' ')}>
            <div className={classes.ratingWrap}>
              <div className={classes.ratingStar}><RatingStar rating={review.rating} /></div>
              <div className={classes.reviewName}>{review.username}さん</div>
            </div>
            <div className={[classes.ellipsis, classes.reviewText].join(' ')}>{review.text}</div>
          </div>
        :
          <div className={[classes.ellipsis, classes.description].join(' ')}>{message}</div>
        }
      </div>
    </div>
  )
}

ProSummaryMobile = withStyles(theme => ({
  root: {
    display: 'flex',
    width: '100%',
  },
  user: {
    display: 'flex',
    flexDirection: 'column',
    alignItems:  'center',
    marginRight: 10,
  },
  avatar: {
    minWidth: 55,
    minHeight: 55,
  },
  summary: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  nameSection: {
    display: 'flex',
  },
  ellipsis: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#448AFF',
  },
  withMedia: {
    maxWidth: '130px',
  },
  address: {
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  onlineText: {
    fontSize: 10,
    width: 60,
  },
  online: {
    width: 3,
    height: 3,
    color: '#3cb371',
  },
  starBase: {
    display: 'flex',
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 12,
    color: amber[700],
  },
  newPro: {
    fontSize: 12,
    color: amber[700],
  },
  rating: {
    width: 70,
  },
  reviewCount: {
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  infoSection: {
    flex: 1,
  },
  status: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  experience: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  loading: {
    height: 36,
    textAlign: 'center',
  },
  loadingImage: {
    height: '100%',
  },
  tag: {
    marginLeft: 5,
  },
  userMeet: {
    background: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  proMeet: {
    background: theme.palette.secondary.main,
    color: theme.palette.common.white,
  },
  priceSection: {
    display: 'flex',
  },
  priceNote: {
    fontSize: 13,
    color: theme.palette.grey[500],
    marginRight: 5,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceWrap: {
    maxWidth: 120,
  },
  description: {
    '-webkit-line-clamp': 3,
    fontSize: 12,
    marginTop: 5,
    color: theme.palette.grey[700],
    wordBreak: 'break-all',
  },
  review: {
    marginTop: 10,
    padding: 10,
    background: theme.palette.grey[200],
    borderRadius: 5,
  },
  reviewText: {
    '-webkit-line-clamp': 3,
  },
  ratingStar: {
    width: 80,
  },
  ratingWrap: {
    display: 'flex',
  },
  holiday: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[700],
    fontSize: 12,
    marginTop: 3,
  },
  holidayIcon: {
    background: theme.palette.grey[300],
    width: 18,
    height: 18,
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginRight: 5,
  },
  flex: {
    display: 'flex',
  },
  reviewName: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
  section: {
    display: 'flex',
  },
  leftSection: {
    flex: 1,
  },
  ask: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}))(ProSummaryMobile)
