import React from 'react'
import { Link } from 'react-router-dom'
import { List, ListItem, ListItemText } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import FeedbackForm from 'tools/components/stats/FeedbackForm'
import CustomChip from 'components/CustomChip'
import { relativeTime } from 'lib/date'

@withApiClient
@withStyles(theme => ({
  list: {
    padding: 0,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  status: {
    color: theme.palette.grey[500],
    fontSize: 12,
  },
}))
export default class FeedbackTab extends React.Component {
  state = {}

  constructor(props) {
    super(props)
    this.loadFeedbacks()
  }

  loadFeedbacks = options => {
    const force = options && options.force
    if (!force && this.state.feedbacks) return
    this.props.apiClient.get(`/api/admin/feedbacks?pro=${this.props.profile.pro.id}`)
      .then(res => res.data)
      .then(feedbacks => this.setState({feedbacks}))
  }

  render() {
    const { profile, classes } = this.props
    const { feedbacks } = this.state

    return (
      <div>
        <FeedbackForm profile={profile} style={{padding: 20}} didSubmit={() => this.loadFeedbacks({force: true})} />
        <List className={classes.list}>
          {feedbacks ? feedbacks.map(f =>
            <ListItem divider key={f.id}>
              <ListItemText
                primary={
                  <div>
                    <div style={{display: 'flex'}}>
                      <CustomChip label={f.type} />
                      {f.request ?
                        <Link to={`/stats/requests/${f.request}`}>{f.service.name}の依頼 by {f.customer.lastname}</Link>
                      :
                        <p>{f.service.name}への意見</p>
                      }
                      <div style={{flex: 1}} />
                      <div>{relativeTime(new Date(f.createdAt))}</div>
                    </div>
                    <div style={{fontSize: 13}}>{f.text}</div>
                    <div className={classes.status}>{f.resolved ? '解決済み' : '未解決'}</div>
                  </div>
                }
              />
            </ListItem>
          )
          : <div>意見はまだありません</div>}
        </List>
      </div>
    )
  }
}
