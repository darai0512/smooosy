import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { logout } from 'tools/modules/auth'
import { withTheme } from '@material-ui/core/styles'
import { AppBar, Collapse, Drawer, List, Divider, ListItem, ListItemIcon, ListItemText, Button, IconButton, Snackbar, Toolbar } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { purple } from '@material-ui/core/colors'
import MenuIcon from '@material-ui/icons/Menu'
import FaceIcon from '@material-ui/icons/Face'
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd'
import NoteIcon from '@material-ui/icons/Note'
import ListIcon from '@material-ui/icons/List'
import DashboardIcon from '@material-ui/icons/Dashboard'
import ViewCompactIcon from '@material-ui/icons/ViewCompact'
import ActionRoomIcon from '@material-ui/icons/Room'
import SocialPeopleIcon from '@material-ui/icons/People'
import TrendingUpIcon from '@material-ui/icons/TrendingUp'
import WebIcon from '@material-ui/icons/Web'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import CallSplitIcon from '@material-ui/icons/CallSplit'
import ActionAccountCircleIcon from '@material-ui/icons/AccountCircle'
import ActionAssignmentIcon from '@material-ui/icons/Assignment'
import SearchIcon from '@material-ui/icons/Search'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import LicenseIcon from '@material-ui/icons/Beenhere'
import CSIcon from '@material-ui/icons/HeadsetMic'
import ProLabelIcon from '@material-ui/icons/Label'

import Dialer from 'tools/components/callCenter/Dialer'
import { close as closeSnack } from 'tools/modules/snack'

const menuWidth = 220

