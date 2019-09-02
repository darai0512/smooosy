import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Typography, Button } from '@material-ui/core'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withStyles } from '@material-ui/core/styles'

import { BQEventTypes } from '@smooosy/config'

import { loadAll as loadProfiles } from 'modules/profile'
import { loadAllForPro as loadRequestsForPro } from 'modules/request'
import { sendLog } from 'modules/auth'

import Container from 'components/Container'
import Footer from 'components/Footer'
import Loading from 'components/Loading'
import UserAvatar from 'components/UserAvatar'
import RequestCard from 'components/pros/RequestCard'
import ProOnBoarding from 'components/pros/ProOnBoarding'
import StarterGuide from 'components/pros/StarterGuide'
import TaskBar from 'components/pros/TaskBar'
import CampaignBanner from 'components/pros/CampaignBanner'
import RequestFilters from 'components/pros/RequestFilters'

import { sortWithMatchMoreAndIsExactMatch, requestMatchesFilters } from 'lib/request'
import { getBoolValue } from 'lib/runtimeConfig'

import qs from 'qs'

@withWidth({withTheme: true})
@connect(
  state => ({
    profiles: state.profile.profiles,
    requests: state.request.requestsForPro,
    showRequestFilters: getBoolValue(
      'showRequestFilters',
      state.runtimeConfig.runtimeConfigs
    ),
  }),
  { loadProfiles, loadRequestsForPro, sendLog },
)
export default class RequestList extends React.Component {

  state = {
    mode: 'normal',
    openDetailWaitDialog: false,
    profileId: null,
    // のちのちユーザーが依頼の並び順を変えられるようにする
    // 新しい順, 期限が近い順, 見積もりが少ない順 etc
    sortFunction: sortWithMatchMoreAndIsExactMatch,
  }

  componentDidMount() {
    const { mode, profileId } = qs.parse(location.search, {ignoreQueryPrefix: true})
    this.setState({
      mode: mode || 'normal',
      profileId: profileId,
    })

    this.props.loadProfiles()
    this.props.loadRequestsForPro()
  }

  openSetupDialog = profile => {
    this.setState({
      openDetailWaitDialog: true,
      waitProfile: profile,
    })
  }

  onPass = () => {
    this.props.loadRequestsForPro()
  }

  closeDetailWaitDialog = () => {
    this.setState({openDetailWaitDialog: false})
  }

  onFilterChange = (filters, haveFilters, filterChanged, isIntermediateChange) => {
    this.setState({ filters })

    // don't do tracking for intermediate filter changes
    if (isIntermediateChange) {
      return
    }

    if (haveFilters) {
      this.props.sendLog(BQEventTypes.web.FILTER_APPLY, {
        ...filters,
        filterChanged,
      })
    } else {
      this.props.sendLog(BQEventTypes.web.FILTER_CLEAR)
    }
  }

  render() {
    const { profiles, width, showRequestFilters } = this.props
    const { mode, openDetailWaitDialog, waitProfile, profileId } = this.state

    let { requests } = this.props

    const styles = {
      wrap: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: 900,
        margin: '0 auto',
        minHeight: '80vh',
      },
      sidebar: {
        width: 250,
      },
      content: {
        flex: 1,
      },
      cards: {
        margin: width === 'xs' ? '0 10px' : 0,
      },
      noRequests: {
        width: '100%',
        textAlign: 'center',
        justifyContent: 'center',
        padding: '50px 0',
      },
      button: {
        fontWeight: 'bold',
        width: '100%',
        marginTop: width === 'xs' ? 3 : 6,
        textAlign: 'left',
        justifyContent: 'left',
      },
      formControl: {
        margin: 5,
        minWidth: 120,
        maxWidth: 500,
      },
    }

    const signupMode = mode === 'signup'
    const setupProfileId = profileId || (profiles.length === 1 && !profiles[0].description ? profiles[0].id : null)

    let serviceMap = {}

    if (requests && requests.length) {
      requests.forEach(r => {
        const service = serviceMap[r.service._id]

        if (!service) {
          serviceMap[r.service._id] = {
            _id: r.service._id,
            name: r.service.name,
            requestCount: 0,
          }
        }

        serviceMap[r.service._id].requestCount += 1
      })

      requests = requests.filter(r => {
        return requestMatchesFilters(r, this.state.filters)
      })
      requests.sort((a, b) => {
        return this.state.sortFunction(a, b, this.state.filters)
      })
    }

