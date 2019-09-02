import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { Stepper, Step, StepLabel, StepContent } from '@material-ui/core'

import { update as updateUser } from 'modules/auth'
import { load as loadProfile, update as updateProfile } from 'modules/profile'
import { loadAll as loadMedia, create as createMedia, update as updateMedia } from 'modules/media'
import ProfileDescription from 'components/ProfileDescription'
import AvatarCropper from 'components/AvatarCropper'
import MediaListEdit from 'components/MediaListEdit'

@connect(
  state => ({
    user: state.auth.user,
    media: state.media.media,
  }),
  { updateUser, loadProfile, updateProfile, loadMedia, createMedia, updateMedia }
)
export default class ProfileProgress extends React.Component {
  static defaultProps = {
    style: {},
    enableImageSkip: false,
    onProgress: () => {},
    onComplete: () => {},
  }

  constructor(props) {
    super(props)
    this.state = {
      active: {},
    }
  }

  componentDidMount() {
    this.props.loadMedia()
    this.checkProgress()
  }

  checkProgress = () => {
    const { profile } = this.props
    let progress
    if (!profile.description) {
      progress = 0
    } else if (!profile.pro.imageUpdatedAt && !this.state.imageSkip) {
      progress = 1
    } else if (!profile.media.length && !this.state.mediaSkip) {
      progress = 2
    } else {
      progress = 3
    }
    let active = this.state.active
    if (this.state.progress !== progress) {
      active = {}
      active[progress] = true
    }
    this.setState({progress, active})
    this.props.onProgress(progress)
  }

  toggleStep = (i) => {
    const { active, progress } = this.state
    active[i] = progress >= i && !active[i]
    this.setState({active})
  }

  handleImage = (blob) => {
    this.props.updateUser({}, blob)
      .then(() => this.props.loadProfile(this.props.profile.id))
      .then(this.checkProgress)
  }

  render() {
    const { progress, active } = this.state
    const { user, media, profile, style, enableImageSkip } = this.props

    if (!profile) return null

    const styles = {
      dialog: {
        width: '90%',
        maxWidth: 400,
        margin: '30px auto',
      },
      label: {
        fontSize: 18,
      },
    }


    return (
      <div style={style}>
        <Stepper activeStep={progress} orientation='vertical'>
          <Step active={active[0]}>
            <StepLabel onClick={() => this.toggleStep(0)} style={styles.label}>基本情報を入力しましょう</StepLabel>
            <StepContent>
              <div>
                <ProfileDescription user={user} profile={profile} onSubmit={this.checkProgress} buttonAlign='left' />
              </div>
            </StepContent>
          </Step>
          <Step active={active[1]}>
            <StepLabel onClick={() => this.toggleStep(1)} style={styles.label}>アイコンを設定しましょう</StepLabel>
            <StepContent>
              <div>
                <p style={{fontSize: 14, marginBottom: 10}}>相手の顔が見えるとユーザーの安心感が上がります。</p>
                <AvatarCropper user={user} handleImage={this.handleImage} />
                {enableImageSkip &&
                  <Button
                    style={{marginTop: 10}}
                    onClick={() => {
                      this.setState({imageSkip: true});setTimeout(this.checkProgress, 0)
                    }}
                  >
                    スキップ
                  </Button>
                }
              </div>
            </StepContent>
          </Step>
          <Step active={active[2]}>
            <StepLabel onClick={() => this.toggleStep(2)} style={styles.label}>写真を追加しましょう</StepLabel>
            <StepContent>
              <div>
                <p style={{fontSize: 14, marginBottom: 10}}>仕事内容が伝わる写真や動画を追加しましょう。</p>
                <MediaListEdit
                  mediaAll={media}
                  mediaList={{id: profile.id, media: profile.media}}
                  upsertList={this.props.updateProfile}
                  createMedia={this.props.createMedia}
                  updateMedia={this.props.updateMedia}
                />
                <Button
                  variant='contained'
                  style={{minWidth: 120}}
                  color='primary'
                  onClick={() => {
                    this.setState({mediaSkip: true});setTimeout(this.checkProgress, 0)
                  }}
                >
                  次へ
                </Button>
              </div>
            </StepContent>
          </Step>
          <Step active={active[3]}>
            <StepLabel onClick={() => this.toggleStep(3)} style={styles.label}>完了！</StepLabel>
            <StepContent>
              <div>
                <Button
                  variant='contained'
                  style={{minWidth: 120}}
                  color='primary'
                  onClick={this.props.onComplete}
                >
                  {this.props.completeLabel}
                </Button>
              </div>
            </StepContent>
          </Step>
        </Stepper>
      </div>
    )
  }
}
