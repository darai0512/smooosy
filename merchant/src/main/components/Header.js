import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import { List, MenuItem, Button, Collapse, Divider, NoSsr } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import GlobalSearch from 'components/GlobalSearch'

@withStyles(theme => ({
  header: {
    zIndex: 1000,
    width: '100%',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  headerTransparent: {
    position: 'absolute',
    background: 'transparent',
    borderBottom: 'none',
  },
  headerFixed: {
    position: 'fixed',
    top: 0,
  },
  headerPro: {
    background: theme.palette.grey[700],
    borderBottom: `1px solid ${theme.palette.grey[700]}`,
  },
  logo: {
    marginTop: 0,
    marginLeft: 10,
    height: 80,
    width: 80,
  },
  logoType: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      height: 50,
      width: 150,
      position: 'absolute',
      left: 'calc(50% - 75px)',
      display: 'block',
    },
  },
  logoTransparent: {
    marginTop: 20,
    height: 70,
    width: 280,
    [theme.breakpoints.down('xs')]: {
      marginTop: 0,
      height: 80,
      width: 80,
    },
  },
  menuIcon: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
      flexShrink: 0,
    },
  },
  button: {
    marginRight: 10,
    minWidth: 70,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  logoIcon: {
    width: 40,
    height: 40,
  },
  menu: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
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
  transparentContainer: {
    top: 0,
  },
  collapseWrapper: {
    height: 'calc(100vh - 60px)',
  },
  transparentWrapper: {
    height: '100vh',
  },
  hide: {
    display: 'none',
  },
  hideMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  whiteText: {
    color: theme.palette.common.white,
  },
  search: {
    flex: 1,
    height: 40,
    marginRight: 10,
  },
}))
@withRouter
export class HeaderCommon extends React.Component {
  static defaultProps = {
    leftMenu: [],
    rightMenu: [],
  }

  constructor(props) {
    super(props)
    this.state = {
      openMenu: false,
    }
  }

  toggleMenu = () => {
    if (this.state.openMenu) {
      this.setState({
        openMenu: false,
      })
      document.body.style.position = ''
    } else {
      this.setState({
        openMenu: true,
      })
    }
  }

  handleMenu = (e, path) => {
    e.preventDefault()
    this.setState({openMenu: false})
    document.body.style.position = ''
    if (path) this.props.history.push(path)
  }

  render() {
    const { hasSearch, leftMenu, rightMenu, transparent, hideMenu, centerLogo, proMode, fixedHeight, children, classes } = this.props
    const iconMenu = this.props.iconMenu || [ ...leftMenu, ...rightMenu ]

    const headerClass = [ classes.header ]
    const logoClass = [ classes.logo ]
    const menuClass = [ classes.menu ]
    const buttonClass = [ classes.button ]
    const menuIconClass = [ classes.menuIcon ]
    const containerClass = [ classes.collapseContainer ]
    const wrapperClass = [ classes.collapseWrapper ]
    if (transparent) {
      headerClass.push(classes.headerTransparent)
      logoClass.push(classes.logoTransparent)
      buttonClass.push(classes.whiteText)
      menuIconClass.push(classes.whiteText)
      containerClass.push(classes.transparentContainer)
      wrapperClass.push(classes.transparentWrapper)
    } else if (proMode) {
      headerClass.push(classes.headerPro)
      buttonClass.push(classes.whiteText)
      menuIconClass.push(classes.whiteText)
    }
    if (hideMenu) {
      menuClass.push(classes.hide)
      menuIconClass.push(classes.hide)
    } else {
      logoClass.push(classes.hideMobile)
    }
    if (fixedHeight) {
      headerClass.push(classes.headerFixed)
    }

    return (
      <div className={headerClass.join(' ')}>
        <Link to='/'>
          <img layout='fixed' alt='SMOOOSYロゴ' src='/images/smooosy.png' className={logoClass.join(' ')} height='40' width='40' />
        </Link>
        <Button className={menuIconClass.join(' ')} onClick={this.toggleMenu}>
          <img layout='fixed' alt='SMOOOSYアイコン' src='/images/logo-icon.png' className={classes.logoIcon} height='40' width='40' />
          <ArrowDownIcon />
        </Button>
        {centerLogo && <img layout='fixed' alt='SMOOOSYロゴ' src='/images/logo-type.png' className={classes.logoType} height='40' width='120' />}
        <div className={menuClass.join(' ')}>
          {leftMenu.map((link, i) =>
            <Button key={`link_${i}`} className={buttonClass.join(' ')} component={Link} to={link.path}>{link.text}</Button>
          )}
          <div className={classes.search}>
            <GlobalSearch hide={!hasSearch} />
          </div>
          {rightMenu.map((link, i) =>
            <NoSsr key={`link_${i}`}>
              <Button className={buttonClass.join(' ')} component={Link} to={link.path}>{link.text}</Button>
            </NoSsr>
          )}
          {children}
        </div>
        <Collapse
          in={!!this.state.openMenu}
          classes={{container: containerClass.join(' '), wrapper: wrapperClass.join(' ')}}
          onEntered={() => document.body.style.position = 'fixed'}
        >
          {transparent &&
            <div className={classes.header}>
              <Button className={classes.menuIcon} onClick={this.toggleMenu}>
                <img layout='fixed' alt='SMOOOSYアイコン' src='/images/logo-icon.png' className={classes.logoIcon} height='40' width='40' />
                <ArrowDownIcon />
              </Button>
            </div>
          }
          <List>
            <MenuItem onClick={e => this.handleMenu(e, '/')}>トップ</MenuItem>
            {iconMenu.map((link, i) =>
              link.divider ?
              <Divider key={`divider_${i}`} />
              :
              <MenuItem key={`link_${i}`} onClick={e => this.handleMenu(e, link.path)}>
                {link.text}
                {link.arrow && <ArrowRightIcon />}
              </MenuItem>
            )}
          </List>
        </Collapse>
      </div>
    )
  }
}


const menu = [
  { text: '事業者の方はこちら', path: '/pro' },
]

const Header = props => (
  <HeaderCommon rightMenu={menu} {...props} />
)

export default Header