@withWidth()
@connect(
  state => ({
    admin: state.auth.admin,
    snack: state.snack,
  }),
  { logout, closeSnack }
)
@withTheme
export default class Layout extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      navOpen: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      this.setState({ navOpen: false })
    }
  }

  handleClickLogo = () => {
    this.props.history.push('/')
    this.setState({ navOpen: false })
  }

  handleChangeList = (event, value) => {
    this.props.history.push(value)
    this.setState({ navOpen: false })
  }

  handleClick = (name) => {
    this.setState({ [name]: !this.state[name] })
  }


  getNav = () => {
    const { admin, theme } = this.props

    const styles = {
      head: {
        height: 50,
        display: 'flex',
        alignItems: 'center',
        fontSize: 21,
        paddingLeft: 24,
        cursor: 'pointer',
        color: theme.palette.grey[800],
        borderBottom: `1px solid ${theme.palette.grey[300]}`,
      },
      settingItem: {
        paddingLeft: 36,
      },
    }

    return (
      <div style={{width: menuWidth}}>
        <div style={styles.head} onClick={this.handleClickLogo}>SMOOOSY tools</div>
        <List>
          <ListItem dense button component={Link} to='/stats/pros'><ListItemIcon><FaceIcon /></ListItemIcon><ListItemText primary='プロの情報' /></ListItem>
          {admin > 1 && <ListItem dense button component={Link} to='/stats/requests'><ListItemIcon><AssignmentIndIcon /></ListItemIcon><ListItemText primary='依頼情報' /></ListItem>}
          <Divider />
          <ListItem dense button onClick={() => this.handleClick('serviceOpen')}>
            <ListItemText primary='サービス関連' />
            {this.state.serviceOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={!!this.state.serviceOpen} timeout='auto'>
            {admin > 1 && <ListItem dense button component={Link} to='/services'><ListItemIcon><ListIcon /></ListItemIcon><ListItemText primary='サービス一覧' /></ListItem>}
            {admin > 2 && <ListItem dense button component={Link} to='/queries'><ListItemIcon><DashboardIcon /></ListItemIcon><ListItemText primary='質問マスター' /></ListItem>}
            {admin > 2 && <ListItem dense button component={Link} to='/proQuestions'><ListItemIcon><ViewCompactIcon /></ListItemIcon><ListItemText primary='プロ向け質問' /></ListItem>}
            {admin > 2 && <ListItem dense button component={Link} to='/locations'><ListItemIcon><ActionRoomIcon /></ListItemIcon><ListItemText primary='地点管理ツール' /></ListItem>}
            {admin > 9 && <ListItem dense button component={Link} to='/licences'><ListItemIcon><LicenseIcon /></ListItemIcon><ListItemText primary='資格・免許管理' /></ListItem>}
            {admin > 1 && <ListItem dense button component={Link} to='/formattedRequests'><ListItemIcon><ActionAssignmentIcon /></ListItemIcon><ListItemText primary='掲載用の依頼' /></ListItem>}
            {admin > 1 && <ListItem dense button component={Link} to='/keywords'><ListItemIcon><SearchIcon /></ListItemIcon><ListItemText primary='検索ワード設定' /></ListItem>}
          </Collapse>
          <ListItem dense button onClick={() => this.handleClick('proOpen')}>
            <ListItemText primary='プロ関連' />
            {this.state.proOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={!!this.state.proOpen} timeout='auto'>
            {admin > 2 && <ListItem dense button component={Link} to='/proLabel'><ListItemIcon><ProLabelIcon /></ListItemIcon><ListItemText primary='プロの特長設定' /></ListItem>}
            {admin > 2 && <ListItem dense button component={Link} to='/meetTemplates'><ListItemIcon><NoteIcon /></ListItemIcon><ListItemText primary='応募テンプレ' /></ListItem>}
            {admin > 1 && <ListItem dense button component={Link} to='/leads'><ListItemIcon><SocialPeopleIcon /></ListItemIcon><ListItemText primary='見込み顧客管理' /></ListItem>}
            {admin > 1 && <ListItem dense button component={Link} to='/crawls'><ListItemIcon><WebIcon /></ListItemIcon><ListItemText primary='スクレイピング' /></ListItem>}
            {admin > 1 && <ListItem dense button component={Link} to='/scraping'><ListItemIcon><CloudDownloadIcon /></ListItemIcon><ListItemText primary='iタウンページ' /></ListItem>}
          </Collapse>
          <Divider />
          {process.env.TARGET_ENV !== 'production' && admin > 1 && <ListItem dense button component={Link} to='/searchKeywordCategory'><ListItemIcon><TrendingUpIcon /></ListItemIcon><ListItemText primary='キーワード順位' /></ListItem>}
          {admin > 1 && <ListItem dense button component={Link} to='/csTask'><ListItemIcon><CSIcon /></ListItemIcon><ListItemText primary='CSタスク' /></ListItem>}
          {admin > 9 && <ListItem dense button component={Link} to='/experiments'><ListItemIcon><CallSplitIcon /></ListItemIcon><ListItemText primary='ABテスト' /></ListItem>}
          {admin > 9 && <ListItem dense button component={Link} to='/runtimeConfigs'><ListItemIcon><CallSplitIcon /></ListItemIcon><ListItemText primary='Runtime Configs' /></ListItem>}
          {admin > 9 && <ListItem dense button component={Link} to='/admin'><ListItemIcon><ActionAccountCircleIcon /></ListItemIcon><ListItemText primary='tools管理' /></ListItem>}
        </List>
      </div>
    )
  }

  render() {
    const { children, width, location, theme, snack } = this.props
    const { common } = theme.palette

    const styles = {
      root: {
        height: '100%',
      },
      content: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        bottom: 0,
        overflowX: 'hidden',
      },
      ribbon: {
        position: 'fixed',
        top: 20,
        left: 20,
        width: 500,
        padding: 2,
        margin: '-12px 0 0 -250px',
        fontSize: 12,
        textAlign: 'center',
        color: common.white,
        background: purple[700],
        transform: 'rotate(-45deg)',
        zIndex: 2000,
      },
    }

    const title = location.pathname === '/services' ? 'サービス一覧' :
      location.pathname === '/queries' ? '質問マスター' :
      /^\/services\/[^\/]+$/.test(location.pathname) ? 'サービス詳細' :
      ''

    let { navOpen } = this.state
    let type = 'temporary'

    if (width === 'md' || width === 'lg' || width === 'xl') {
      navOpen = true
      type = 'permanent'
      styles.content.left = menuWidth
    }

    return (
      <div style={styles.root}>
        <AppBar position='static' color='primary' style={{height: 50}}>
          <Toolbar style={{minHeight: 'auto'}}>
            <IconButton color='inherit' onClick={() => this.setState({ navOpen: true })}>
              <MenuIcon />
            </IconButton>
            <div style={{flex: 1}}>{title}</div>
            <Button color='inherit' onClick={this.props.logout}>ログアウト</Button>
          </Toolbar>
        </AppBar>
        <Drawer variant={type} open={!!navOpen} onClose={() => this.setState({ navOpen: false })}>
          {this.getNav()}
        </Drawer>
        <div style={styles.content}>
          {children}
        </div>
        {process.env.TARGET_ENV !== 'production' &&
          <div style={styles.ribbon}><div style={{padding: 3, border: `1px dashed ${purple[200]}`}}>開発環境</div></div>
        }
        <Dialer />
        <Snackbar
          open={snack.open}
          message={snack.message}
          onClose={() => this.props.closeSnack()}
          anchorOrigin={snack.option.anchor}
          autoHideDuration={snack.option.duration || 3000}
          action={snack.option.action}
        />
      </div>
    )
  }
}
