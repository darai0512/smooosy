import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, List, ListItem, ListItemText, ListItemAvatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import LeftIcon from '@material-ui/icons/ChevronLeft'

import { withApiClient } from 'contexts/apiClient'
import { loadReceived } from 'modules/thank'
import Loading from 'components/Loading'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import UserAvatar from 'components/UserAvatar'
import ThanksButton from 'components/ThanksButton'
import Pagination from 'components/Pagination'
import { shortTimeString } from 'lib/date'

@withApiClient
@withWidth()
@withStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
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
    width: '80%',
    maxWidth: 600,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      maxWidth: 'initial',
    },
  },
  list: {
    marginBottom: 10,
    padding: 0,
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    background: theme.palette.common.white,
    [theme.breakpoints.down('xs')]: {
      borderWidth: '1px 0 0',
    },
  },
}))
@connect(
  state => ({
    received: state.thank.received,
    total: state.thank.total,
  }),
  { loadReceived }
)
export default class ThanksPage extends React.Component {
  state = {
    page: 1,
  }

  componentDidMount() {
    this.load(1)
  }

  load = page => {
    page = page || 1
    this.props.loadReceived(page).then(() => this.setState({page}))
  }

  render() {
    const { received, total, classes, width } = this.props
    const { page } = this.state

    if (!received) return <Loading />

    return (
      <AutohideHeaderContainer
        style={{height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}
        header={
          <div className={classes.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><LeftIcon /></Button>
                </Link>
              }
            </div>
            <div>貰ったありがとう ({total || 0})</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <div className={classes.main}>
          <List className={classes.list}>
            {received.map((t, i) =>
              <ListItem key={i} divider>
                <ListItemAvatar>
                  <UserAvatar user={t.from} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${t.from.lastname}様からのありがとう`}
                  secondary={shortTimeString(new Date(t.createdAt))}
                />
                <ThanksButton user={t.from} />
              </ListItem>
            )}
            {received.length === 0 &&
              <ListItem divider>まだありません</ListItem>
            }
          </List>
          {received.length > 0 &&
            <Pagination
              total={total}
              current={page}
              perpage={20}
              onChange={page => this.load(page)}
            />
          }
        </div>
      </AutohideHeaderContainer>
    )
  }
}
