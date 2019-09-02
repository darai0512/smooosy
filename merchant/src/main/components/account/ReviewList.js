import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { withTheme, withWidth } from '@material-ui/core'
import { Button } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import { loadForReview as loadProfile, updateReview } from 'modules/profile'

import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import BadgeDialog from 'components/BadgeDialog'
import Pagination from 'components/Pagination'
import ReviewForPro from 'components/ReviewForPro'
import ReviewRequest from 'components/account/ReviewRequest'
import ReviewStat from 'components/ReviewStat'

const reviewsPerPage = 10

@connect(
  state => ({
    profile: state.profile.profile,
  }),
  { updateReview, loadProfile }
)
@withWidth()
@withTheme
export default class ReviewList extends React.Component {
  state = {
    page: 1,
    current: [],
  }

  componentDidMount() {
    this.props.loadProfile(this.props.match.params.id)
      .then(() => this.load(1))
  }

  updateReview = values => {
    return this.props.updateReview(values)
      .then(() => this.props.loadProfile(this.props.match.params.id))
      .then(() => this.load(this.state.page))
  }

  load = page => {
    const current = this.props.profile.reviews.slice((page - 1) * reviewsPerPage, page * reviewsPerPage)
    this.setState({page, current})
  }

  render() {
    const { theme, width, profile } = this.props
    const { grey, common } = theme.palette
    const { current, page } = this.state

    if (!profile) return null

    const styles = {
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        margin: '20px auto',
        maxWidth: width === 'xs' ? 'initial': 700,
      },
      paper: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
        marginBottom: 40,
      },
      readmore: {
        cursor: 'pointer',
        margin: 10,
        textAlign: 'center',
        fontSize: 12,
        color: grey[700],
      },
      reviews: {
        padding: 20,
        borderBottom: `1px solid ${grey[200]}`,
      },
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Button component={Link} to='/account'>
                  <NavigationChevronLeft />
                </Button>
              }
            </div>
            <div>クチコミ</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <div style={styles.main}>
          <ReviewRequest profile={profile} />
          <div style={{display: 'flex', alignItems: 'center'}}>
            <h3 style={{flex: 1, padding: 10}}>クチコミ({profile.reviews.length})</h3>
            {width !== 'xs' &&
              <Button style={{margin: 5}} onClick={() => this.setState({badge: true})} color='primary'>あなたのホームページに評価を掲載できます</Button>
            }
          </div>
          <div style={styles.paper}>
            <div style={{padding: 20, borderBottom: `1px solid ${grey[200]}`}}>
              <ReviewStat averageRating={profile.averageRating} reviews={profile.reviews} />
            </div>
            <div style={styles.reviews}>
              {profile.reviews.length ?
                current.map(r =>
                  <div key={r.id} style={{marginBottom: 20}}>
                    <ReviewForPro review={r} onReply={this.updateReview} />
                  </div>
                )
              :
                'クチコミはまだありません'
              }
              {profile.reviews.length > 0 &&
                <Pagination
                  total={profile.reviews.length}
                  current={page}
                  perpage={reviewsPerPage}
                  onChange={page => this.load(page)}
                />
              }
            </div>
          </div>
          <BadgeDialog key='badge' open={this.state.badge} onClose={() => this.setState({badge: false})} profile={profile} />
        </div>
      </AutohideHeaderContainer>
    )
  }
}
