import React from 'react'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import ActionLanguage from '@material-ui/icons/Language'
import CommunicationPhone from '@material-ui/icons/Phone'
import AvPlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import ActionRoom from '@material-ui/icons/Room'
import ActionVerifiedUser from '@material-ui/icons/VerifiedUser'
import Security from '@material-ui/icons/Security'

import ProSummary from 'components/ProSummary'
import ThanksButton from 'components/ThanksButton'
import MediaSlider from 'components/MediaSlider'
import Review from 'components/Review'
import LicenceLink from 'components/LicenceLink'
import TelLink from 'components/TelLink'
import { imageSizes } from '@smooosy/config'

@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  flex: {
    display: 'flex',
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
  },
  proInfoSection: {
    padding: 20,
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  proDetailSection: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    margin: '10px 0',
  },
  importantInfo: {
    fontSize: 12,
    color: theme.palette.grey[800],
    marginTop: 10,
  },
  proDetailIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  verified: {
    fontSize: 14,
  },
  verifiedIcon: {
    fontSize: 20,
    color: theme.palette.secondary.main,
  },
  greyColor: {
    color: theme.palette.grey[700],
  },
  title: {
    background: theme.palette.grey[100],
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  media: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: 15,
  },
  reviews: {
    padding: 20,
  },
  description: {
    padding: '5px 10px 25px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontSize: 12,
  },
  info: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    padding: '15px 10px',
    fontSize: 14,
  },
  infoTitle: {
    marginBottom: 5,
  },
  readmore: {
    cursor: 'pointer',
    margin: 10,
    textAlign: 'center',
    fontSize: 12,
    color: theme.palette.grey[700],
  },
  verifiedCheck: {
    color: theme.palette.secondary.main,
    marginLeft: 10,
  },
  labels: {
    fontSize: 12,
  },
  catchphrase: {
    color: theme.palette.secondary.sub,
    fontSize: 14,
  },
  proSummary: {
    flex: 1,
    marginBottom: 10,
  },
  thanks: {
    marginLeft: 5,
  },
}))
export default class ProfileBase extends React.Component {
  static defaultProps = {
    ReviewComponent: Review,
  }

  constructor(props) {
    super(props)
    this.state = {slideNumber: null}
  }

  selectMedia = (slideNumber) => {
    this.setState({slideNumber})
  }