    const hasDistanceFilter = this.state.filters && !!this.state.filters.distance

    return (
      <>
        <Helmet>
          <title>新規案件一覧</title>
        </Helmet>
        <div>
          <Container>
            <div style={styles.wrap}>
              <CampaignBanner />
              {!signupMode && <div style={styles.cards}><TaskBar /></div>}
              {!signupMode && <div style={styles.cards}><StarterGuide /></div>}
              <Typography variant='h6' style={{display: 'flex', alignItems: 'center', margin: '30px 10px 10px'}}>新規案件一覧</Typography>
              <div style={{display: 'flex', flexDirection: 'row'}}>
                <div style={styles.content}>
                  {showRequestFilters && <RequestFilters
                    serviceMap={serviceMap}
                    onChange={this.onFilterChange}
                  />}
                  <div style={styles.cards}>
                    {requests === undefined ? <Loading /> : requests.length === 0 ?
                    <div style={styles.noRequests}>
                      {setupProfileId ?
                      <div>
                        <div style={{margin: 10}}>
                          <div>まずはプロフィールを充実させましょう。</div>
                        </div>
                        <Button className='goToSetup' style={{margin: 10}} variant='contained' color='primary' component={Link} to={`/setup/${setupProfileId}/0`}>
                          プロフィール入力へ
                        </Button>
                      </div>
                      :
                      <div>
                        <div style={{margin: 10}}>新規の案件はありません</div>
                        <div style={{margin: 10}}>
                          <div>対応サービスを見直して案件を受け取りましょう。</div>
                          <div>選択したサービスの案件のみが届きます。</div>
                        </div>
                        <Button style={{margin: 10}} variant='contained' color='primary' component={Link} to='/account/services'>
                          サービス一覧から受け取り条件を編集
                        </Button>
                      </div>}
                    </div>
                    :
                    requests.map((r, idx) => (
                      <RequestCard
                        key={r._id}
                        requestForPro={r}
                        profile={profiles.find(p => r.sent.includes(p.id))}
                        openSetupDialog={this.openSetupDialog}
                        onPass={this.onPass}
                        withBalloon={idx === 0}
                        showDistance={hasDistanceFilter}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DetailWaitDialog profile={waitProfile} open={openDetailWaitDialog} onClose={this.closeDetailWaitDialog} />
              {!signupMode && <ProOnBoarding />}
            </div>
          </Container>
          <Footer />
        </div>
      </>
    )
  }
}


@withStyles(theme => ({
  root: {
    textAlign: 'center',
  },
  title: {
    padding: '24px 16px 16px',
    [theme.breakpoints.down('xs')]: {
      padding: '16px 8px 8px',
    },
  },
  titleText: {
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  content: {
    padding: '0 16px',
  },
  contentImage: {
    width: '100%',
    marginBottom: 16,
  },
  contentImageIcon: {
    margin: 'auto',
    width: 160,
    height: 160,
  },
  contentText: {
    fontSize: 16,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  actions: {
    margin: 0,
    padding: 16,
  },
  actionsButton: {
    width: '100%',
  },
}))
class DetailWaitDialog extends React.Component {

  render() {
    const { profile, open, onClose, classes } = this.props

    if (!profile) {
      return null
    }

    return (
       <Dialog className={classes.root} open={!!open} onClose={onClose}>
         <DialogTitle className={classes.title}>
            <p className={classes.titleText}>案件に応募する前に、まずはプロフィールを入力しましょう。</p>
          </DialogTitle>
          <DialogContent className={classes.content} >
            <div className={classes.contentImage}>
              <UserAvatar size={320} className={classes.contentImageIcon} />
            </div>
          </DialogContent>
          <DialogActions className={classes.actions}>
            <Button variant='contained' color='primary' className={[classes.actionsButton].join(' ')} component={Link} to={`/setup/${profile.id}/0`}>
              プロフィール入力へ
            </Button>
          </DialogActions>
      </Dialog>
    )
  }
}
