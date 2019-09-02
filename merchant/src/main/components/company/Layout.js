import React from 'react'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router'
import { List, MenuItem, Button, Collapse, Tabs, Tab } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import CloseIcon from '@material-ui/icons/Close'
import Dehaze from '@material-ui/icons/Dehaze'

import DevelopmentRibbon from 'components/DevelopmentRibbon'

@withStyles(theme => ({
  header: {
    zIndex: 1000,
    width: '100%',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    position: 'fixed',
    top: 0,
  },
  logo: {
    marginTop: 0,
    marginLeft: 10,
    height: 40,
    width: 160,
  },
  menuIcon: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
      width: 60,
      height: 60,
    },
  },
  menuLabel: {
    minWidth: 120,
    height: 59,
    fontSize: 16,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  menuMobile: {
    display: 'block',
    textAlign: 'right',
  },
  collapseContainer: {
    background: theme.palette.common.white,
    position: 'fixed',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  collapseWrapper: {
    height: 'calc(100vh - 60px)',
  },
}))
@withRouter
export class HeaderCommon extends React.Component {
  menu = [
    { text: 'ニュース', path: '/company/news' },
    { text: 'ミッション', path: '/company#mission' },
    { text: '経営チーム', path: '/company#managers' },
    { text: '採用情報', path: '/company/recruit' },
    { text: '会社概要', path: '/company#about' },
  ]

  constructor(props) {
    super(props)
    this.state = {
      openMenu: false,
    }
  }

  toggleMenu = () => {
    this.setState({
      openMenu: !this.state.openMenu,
    })
  }

  handleMenu = (e, path) => {
    e.preventDefault()
    this.setState({openMenu: false})
    if (path) this.props.history.push(path)
  }

  render() {
    const { children, classes } = this.props
    const tabValue = this.props.location.pathname + this.props.location.hash

    return (
      <div className={classes.header}>
        <div onClick={e => this.handleMenu(e, '/company')}>
          <img layout='fixed' alt='SMOOOSYロゴ' src='/images/logo.png' className={classes.logo} height='40' width='160' />
        </div>
        <div style={{flex: 1}} />
        <Button className={classes.menuIcon} onClick={this.toggleMenu}>
          {this.state.openMenu ? <CloseIcon /> : <Dehaze />}
        </Button>
        <Tabs
          value={tabValue}
          className={classes.menu}
          indicatorColor='secondary'
          onChange={this.handleMenu}
        >
          {this.menu.map((link, i) =>
            <Tab key={`link_${i}`} className={classes.menuLabel} label={link.text} value={link.path} />
          )}
          {children}
        </Tabs>
        <Collapse
          in={!!this.state.openMenu}
          classes={{container: classes.collapseContainer, wrapper: classes.collapseWrapper}}
        >
          <List>
            {this.menu.map((link, i) =>
              <MenuItem className={classes.menuMobile} key={`link_${i}`} onClick={e => this.handleMenu(e, link.path)}>
                {link.text}
              </MenuItem>
            )}
          </List>
        </Collapse>
      </div>
    )
  }
}

const Header = props => (
  <HeaderCommon {...props} />
)

@withStyles({
  content: {
    marginTop: 60,
    position: 'relative',
    height: '100%',
  },
})
export default class Layout extends React.Component {
  render() {
    const { classes, children, ...rest } = this.props

    return (
      <>
        <Helmet titleTemplate='%s - SMOOOSY' />
        <div>
          <Header {...rest} />
        </div>
        <div className={classes.content}>
          {children}
        </div>
        {process.env.TARGET_ENV !== 'production' &&
          <DevelopmentRibbon />
        }
      </>
    )
  }
}
