import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { Menu, IconButton, MenuItem } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import NavigationMoreVert from '@material-ui/icons/MoreVert'

@withWidth()
@withTheme
export default class Layout extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      anchorEl: null,
      open: false,
    }
  }

  render() {
    const { children, width, theme, history } = this.props

    const { common, grey, secondary } = theme.palette

    const styles = {
      root: {
        height: '100%',
      },
      header: {
        position: 'fixed',
        zIndex: 1000,
        top: 0,
        width: '100%',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      content: {
        paddingTop: 60,
        position: 'relative',
        height: '100%',
      },
      logo: {
        height: 40,
        cursor: 'pointer',
        marginLeft: 12,
      },
    }

    const links = [
      {label: 'プロガイドトップ', value: '/pro-center'},
      {label: 'プロダッシュボード', value: '/pros'},
    ]

    return (
      <div style={styles.root}>
        <Helmet defaultTitle='SMOOOSY' titleTemplate='%s - SMOOOSY' />
        <div style={styles.header}>
          <div style={{flex: 1}}>
            <img alt='SMOOOSYロゴ' src='/images/logo.png' style={styles.logo} onClick={() => history.push('/')} />
          </div>
          <div style={{fontWeight: 'bold', color: secondary.main}}>プロガイド</div>
          <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
            {width === 'xs' ?
              <div>
                <IconButton
                  onClick={(e) => this.setState({ open: true, anchorEl: e.currentTarget })}
                >
                  <NavigationMoreVert />
                </IconButton>
                <Menu
                  anchorEl={this.state.anchorEl}
                  open={this.state.open}
                  onClose={() => this.setState({ open: false })}
                >
                  {links.map(e => <MenuItem
                    key={'tab_' + e.value}
                    onClick={() => {
                      history.push(e.value)
                      this.setState({ open: false })
                    }}>{e.label}</MenuItem>)}
                </Menu>
              </div>
              :
              links.map(e => <Link key={e.value} style={{margin: 10, fontSize: 13}} to={e.value}>{e.label}</Link>)
            }
          </div>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    )
  }
}
