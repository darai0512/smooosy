import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import { withStyles, withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { load as loadProfile, loadInsight as loadProfileInsight } from 'modules/profile'
import { loadInsight as loadCategoryInsight } from 'modules/category'
import { show as loadProQuestions } from 'modules/proQuestion'

import Loading from 'components/Loading'
import RatingStar from 'components/RatingStar'
import UserAvatar from 'components/UserAvatar'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ReviewRequestForm from 'components/ReviewRequestForm'
import ProAnswerEdit from 'components/account/profile/ProAnswerEdit'

@withWidth()
@withTheme
@connect(
  state => ({
    user: state.auth.user,
    profile: state.profile.profile,
    proQuestions: state.proQuestion.proQuestions,
    profileInsight: state.profile.insight,
    categoryInsight: state.category.insight,
  }),
  { loadProfile, loadProfileInsight, loadCategoryInsight, loadProQuestions }
)
@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
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
  footer: {
    color: theme.palette.grey[500],
    fontSize: 12,
  },
  main: {
    padding: '20px 0',
    width: '70vw',
    maxWidth: 600,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      maxWidth: 'initial',
      padding: '20px 10px',
    },
  },
  value: {
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
    },
  },
  noValue: {
    fontSize: 15,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  valueLabel: {
    margin: '0 4px',
    fontSize: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 8,
    },
  },
  actionButton: {
    paddingRight: 0,
  },
  starWrap: {
    height: 32,
    [theme.breakpoints.down('xs')]: {
      height: 24,
    },
  },
  star: {
    width: 32,
    height: 32,
    margin: 'auto 0px',
    [theme.breakpoints.down('xs')]: {
      width: 24,
      height: 24,
    },
  },
  linearProgress: {
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 255)',
  },
  linearProgressBarColorPrimary: {
    backgroundColor: theme.palette.grey[300],
  },
  linearProgressBar1Determinate: {
    borderRadius: '0px 5px 5px 0px',
  },
  dialogCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    cursor: 'pointer',
  },
}))
export default class PersonalInsightDetail extends React.Component {

  state = {
    requestReviewDialog: false,
    proAnswerEditDialog: false,
  }

  componentDidMount() {
    const profileId = this.props.match.params.id
    this.props.loadProfile(profileId).then(res => {
      this.props.loadProfileInsight(profileId)
      this.props.loadCategoryInsight(res.profile.category)
    })
    this.props.loadProQuestions(profileId)
  }

  openRequestReviewDialog = () => {
    this.setState({requestReviewDialog: true})
  }

  closeRequestReviewDialog = () => {
    this.setState({requestReviewDialog: false})
  }

  onSubmitProAnswer = () => {
    this.props.loadProfileInsight(this.props.profile.id)
    this.closeProAnswerEditDialog()
  }

  openProAnswerEditDialog = () => {
    this.setState({proAnswerEditDialog: true})
  }

  closeProAnswerEditDialog = () => {
    this.setState({proAnswerEditDialog: false})
  }

