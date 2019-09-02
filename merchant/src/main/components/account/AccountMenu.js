import React from 'react'
import { connect } from 'react-redux'
import { List, MenuItem, ListItemText, ListSubheader, Divider } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
  }),
  {}
)
@withTheme
export default class AccountMenu extends React.Component {
  render() {
    const { user, children, width, location, history, theme } = this.props
    const { grey } = theme.palette

    const isExact = location.pathname === '/account'

    const styles = {
      root: {
        height: '100%',
        width: '100%',
        display: 'flex',
        paddingTop: 60,
      },
      menu: {
        height: '100%',
        width: width === 'xs' ? '100%' : 220,
        display: width === 'xs' && !isExact ? 'none' : 'block',
        background: grey[50],
        borderRight: width === 'xs' ? 'none' : `1px solid ${grey[300]}`,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      content: {
        height: '100%',
        flex: 1,
        display: width === 'xs' && isExact ? 'none' : 'block',
      },
    }

    const m = history.location.pathname.match(/^\/account\/([a-z]+)/)
    const value = m ? m[1] : ''

    const commonMenus = [
      { value: 'info', label: '基本情報', link: '/account/info' },
      { value: 'notification', label: '通知設定', link: '/account/notification' },
      { value: 'password', label: 'パスワード変更', link: '/account/password' },
      { value: 'thanks', label: '貰ったありがとう', link: '/account/thanks' },
    ]

    if (!user.email) commonMenus.splice(2, 1) // パスワード変更を消す

    const proMenus = [
      { value: 'services', label: 'サービス一覧', link: '/account/services' },
      { value: 'profiles', label: '事業者プロフィール', link: '/account/profiles' },
      { value: 'reviews', label: 'クチコミ', link: '/account/reviews' },
      { value: 'templates', label: '返信定型文', link: '/account/templates' },
      { value: 'tasks', label: 'タスクリスト', link: '/account/tasks' },
      { value: 'points', label: 'SMOOOSYポイント', link: '/account/points' },
      { value: 'referrals', label: 'プロを紹介', link: '/account/referrals' },
      { value: 'media', label: '写真管理', link: '/account/media' },
      { value: 'insights', label: '統計情報', link: '/account/insights' },
    ]

    return (
      <div style={styles.root}>
        <div style={styles.menu}>
          <List subheader={<ListSubheader disableSticky={true}>アカウント設定</ListSubheader>}>
            {commonMenus.map((menu, i) =>
              <MenuItem key={i} selected={menu.value === value} onClick={() => history.push(menu.link)}>
                <ListItemText primary={menu.label} />
              </MenuItem>
            )}
          </List>
          {user.pro && <Divider />}
          {user.pro &&
            <List subheader={<ListSubheader disableSticky={true}>事業者向け設定</ListSubheader>}>
              {proMenus.map((menu, i) =>
                <MenuItem key={i} selected={menu.value === value} onClick={() => history.push(menu.link)}>
                  <ListItemText primary={menu.label} />
                </MenuItem>
              )}
            </List>
          }
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    )
  }
}
