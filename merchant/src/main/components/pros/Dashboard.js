import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Typography, Badge, Button, IconButton } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import { red, amber, cyan, blueGrey } from '@material-ui/core/colors'
import FiberNewIcon from '@material-ui/icons/FiberNew'
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import List from '@material-ui/icons/List'
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import ReviewIcon from '@material-ui/icons/Stars'
import { orange } from '@material-ui/core/colors'

import Container from 'components/Container'
import Footer from 'components/Footer'
import TaskBar from 'components/pros/TaskBar'
import ProOnBoarding from 'components/pros/ProOnBoarding'
import CampaignBanner from 'components/pros/CampaignBanner'

let onboarding

const ProDashboard = ({notices, width, theme}) => {
  const { common, grey, secondary } = theme.palette

  const styles = {
    wrap: {
      width: width === 'xs' ? '95%' : '100%',
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
    },
    item: {
      width: width === 'xs' ? '50%' : '33%',
    },
    link: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      border: `1px solid ${grey[300]}`,
      borderRadius: 5,
      background: common.white,
      fontSize: width === 'xs' ? 16 : 20,
      fontWeight: 'bold',
      color: grey[800],
      margin: width === 'xs' ? 5 : 10,
      padding: width === 'xs' ? 10 : 20,
      height: width === 'xs' ? 170 : 200,
    },
    icon: {
      width: width === 'xs' ? 60 : 100,
      height: width === 'xs' ? 60 : 100,
      margin: 10,
    },
    button: {
      fontWeight: 'bold',
      width: '100%',
      marginTop: width === 'xs' ? 3 : 6,
    },
  }

  const requestNoticeCount = notices.filter(n => n.type === 'newRequest').length
  const talkingNoticeCount = notices.filter(n => n.type === 'newChat' && /talking/.test(n.link)).length
  const hiredNoticeCount = notices.filter(n => n.type === 'workStart' || (n.type === 'newChat' && /hired/.test(n.link))).length
  const idNoticeCount = notices.filter(n => /identification/.test(n.type)).length

  return (
    <div>
      <Container>
        <div style={{width: '100%', margin: '0 auto 30px', padding: width === 'xs' ? '0 5px' : '0 20px 0 10px'}}>
          <CampaignBanner />
          <TaskBar />
        </div>
        <Typography variant={width === 'xs' ? 'h5' : 'h4'} style={{display: 'flex', alignItems: 'center', margin: 20}}>ダッシュボード<IconButton onClick={() => onboarding.handleOpen()}><InfoIcon style={{width: 32, height: 32, color: orange[500]}}/></IconButton></Typography>
        <div style={styles.wrap}>
          <div style={styles.item}>
            <Link style={styles.link} to='/pros/new-requests'>
              {requestNoticeCount ?
                <Badge badgeContent={requestNoticeCount} color='primary'>
                  <FiberNewIcon style={{...styles.icon, color: red[500]}} />
                </Badge>
              :
                <FiberNewIcon style={{...styles.icon, color: red[500]}} />
              }
              <div>新規募集</div>
            </Link>
          </div>
          <div style={styles.item}>
            <Link style={styles.link} to='/pros/hired'>
              {hiredNoticeCount ?
                <Badge badgeContent={hiredNoticeCount} color='primary'>
                  <CheckCircleIcon style={{...styles.icon, color: secondary.main}} />
                </Badge>
              :
                <CheckCircleIcon style={{...styles.icon, color: secondary.main}} />
              }
              <div>成約一覧</div>
            </Link>
          </div>
          <div style={styles.item}>
            <Link style={styles.link} to='/account/profiles'>
              {idNoticeCount ?
                <Badge badgeContent={idNoticeCount} color='primary'>
                  <AssignmentIndIcon style={{...styles.icon, color: blueGrey[400]}} />
                </Badge>
              :
                <AssignmentIndIcon style={{...styles.icon, color: blueGrey[400]}} />
              }
              <div>プロフィール</div>
            </Link>
          </div>
          <div style={styles.item}>
            <Link style={styles.link} to='/account/reviews'>
              <ReviewIcon style={{...styles.icon, color: amber[700]}} />
              <div>クチコミ</div>
            </Link>
          </div>
          <div style={styles.item}>
            <Link style={styles.link} to='/account/services'>
              <List style={{...styles.icon, color: amber[600]}} />
              <div>スケジュール管理</div>
            </Link>
          </div>
        </div>
        <ProOnBoarding onRef={ref => onboarding = ref} />
      </Container>
      <Footer />
    </div>
  )
}

export default connect(
  state => ({
    notices: state.notice.notices.filter(n => !n.checked),
  })
)(withWidth()(withTheme(ProDashboard)))
