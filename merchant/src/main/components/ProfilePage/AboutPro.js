import React from 'react'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import SecurityIcon from '@material-ui/icons/Security'
import AssignmentIcon from '@material-ui/icons/Assignment'
import ChatBubbleIcon from '@material-ui/icons/ChatBubbleOutline'
import DateRangeIcon from '@material-ui/icons/DateRange'

import { GAEvent } from '@smooosy/config'
const { category: { dialogOpen }, pageType } = GAEvent

import ReadMoreWithCSS from 'components/ReadMoreWithCSS'
import GAEventTracker from 'components/GAEventTracker'
import LicenceLink from 'components/LicenceLink'

const AboutPro = ({classes, aboutProRef, selectedService, profile, proService, hasServiceId, onClick}) => {
  const tmpProService = hasServiceId ? (proService || {}) : {}
  const description = tmpProService.description || profile.description
  const accomplishment = tmpProService.accomplishment || profile.accomplishment
  const advantage = tmpProService.advantage || profile.advantage

  const licences = profile.licences ? profile.licences.filter(l => l.status !== 'invalid' && l.status !== 'pending') : []
  return (
    <div ref={aboutProRef}>
    <h2 className={classes.title}>プロについて</h2>
    <div className={classes.about}>
      <div className={classes.aboutPro}>
        <ReadMoreWithCSS height={140}>
          {description &&
            <div className={classes.statement}>
              <h3>自己紹介（事業内容・提供するサービス）</h3>
              <div>{description}</div>
            </div>
          }
          {accomplishment &&
            <div className={classes.statement}>
              <h3>これまでの実績</h3>
              <div>{accomplishment}</div>
            </div>
          }
          {advantage &&
            <div className={classes.statement}>
              <h3>アピールポイント</h3>
              <div>{advantage}</div>
            </div>
          }
        </ReadMoreWithCSS>
      </div>
      {licences && licences.length > 0 &&
        <div className={classes.additionalInfo}>
          <SecurityIcon className={classes.additionalIcon} />
          <div className={classes.licences}>
            {licences.map((l, idx) =>
              <div key={l._id}>
                <LicenceLink rootClass={classes.licence} licence={l} />
                {idx !== licences.length - 1 ? <span className={classes.licenceSeparate}>/</span> : null}
              </div>
            )}
          </div>
        </div>
      }
      <div className={classes.requestButtons}>
        <GAEventTracker category={dialogOpen} action={pageType.ProfilePage} label={selectedService ? selectedService.key : ''} ><Button variant='outlined' color='primary' className={[classes.requestButton, classes.left].join(' ')} onClick={onClick}><AssignmentIcon className={classes.requestIcon} />見積もり依頼する</Button></GAEventTracker>
        <GAEventTracker category={dialogOpen} action={pageType.ProfilePage} label={selectedService ? selectedService.key : ''} ><Button variant='outlined' color='primary' className={[classes.requestButton, classes.center].join(' ')} onClick={onClick}><ChatBubbleIcon className={classes.requestIcon} />プロに依頼する</Button></GAEventTracker>
        <GAEventTracker category={dialogOpen} action={pageType.ProfilePage} label={selectedService ? selectedService.key : ''} ><Button variant='outlined' color='primary' className={[classes.requestButton, classes.right].join(' ')} onClick={onClick}><DateRangeIcon className={classes.requestIcon} />予定を確認する</Button></GAEventTracker>
      </div>
    </div>
  </div>
  )
}

export default withStyles(theme => ({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: '10px 0',
  },
  about: {
    width: '100%',
    margin: '0 auto',
    marginBottom: 60,
  },
  aboutPro: {
    flex: 1,
    fontSize: 14,
    whiteSpace: 'pre-wrap',
    margin: '0 0 10px',
    wordBreak: 'break-all',
  },
  statement: {
    marginBottom: 20,
  },
  subheader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  marginBottom: {
    marginBottom: 10,
  },
  additionalInfo: {
    fontSize: 14,
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
  licences: {
    display: 'flex',
    flexWrap: 'wrap',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  licence: {
    color: theme.palette.grey[700],
    fontWeight: 'normal',
  },
  licenceSeparate: {
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  requestButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  requestButton: {
    flex: 1,
    margin: 5,
    minWidth: 0,
    height: 40,
    border: `1px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  left: {
    marginLeft: 0,
  },
  center: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  right: {
    marginRight: 0,
  },
  requestIcon: {
    marginLeft: -10,
    marginRight: 10,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
}))(AboutPro)
