import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withStyles } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import PointCampaign from 'components/PointCampaign'

import { open as openSnack } from 'modules/snack'

@withWidth()
@withStyles(theme => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 50,
    padding: '0 20px',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: '0 10px',
    },
  },
  main: {
    padding: '20px 0',
    width: '70vw',
    maxWidth: 800,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      maxWidth: 'initial',
    },
  },
}))
@connect(null, { openSnack })
export default class TaskListPage extends React.Component {

  scrollTo = (ref) => {
    if (!ref) return
    this.container.scrollTop = ref.offsetTop - 70 // header 分ずらす
  }

  onError = (err) => {
    this.props.openSnack((err.data && err.data.message) || '想定外のエラーが発生しました。')
  }

  render() {
    const { location, classes, width } = this.props
    const anchor = location ? location.hash.slice(1) : null

    return (
      <AutohideHeaderContainer
        style={{height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}
        setRef={e => this.container = e}
        header={
          <div className={classes.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
                </Link>
              }
            </div>
            <div>タスクリスト</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>タスクリスト</title>
        </Helmet>
        <div className={classes.main}>
          <PointCampaign showProgress scrollTo={this.scrollTo} anchor={anchor} onError={this.onError} />
        </div>
      </AutohideHeaderContainer>
    )
  }
}
