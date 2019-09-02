import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { IconButton, Badge, Menu, ListSubheader, ListItem, withStyles } from '@material-ui/core'
import { amber, blue, orange, red, yellow, lightBlue, deepOrange, pink } from '@material-ui/core/colors'
import Notifications from '@material-ui/icons/Notifications'
import PersonPin from '@material-ui/icons/PersonPin'
import Chat from '@material-ui/icons/Chat'
import Work from '@material-ui/icons/Work'
import Stars from '@material-ui/icons/Stars'
import RateReview from '@material-ui/icons/RateReview'
import VerifiedUser from '@material-ui/icons/VerifiedUser'
import ErrorIcon from '@material-ui/icons/Error'
import AssignmentIcon from '@material-ui/icons/Assignment'
import EventIcon from '@material-ui/icons/Event'
import Announcement from '@material-ui/icons/Announcement'
import CheckCircle from '@material-ui/icons/CheckCircle'
import FavoriteIcon from '@material-ui/icons/Favorite'
import EmailIcon from '@material-ui/icons/Email'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'

import { ListItemNotice as TaxNotice } from 'components/pros/ConsumptionTaxDialog'

import { load, read, readAll } from 'modules/notice'
import { relativeTime } from 'lib/date'
import { getBoolValue } from 'lib/runtimeConfig'

const icons = {
  newRequest: PersonPin,
  newChat: Chat,
  workStart: Work,
  meetEnd: RateReview,
  reviewDone: Stars,
  reviewAppend: Stars,
  identificationValid: VerifiedUser,
  identificationInvalid: ErrorIcon,
  newMeet: AssignmentIcon,
  bookingRequest: EventIcon,
  remindMeets: CheckCircle,
  thanks: FavoriteIcon,
  addEmail: EmailIcon,
  lowBudget: MonetizationOnIcon,
}

@connect(
  state => ({
    user: state.auth.user,
    notices: state.notice.notices,
    unread: state.notice.unread,
    showTaxChange: getBoolValue(
      'showTaxChange',
      state.runtimeConfig.runtimeConfigs,
    ),
  }),
  { load, read, readAll }
)
@withStyles(theme => ({
  bellIcon: {
    width: 32,
    height: 32,
    color: theme.palette.grey[700],
  },
  reverseColor: {
    color: theme.palette.common.white,
  },
  notice: {
    width: '100%',
    maxWidth: 300,
    fontSize: 12,
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'pre-wrap',
  },
  title: {
    fontWeight: 'bold',
  },
  listItem: {
    background: theme.palette.common.white,
    padding: '8px 16px',
  },
  noNotice: {
    padding: '5px 10px',
    color: theme.palette.secondary.main,
    display: 'flex',
    justifyContent: 'center',
  },
  checked: {
    background: theme.palette.grey[200],
  },
  subHeader: {
    display: 'flex',
    outline: 'none',
    lineHeight: 'initial',
    padding: '5px 10px',
    fontSize: 12,
    background: theme.palette.common.white,
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  },
  noticeIcon: {
    marginRight: 10,
  },
  newRequestIcon: {color: amber[500]},
  newChatIcon: {color: blue[700]},
  workStartIcon: {color: orange[500]},
  meetEndIcon: {color: amber[800]},
  reviewDoneIcon: {color: amber[800]},
  reviewAppendIcon: {color: amber[800]},
  identificationValidIcon: {color: theme.palette.secondary.main},
  identificationInvalidIcon: {color: red[500]},
  newMeetIcon: {color: yellow[800]},
  bookingRequestIcon: {color: lightBlue[500]},
  remindMeetsIcon: {color: theme.palette.secondary.main},
  thanksIcon: {color: pink[400]},
  addEmailIcon: {color: red[500]},
  lowBudgetIcon: {color: yellow[800]},
  defaultIcon: {color: deepOrange[500]},
}))
@withRouter
export default class NoticeList extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      openMenu: false,
      page: 1,
    }
  }

  componentDidMount() {
    this.props.load()
  }

  handleClick = (id, link) => {
    id && this.props.read(id)
    this.setState({openMenu: false})
    this.props.history.push(link)
  }

  markAsReadAll = () => {
    this.props.readAll()
    this.setState({page: 1})
  }

  showMore = () => {
    const page = this.state.page + 1
    this.props.load({page})
    this.setState({page})
  }

  render() {
    const { user, notices, unread, reverseColor, rootClass, classes, showTaxChange } = this.props

    const bellIconClass = [classes.bellIcon, reverseColor ? classes.reverseColor : null].join(' ')

    return (
      <div className={rootClass}>
        <IconButton onClick={e => this.setState({openMenu: !!notices, anchor: e.currentTarget})}>
          {
            unread ?
              <Badge badgeContent={unread} color='primary'>
                <Notifications className={bellIconClass} />
              </Badge>
            :
              <Notifications className={bellIconClass} />
          }
        </IconButton>
        <Menu
          open={this.state.openMenu}
          anchorEl={this.state.anchor}
          getContentAnchorEl={null}
          anchorOrigin={{horizontal: 'center', vertical: 'bottom'}}
          transformOrigin={{horizontal: 'center', vertical: 'top'}}
          onClose={() => this.setState({openMenu: false})}
          MenuListProps={{style: {padding: 0}}}
        >
          <ListSubheader className={classes.subHeader}>
            <div style={{flex: 1}} />
            <a onClick={() => this.markAsReadAll()}>全て既読にする</a>
          </ListSubheader>
          {user.pro && showTaxChange && <TaxNotice />}
          {notices.map(n => {
            const listItemClass = [classes.listItem, n.checked ? classes.checked : null].join(' ')
            const iconClass = [classes.noticeIcon, classes[`${n.type}Icon`] || classes.defaultIcon].join(' ')
            const Icon = icons[n.type] || Announcement
            return (
              <ListItem button divider dense key={n.id} onClick={() => this.handleClick(n.id, n.link)} className={listItemClass}>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%'}}>
                  <Icon className={iconClass} />
                  <div className={classes.notice}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 5}}>
                      <p className={classes.title}>{n.title}</p>
                      <p>{relativeTime(new Date(n.createdAt))}</p>
                    </div>
                    <p>{n.description}</p>
                  </div>
                </div>
              </ListItem>
            )
          })}
          {notices.length ?
            notices.length % 100 === 0 &&
            <ListItem button dense onClick={this.showMore} className={classes.noNotice}>
              もっと読む
            </ListItem>
          : user.pro && !showTaxChange && <ListItem button onClick={() => this.setState({openMenu: false})}>通知はありません</ListItem>
          }
        </Menu>
      </div>
    )
  }
}
