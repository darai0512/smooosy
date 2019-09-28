import React, { useState } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { Menu, MenuItem, Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'

import { load as loadUser } from 'modules/auth'
import { HeaderCommon } from 'components/Header'
import NoticeList from 'components/NoticeList'
import UserAvatar from 'components/UserAvatar'
import EmailModal from 'components/EmailModal'


function LoggedInHeader(props) {
  const { user, fixedHeight, hasSearch, width, classes } = props
  const [ menuAnchor, setMenuAnchor ] = useState(null)

  const handleMenu = (e, path) => {
    e.preventDefault()
    setMenuAnchor(null)
    if (path) props.history.push(path)
  }

  const pathname = props.location.pathname
  const topPage = pathname === '/'
  const autoProMode = pathname === '/' || /\/account/.test(pathname)
  const proMode = autoProMode ? user.pro : props.proMode
  const transparent = !topPage && props.transparent

  const avatarClass = [ classes.avatar ]
  if (proMode || transparent) {
    avatarClass.push(classes.whiteText)
  }

  let leftMenu, rightMenu, iconMenu
  if (proMode) {
    leftMenu = [
      { text: '新規募集', path: '/pros/new-requests' },
      { text: '募集履歴', path: '/pros/waiting' },
      { text: 'ダッシュボード', path: '/pros' },
    ]
    rightMenu = []
    iconMenu = [
      { text: 'アカウント設定', path: '/account' },
      { text: '依頼者に切り替え', path: '/requests', arrow: true },
      { text: 'ログアウト', path: '/logout' },
    ]
  } else {
    leftMenu = []
    rightMenu = [
      { text: '依頼一覧', path: '/requests' },
    ]
    iconMenu = [
      { text: 'アカウント設定', path: '/account' },
      { text: 'ログアウト', path: '/logout' },
    ]
    if (user.pro) iconMenu.splice(1, 0, { text: '事業者に切り替え', path: '/pros', arrow: true })
  }

  if (width === 'xs') {
    if (proMode && user.pro) {
      iconMenu = [
        ...leftMenu,
        { divider: true },
        { text: 'プロフィール', path: '/account/profiles' },
        { text: 'スケジュール', path: '/pros/schedules' },
        { text: 'SMOOOSYポイント', path: '/account/points' },
        { text: 'クチコミ', path: '/account/reviews' },
        { divider: true },
        ...rightMenu,
        ...iconMenu,
      ]
    } else {
      iconMenu = [
        ...leftMenu,
        ...rightMenu,
        { divider: true },
        ...iconMenu,
      ]
    }
    leftMenu = []
    rightMenu = []
  }

  return (
    <HeaderCommon
      leftMenu={leftMenu}
      rightMenu={rightMenu}
      iconMenu={iconMenu}
      fixedHeight={fixedHeight}
      transparent={transparent}
      proMode={proMode}
      hasSearch={hasSearch}
    >
      <NoticeList reverseColor={proMode || transparent} rootClass={classes.notice} />
      {width !== 'xs' &&
        <Button className={avatarClass.join(' ')} onClick={e => setMenuAnchor(e.currentTarget)}>
          <UserAvatar user={user} />
          <ArrowDownIcon />
        </Button>
      }
      <Menu
        open={!!menuAnchor}
        anchorEl={menuAnchor}
        getContentAnchorEl={null}
        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
        transformOrigin={{horizontal: 'right', vertical: 'top'}}
        onClose={() => setMenuAnchor(null)}
      >
        {iconMenu.map((link, i) =>
          <MenuItem key={`link_${i}`} onClick={e => handleMenu(e, link.path)}>
            {link.text}
            {link.arrow && <ArrowRightIcon />}
          </MenuItem>
        )}
      </Menu>
      <EmailModal />
    </HeaderCommon>
  )
}

export default compose(
  withWidth(),
  withStyles(theme => ({
    avatar: {
      width: 'auto',
      marginRight: 10,
      padding: 0,
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    notice: {
      marginRight: 10,
      flexShrink: 0,
    },
    whiteText: {
      color: theme.palette.common.white,
    },
    hideMobile: {
      [theme.breakpoints.down('xs')]: {
        display: 'none',
      },
    },
  })),
  connect(
    state => ({
      user: state.auth.user,
    }),
    { loadUser }
  )
)(LoggedInHeader)
