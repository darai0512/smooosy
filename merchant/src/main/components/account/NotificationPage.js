import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import Notification from 'components/account/Notification'

@withWidth()
@withTheme
export default class NotificationPage extends React.Component {
  render() {
    const { width, theme } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }


    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Button component={Link} to='/account' style={{minWidth: 40}}>
                  <NavigationChevronLeft />
                </Button>
              }
            </div>
            <div>通知設定</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>通知設定</title>
        </Helmet>
        <Notification history={this.props.history} type={this.props.type} />
      </AutohideHeaderContainer>
    )
  }
}