  render() {
    const { slideNumber, readmore } = this.state
    const { profile, style, ReviewComponent, classes } = this.props

    if (!profile) {
      return null
    }

    return (
      <div className={classes.root} style={style}>
        <div className={classes.proInfoSection}>
          <div className={classes.flex}>
            <ProSummary user={profile.pro} profile={profile} className={classes.proSummary} />
            <ThanksButton preview user={profile.pro} name={profile.name} className={classes.thanks} />
          </div>
          {profile.catchphrase &&
            <div className={classes.catchphrase}>{profile.catchphrase}</div>
          }
          {profile.labels &&
            <div className={classes.labels}>
              {profile.labels.map(l => l.text).join(' / ')}
            </div>
          }
          <div className={classes.importantInfo}>
            {(profile.pro.identification || {}).status === 'valid' &&
              <div className={[classes.infoTitle, classes.verified, classes.flexCenter].join(' ')}>
                <ActionVerifiedUser className={[classes.proDetailIcon, classes.verifiedIcon].join(' ')} />
                本人確認済み
              </div>
            }
            {profile.pro.phone && (
              <div className={[classes.infoTitle, classes.flexCenter].join(' ')}>
                <CommunicationPhone className={[classes.proDetailIcon, classes.greyColor].join(' ')} />
                <TelLink phone={profile.pro.phone} gaEvent={{action: 'ProfileBase_click', id: profile.id}} />
              </div>
            )}
            {profile.url && (
              <div className={[classes.infoTitle, classes.flexCenter].join(' ')}>
                <ActionLanguage className={[classes.proDetailIcon, classes.greyColor].join(' ')} />
                <div style={{flex: 1}}>
                  <a style={{wordBreak: 'break-all'}} href={/^http/.test(profile.url) ? profile.url : 'http://' + profile.url} target='_blank' rel='nofollow noopener noreferrer'>
                    {profile.url}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={classes.title}>
          <h4 style={{padding: 10}}>写真 ({profile.media.length})</h4>
        </div>
        <div>
          <div className={classes.media}>
            {profile.media.length ? profile.media.map((m, idx) => (
              <Paper key={m.id} style={{margin: 5, height: 72, cursor: 'pointer', position: 'relative'}} onClick={() => this.selectMedia(idx)}>
                <img alt={m.text} src={m.url + imageSizes.c160} height={72} />
                {m.type === 'video' && <AvPlayCircleFilled style={{position: 'absolute', top: '50%', left: '50%', marginTop: - 20, marginLeft: -20, width: 40, height: 40, color: 'rgba(255, 255, 255, .5)'}} />}
              </Paper>
            )) : '写真はありません'}
          </div>
        </div>
        <div className={classes.title}>
          <div className={classes.flexCenter}>
            <h4 style={{padding: 10}}>クチコミ ({profile.reviews.length})</h4>
            <div style={{flex: 1}} />
          </div>
        </div>
        <div className={classes.reviews}>
          {profile.reviews.length ?
            profile.reviews.slice(0, 5).map((review, i) =>
              <div key={i} style={{marginBottom: 20}}>
                <ReviewComponent review={review} services={profile.services} />
              </div>
            )
          :
            'クチコミはまだありません'
          }
          {!readmore && profile.reviews.length > 5 &&
            <div className={classes.readmore} onClick={() => this.setState({readmore: true})}>さらに読む</div>
          }
          {readmore && profile.reviews.slice(5).map((review, i) =>
            <div key={i} style={{marginBottom: 20}}>
              <ReviewComponent review={review} services={profile.services} />
            </div>
          )}
        </div>
        <div className={classes.title}>
          <h4 style={{padding: 10}}>プロについて</h4>
        </div>
        <div style={{padding: 10}}>
          <h5>自己紹介（事業内容・提供するサービス）</h5>
          <p className={classes.description}>{profile.description}</p>
          <h5>これまでの実績</h5>
          <p className={classes.description}>{profile.accomplishment}</p>
          <h5>アピールポイント</h5>
          <p className={classes.description}>{profile.advantage}</p>
          <h5>経験年数</h5>
          <p className={classes.description}>{profile.experience ? `${profile.experience}年` : ''}</p>
          <h5>従業員数</h5>
          <p className={classes.description}>{profile.employees ? `${profile.employees}人` : ''}</p>
        </div>
        <div style={{padding: 10}}>
          <div className={classes.proDetailSection}>
            {profile.address &&
              <div className={classes.info}>
                <div className={[classes.infoTitle, classes.flexCenter, classes.greyColor].join(' ')}>
                  <ActionRoom className={[classes.proDetailIcon, classes.greyColor].join(' ')} /> 拠点
                </div>
                <div>{profile.address}</div>
              </div>
            }
            {profile.url &&
              <div className={classes.info}>
                <div className={[classes.infoTitle, classes.flexCenter, classes.greyColor].join(' ')}>
                  <ActionLanguage className={[classes.proDetailIcon, classes.greyColor].join(' ')} /> ウェブサイト
                </div>
                <div style={{wordBreak: 'break-all'}}>
                  <a href={/^http/.test(profile.url) ? profile.url : 'http://' + profile.url} target='_blank' rel='nofollow noopener noreferrer'>
                    {profile.url}
                  </a>
                </div>
              </div>
            }
            {profile.licences && profile.licences.filter(l => l.status !== 'invalid' && l.status !== 'pending').length > 0 &&
              <div className={classes.info}>
                <div className={[classes.infoTitle, classes.flexCenter, classes.greyColor].join(' ')}>
                  <Security className={[classes.proDetailIcon, classes.greyColor].join(' ')} /> 資格・免許
                </div>
                <div>
                  {profile.licences.filter(l => l.status !== 'invalid' && l.status !== 'pending').map(l =>
                    <div key={l._id}>
                      <span>- <LicenceLink licence={l} /></span>
                      {l.status === 'valid' && <span><span className={classes.verifiedCheck}>✔︎</span> 確認済み</span>}
                    </div>
                  )}
                </div>
              </div>
            }
          </div>
        </div>
        <MediaSlider media={profile.media} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} />
      </div>
    )
  }
}
