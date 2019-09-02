import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Avatar, Paper, Button, LinearProgress } from '@material-ui/core'
import { green } from '@material-ui/core/colors'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import { load as loadUser, update as updateUser } from 'modules/auth'
import { load as loadProfile } from 'modules/profile'
import AvatarCropper from 'components/AvatarCropper'
import ProfileDescription from 'components/ProfileDescription'
import RatingStar from 'components/RatingStar'
import ReviewRequestForm from 'components/ReviewRequestForm'
import UserAvatar from 'components/UserAvatar'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
  }),
  { loadProfile, loadUser, updateUser }
)
@withTheme
export default class SetupPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount() {
    this.props.loadProfile(this.props.match.params.id)
    setTimeout(this.props.loadUser, 3000)
  }

  handlePrev = e => {
    if (e && e.preventDefault) e.preventDefault()
    this.props.history.goBack()
    document.body.scrollTop = 0
  }

  handleNext = e => {
    if (e && e.preventDefault) e.preventDefault()
    const idx = parseInt(this.props.match.params.idx, 10) || 0

    this.props.history.push(`/setup/${this.props.profile.id}/${idx+1}`)
    document.body.scrollTop = 0
  }

  handleUpdateProfile = (updateProfile) => {
    this.setState({profile: {...this.state.profile, ...updateProfile}})
    this.handleNext()
  }

  handleImage = (blob) => {
    this.props.updateUser({}, blob)
      .then(() => this.props.loadProfile(this.state.profile.id))
      .then(res => this.setState({profile: {...this.state.profile, ...res.profile}}))
  }

  onReviewRequestSent = () => {
    this.setState({reviewSent: true})
    setTimeout(() => this.handleNext(), 1000)
  }
  handleReviewRequest = () => {
    if (this.reviewRequestForm) {
      this.reviewRequestForm.submit()
    }
  }

  render() {
    const { user, profile, submitting, width, theme } = this.props
    const { common, grey, secondary } = theme.palette
    const idx = parseInt(this.props.match.params.idx, 10) || 0

    if (!profile) return null

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingTop: 60,
      },
      base: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      },
      wrap: {
        flex: 1,
        overflowX: 'auto',
        width: '100%',
      },
      content: {
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0px',
        margin: '0px auto',
        width: '90%',
        maxWidth: 800,
      },
      footer: {
        background: common.white,
        borderTop: `1px solid ${grey[300]}`,
        width: '100%',
      },
      footerBar: {
        display: 'flex',
        flexDirection: 'row',
        padding: '10px 0px',
        margin: '0px auto',
        width: '90%',
        maxWidth: 800,
      },
      progress: {
        width: '100%',
        height: 8,
        background: '#ddd',
      },
      text: {
        padding: '20px 0',
        fontSize: width === 'xs' ? 16 : 18,
        fontWeight: 'bold',
      },
      panel: {
        display: 'flex',
        flexDirection: width === 'xs' ? 'column' : 'row',
      },
      paper: {
        border: `1px solid ${grey[300]}`,
        padding: 20,
        marginBottom: 20,
        width: '100%',
      },
      tips: {
        border: `1px solid ${grey[300]}`,
        backgroundColor: grey[50],
        padding: 20,
        marginBottom: 20,
      },
      tipsIcon: {
        height: width === 'xs' ? 20 : 22,
      },
      tipsText: {
        fontSize: width === 'xs' ? 16 : 18,
        fontWeight: 'bold',
        marginLeft: '2px',
      },
      number: {
        backgroundColor: secondary.main,
        color: common.white,
        margin: 10,
        width: 40,
        height: 40,
        fontSize: 16,
      },
    }

    const pros = {
      A: {
        name: 'プロ A',
        address: '東京都千代田区',
        averageRating: 4.8,
        reviewCount: 20,
        description: `こんにちは。山田と申します。赤坂にて山田スタジオという写真・映像スタジオを経営しており、年間250件以上の撮影依頼を頂いています。

商品撮影・建築写真から、人物写真・ドローン空撮・スクールフォトまで、幅広いジャンルの撮影に対応致します。クライアントには「〇〇食品」「〇〇大学」等があり、ファッション誌の「月刊〇〇」などでも撮影しています。
2009年にはABC広告写真賞を頂きました。
私の強みはお客様のご意向に合わせた撮影ができることです。
これまでの依頼者様からのクチコミも是非ご覧ください。`,
        image: '/images/pros/profile_icon3.jpg?',
        imageUpdatedAt: new Date(),
      },
      B: {
        name: 'プロ B',
        address: '東京都千代田区',
        averageRating: 3,
        reviewCount: 1,
        description: '山田と申します。赤坂で山田スタジオを経営しています。',
        image: '/images/pros/profile_icon_bad.jpg?',
        imageUpdatedAt: new Date(),
      },
    }

    // 新規登録フローのパーツが揃ったら使います
    const profileSetupFlow = ( // eslint-disable-line
      <div key='profileFlow' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>プロフィールを充実させましょう</div>
            <div style={styles.panel}>
              <Paper style={styles.paper}>
                <p style={{fontSize: 14, marginBottom: 10}}>良いプロフィールにすることで、成約率が上がります。</p>
                <div style={{display: 'flex', alignItems: 'center', fontSize: 14}}><Avatar style={styles.number}>1</Avatar>自己紹介の入力</div>
                <div style={{display: 'flex', alignItems: 'center', fontSize: 14}}><Avatar style={styles.number}>2</Avatar>アイコン画像の設定</div>
                <div style={{display: 'flex', alignItems: 'center', fontSize: 14}}><Avatar style={styles.number}>3</Avatar>クチコミの依頼</div>
              </Paper>
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <div style={{flex: 1}} />
            <Button
              className='profileSetupFlowSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              onClick={this.handleNext}
              color='primary'
            >
              次へ
            </Button>
          </div>
        </div>
      </div>
    )

    const profileQuiz = ( // eslint-disable-line
      <div key='profileQuiz' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>成約しやすいプロフィールとは</div>
            <p style={{fontSize: 14, marginBottom: 10}}>もしあなたが依頼者だったら、どちらのプロに依頼したいですか？</p>
            <div style={styles.panel}>
              <Paper style={{...styles.paper, height: '100%'}}>
                <ProfilePaper profile={pros.A}/>
                <div style={{display: 'flex', alignItems: 'center', paddingTop: 24}}>
                  <div style={{flex: 1}} />
                  <Button className='profileQuizSubitButtonA' variant='contained' color='primary' onClick={() => {
                    this.setState({answer: 'A'})
                    this.handleNext()
                  }} >
                    このプロを選ぶ
                  </Button>
                </div>
              </Paper>
              <div style={{width: '20px'}} />
              <Paper style={{...styles.paper, height: '100%'}}>
                <ProfilePaper profile={pros.B}/>
                <div style={{display: 'flex', alignItems: 'center', paddingTop: 24}}>
                  <div style={{flex: 1}} />
                  <Button className='profileQuizSubitButtonB' variant='contained' color='primary' onClick={() => {
                    this.setState({answer: 'B'})
                    this.handleNext()
                  }} >
                    このプロを選ぶ
                  </Button>
                </div>
              </Paper>
            </div>
          </div>
        </div>
      </div>
    )

    const profileAnswer = ( // eslint-disable-line
      <div key='profileAnswer' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>
              {this.state.answer == 'A'
              ? '正解です。'
              : '残念ながら、別のプロが選ばれる可能性が高いです。'
              }
            </div>
            <div style={{fontSize: 14, marginBottom: 10}}>
              <p>成約しやすいプロフィールのポイント</p>
              <ul>
                <li>自己紹介では、提供サービスの説明は具体的にしましょう。</li>
                <li>アイコンは、顔が見えるとユーザーの安心感が上がります。</li>
                <li>クチコミが3件以上ある事業者様の成約率は、クチコミのない方の3倍です</li>
              </ul>
            </div>
            <div style={styles.panel}>
              <Paper style={{...styles.paper, width: width === 'xs' ? '100%' : '50%'}}>
                <ProfilePaper profile={pros.A}/>
              </Paper>
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <div style={{flex: 1}} />
            <Button
              className='profileAnswerSubitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              onClick={this.handleNext}
              color='primary'
            >
              プロフィール入力へ
            </Button>
          </div>
        </div>
      </div>
    )

    const profileSetupPage = (
      <div key='profile' style={styles.base}>
        <ProfileDescription
          flex
          user={user}
          profile={profile}
          onSubmit={this.handleUpdateProfile}
          title='プロフィールを入力しましょう。依頼主に表示されます'
          buttonAlign='right'
          hideDetail
        />
      </div>
    )

    const avatarSetupPage = (
      <div key='avatar' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>アイコンを設定しましょう。</div>
            <div style={styles.panel}>
              <Paper style={styles.paper}>
                <p style={{fontSize: 14, marginBottom: 10}}>相手の顔が見えるとユーザーの安心感が上がります。</p>
                <AvatarCropper user={user} handleImage={this.handleImage} />
              </Paper>
              <div style={{width: '20px'}} />
              <div style={styles.tips}>
                <div style={{display: 'flex', marginBottom: '10px'}}>
                  <InfoIcon style={styles.tipsIcon} />
                  <p style={styles.tipsText}>Pro Tips</p>
                </div>
                <div>
                  <div style={{display: 'flex', flexWrap: 'nowrap'}}>
                    <img style={{height: '80px', margin: '2px'}} src='/images/pros/profile_icon1.jpg'/>
                    <img style={{height: '80px', margin: '2px'}} src='/images/pros/profile_icon2.jpg'/>
                    <img style={{height: '80px', margin: '2px'}} src='/images/pros/profile_icon3.jpg'/>
                  </div>
                  <ul style={{fontSize: 14}}>
                    <li>相手の顔が見えるとユーザーの安心感が上がります。</li>
                    <li>背景が淡色で明るい印象の写真を選ぶと、さらに好印象です。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <Button onClick={this.handlePrev}>
              <NavigationChevronLeft />
              戻る
            </Button>
            <div style={{flex: 1}} />
            <Button
              className='avatarSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              onClick={this.handleNext}
              color='primary'
            >
              次へ
            </Button>
          </div>
        </div>
      </div>
    )

    const reviewSetupPage = ( // eslint-disable-line
      <div key='review' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <div style={styles.text}>過去の顧客にクチコミを依頼しましょう</div>
            <Paper style={styles.paper}>
              <div>SMOOOSY以外の顧客でも大丈夫です。</div>
              <ReviewRequestForm
                hideSubmitButton
                profile={profile}
                pro={user}
                onSent={this.onReviewRequestSent}
                onSkip={this.handleNext}
                onRef={form => this.reviewRequestForm = form}
              />
            </Paper>
          </div>
        </div>
        <div style={styles.footer}>
          <div style={styles.footerBar}>
            <div style={{flex: 1}} />
            {this.state.reviewSent ?
            <div style={{marginRight: 10, color: green[700]}}>送信しました</div>
            : <Button className='reviewSkipButton' style={{marginRight: 10}} onClick={this.handleNext}>スキップ</Button>
            }
            <Button
              className='reviewSubmitButton'
              variant='contained'
              style={{minWidth: 120}}
              disabled={submitting}
              onClick={this.handleReviewRequest}
              color='primary'
            >
              送信する
            </Button>
          </div>
        </div>
      </div>
    )

    const finishPage = (
      <div key='finish' style={styles.base}>
        <div style={styles.wrap}>
          <div style={styles.content}>
            <Paper key='done' style={styles.paper}>
              <p style={{fontSize: 14, marginBottom: 10}}>{'ありがとうございました。条件に合う依頼がきたらお知らせいたします。'}</p>
              <Button  className='finishSubmitButton' variant='contained' color='primary' onClick={() => this.props.history.push('/pros/requests?mode=setup')} >
                プロダッシュボードに移動
              </Button>
            </Paper>
          </div>
        </div>
      </div>
    )

    const steps = [
      profileSetupFlow,
      profileQuiz,
      profileAnswer,
      profileSetupPage,
      avatarSetupPage,
      reviewSetupPage,
      finishPage,
    ]

    const step = steps[idx]
    const progress = (idx + 1) / steps.length * 30 + 70

    return (
      <div style={styles.root}>
        <Helmet>
          <title>プロフィールの初期設定</title>
        </Helmet>
        <LinearProgress variant='determinate' value={progress} style={styles.progress} />
        {step}
      </div>
    )
  }
}

@withWidth()
@withTheme
class ProfilePaper extends React.Component {

  render = () => {
    const { profile, theme, width } = this.props
    const { common, grey } = theme.palette

    const styles = {
      root: {
        background: common.white,
      },
      title: {
        background: grey[100],
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      reviews: {
        padding: '5px 10px 10px',
        fontSize: '12px',
      },
      description: {
        padding: '5px 10px 20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontSize: 12,
      },
    }

    return (
      <div style={styles.root}>
        <div style={{padding: width === 'xs' ? 10 : 20}}>
          <div style={{display: 'flex'}}>
            <UserAvatar alt={profile.name} user={profile} style={{minWidth: 64, minHeight: 64}} />
            <div style={{marginLeft: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <h4>{profile.name}</h4>
              <div style={{fontSize: 13, color: grey[700]}}>{profile.address}</div>
              <div style={{display: 'flex'}}>
                {profile.averageRating}
                <div style={{width: '100px'}}>
                  <RatingStar rating={profile.averageRating} />
                </div>
                ({profile.reviewCount})
              </div>
            </div>
          </div>
        </div>
        <p style={styles.description}>{profile.description}</p>
      </div>
    )
  }
}