  render() {
    const { user, profile, profileInsight, categoryInsight, proQuestions, classes, width } = this.props

    if (!profile || !profileInsight || !categoryInsight) {
      return <Loading />
    }

    const insights = [
      {
        user: user,
        name: 'あなた',
        ...profileInsight,
        liearProgressClasses: {
          bar1Determinate: classes.linearProgressBar1Determinate,
        },
      },
      {
        user: null,
        name: 'よく成約しているプロ',
        ...categoryInsight,
        liearProgressClasses: {
          bar1Determinate: classes.linearProgressBar1Determinate,
          barColorPrimary: classes.linearProgressBarColorPrimary,
        },
      },
    ]

    const averageTimeToMeetMax = Math.max(profileInsight.averageTimeToMeet, categoryInsight.averageTimeToMeet)
    const proAnswerCountMax = Math.max(profileInsight.proAnswerCount, categoryInsight.proAnswerCount)
    const proQuestionExists = proQuestions && proQuestions.length > 0

    return (
      <AutohideHeaderContainer
        style={{height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch'}}
        className={classes.root}
        header={
          <div className={classes.header}>
            <div style={{flex: 1}}>
            {width === 'xs' &&
              <Link to='/account'>
                <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
              </Link>
            }
            </div>
            <div>統計情報 : {profile.name}</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>統計情報</title>
        </Helmet>
        <div className={classes.main}>
          <InsightPaper
            title='クチコミ数'
            description='クチコミが4件以上あると成約率が3.5倍になります'
            action={<Button color='primary' size='small' className={classes.actionButton} onClick={this.openRequestReviewDialog}>クチコミを依頼する <NavigationChevronRight/></Button>}
            contents={insights.map(insight => {
              return {
                user: insight.user,
                name: insight.name,
                valueText: (<div className={classes.value}>{insight.reviewCount}<span className={classes.valueLabel}>件</span></div>),
                valueComponent: (<div className={classes.starWrap}><RatingStar classes={{star: classes.star, backgroundStar: classes.backgroundStar}}rating={insight.averageRating} /></div>),
              }
            })}
          />
          <InsightPaper
            title='応募までの時間 '
            note='※ 依頼日と応募日が同日の応募が対象です'
            description='依頼に早く応募するほど、成約率は高まります'
            action={<Button color='primary' size='small' className={classes.actionButton} component={Link} to='/pros/requests'>依頼に応募する <NavigationChevronRight/></Button>}
            contents={insights.map(insight => {
              return {
                user: insight.user,
                name: insight.name,
                valueText: (
                  <>
                    {insight.averageTimeToMeet === null ? <span className={classes.noValue}>データなし</span>
                      : insight.averageTimeToMeet / 60 >= 1 ?
                        <span className={classes.value}>{Math.floor(insight.averageTimeToMeet / 60)}<span className={classes.valueLabel}>時間</span></span>
                        : null
                    }
                    {insight.averageTimeToMeet === null || <span className={classes.value}>{insight.averageTimeToMeet % 60}<span className={classes.valueLabel}>分</span></span>}
                  </>
                ),
                valueComponent: (
                  <>
                  {profileInsight.averageTimeToMeet > 0 &&
                    <LinearProgress
                      className={classes.linearProgress}
                      classes={insight.liearProgressClasses}
                      variant='determinate' value={100 * insight.averageTimeToMeet / averageTimeToMeetMax}
                     />
                  }
                  </>
                ),
              }
            })}
          />
          <InsightPaper
            title='プロへの質問の回答数'
            description='質問に回答すると、自身のプロフィールページに掲載され、依頼者からの信頼性が高まります'
            action={
              <Button color='primary' size='small' className={classes.actionButton} disabled={!proQuestionExists} onClick={this.openProAnswerEditDialog}>
                {proQuestionExists ? '質問に回答する' : '質問がありません'} <NavigationChevronRight/>
              </Button>
            }
            contents={insights.map(insight => {
              return {
                user: insight.user,
                name: insight.name,
                valueText: (<div className={classes.value}>{insight.proAnswerCount}<span className={classes.valueLabel}>件</span></div>),
                valueComponent: (
                  <>
                  {profileInsight.proAnswerCount > 0 &&
                    <LinearProgress
                      className={classes.linearProgress}
                      classes={insight.liearProgressClasses}
                      variant='determinate' value={100 * insight.proAnswerCount / proAnswerCountMax}
                    />
                  }
                  </>),
              }
            })}
          />
          <div className={classes.footer}>※ 統計情報はカテゴリごとに算出しています。データが少ないカテゴリについては全体平均を表示しています。</div>
        </div>
        <Dialog open={!!this.state.requestReviewDialog} onClose={this.closeRequestReviewDialog}>
          <DialogTitle>
            クチコミが4件以上あると成約率が3.5倍になります
            <IconButton className={classes.dialogCloseButton} onClick={this.closeRequestReviewDialog}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <h3>過去の顧客にクチコミを依頼しましょう</h3>
            <div>SMOOOSY以外の顧客でも大丈夫です。</div>
            <ReviewRequestForm
              profile={profile}
              pro={user}
              onSent={() => setTimeout(() => this.closeRequestReviewDialog(), 1000)}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={!!this.state.proAnswerEditDialog} onClose={this.closeProAnswerEditDialog}>
          <DialogTitle>
            プロへの質問の回答
            <IconButton className={classes.dialogCloseButton} onClick={this.closeProAnswerEditDialog}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <ProAnswerEdit profile={profile} proQuestions={proQuestions} currentQuestionPage={0} onSubmit={this.onSubmitProAnswer} />
          </DialogContent>
        </Dialog>
      </AutohideHeaderContainer>
    )
  }
}

@withStyles(theme => ({
  root: {
    marginBottom: 20,
    padding: 20,
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 10,
  },
  headerWrap: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginRight: 10,
  },
  titleNote: {
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  note: {
    fontSize: 12,
    margin: 'auto 5px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 10,
      marginLeft: 0,
    },
  },
  discription: {
    fontSize: 12,
    color: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      fontSize: 10,
    },
  },
}))
class InsightPaper extends React.Component {
  render() {
    const { title, note, description, action, contents, classes } = this.props

    return (
      <div className={classes.root}>
        <div className={classes.header} >
          <div className={classes.headerWrap}>
            <div className={classes.titleNote}>
              <div className={classes.title} >{title}</div>
              <div className={classes.note} >{note}</div>
            </div>
            <div className={classes.discription} >{description}</div>
          </div>
          <div className={classes.action}>{action}</div>
        </div>
        <div className={classes.contents} >
          {contents.map(c => <InsightContent className={classes.content} key={c.id} content={c} />)}
        </div>
      </div>
    )
  }
}

@withWidth()
@withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5,
  },
  avatar: {
    borderBottom: 'none',
    padding: 4,
  },
  main: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  name: {
    width: 180,
    borderBottom: 'none',
    padding: '0px 4px',
    fontSize: 16,
    margin: 'auto 0px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
      width: 128,
    },
  },
  data: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  dataText: {
    width: 100,
    borderBottom: 'none',
    padding: '0px 4px',
    margin: 'auto 0px',
    [theme.breakpoints.down('xs')]: {
      width: 80,
    },
  },
  dataComponent: {
    borderBottom: 'none',
    padding: '0px 4px',
    margin: 'auto 0px',
    flex: 1,
  },
}))
class InsightContent extends React.Component {
  render() {
    const { content, classes, width } = this.props

    return (
      <div className={classes.root} >
        <div className={classes.avatar} >
          <UserAvatar size={width === 'xs' ? 32 : 48} user={content.user} />
        </div>
        <div className={classes.main}>
          <div className={classes.name} >{content.name}</div>
          <div className={classes.data}>
            <div className={classes.dataText} >{content.valueText}</div>
            <div className={classes.dataComponent} >{content.valueComponent}</div>
          </div>
        </div>
      </div>
    )
  }
}
