import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Button, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core'
import withStyles from '@material-ui/core/styles/withStyles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import FilterNone from '@material-ui/icons/FilterNone'

import storage from 'lib/storage'

import { sendLog } from 'modules/auth'
import { starterPack as loadStarterPack } from 'modules/point'
import StarterProgramBanner from 'components/pros/StarterProgramBanner'

import { BQEventTypes, univOrigin } from '@smooosy/config'

@withRouter
@withStyles((theme) => ({
  panelRoot: {
    marginTop: '16px !important',
    '&::before': {
      background: 'none',
    },
  },
  summaryRoot: {
    backgroundColor: theme.palette.grey[300],
    minHeight: '40px !important',
    height: 40,
    padding: '0px 14px',
    borderRadius: 4,
  },
  summaryContent: {
    '&> :last-child': {
      paddingRight: 24,
    },
  },
  summaryExpanded: {
    borderRadius: '4px 4px 0px 0px',
  },
  summaryContentWrap: {
    display: 'flex',
    width: '100%',
    color: theme.palette.grey.G950,
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryContentTitle: {
    color: theme.palette.grey.G950,
  },
  summaryContentText: {
    color: theme.palette.secondary.sub,
    '&:hover': {
      textDecoration: 'underline',
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  summaryExpandIcon: {
    width: 24,
    height: 24,
  },
  detailsRoot: {
    padding: '8px 24px 0px',
    [theme.breakpoints.down('xs')]: {
      padding: '32px 24px',
    },
  },
  detailsWrap: {
    width: '100%',
    color: theme.palette.grey.G950,
    padding: 32,
    [theme.breakpoints.down('sm')]: {
      padding: '32px 16px',
    },
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
  detailsTitleWrap: {
    display: 'flex',
    padding: '16px 0px',
    [theme.breakpoints.down('xs')]: {
      padding: '24px 0px 40px',
    },
  },
  detailsTitleMain: {
    fontWeight: 'bold',
    lineHeight: '130%',
    fontSize: 28,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  detailsTitleSub: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: '130%',
  },
  detailsLeft: {
    width: 32,
    paddingLeft: 4,
  },
  detailsRight: {
    flex: 1,
  },
  detailsTitleBorder: {
    border: `2px solid ${theme.palette.secondary.main}`,
    borderRadius: 2,
    width: 2,
    height: '100%',
  },
  descriptionBold: {
    color: theme.palette.grey.G950,
    fontWeight: 'bold',
  },
}))
@connect(state => ({
  starterPack: state.point.starterPack,
}), { loadStarterPack, sendLog })
export default class StarterGuide extends React.Component {

  STORAGE_KEY = 'starterGuideCollapse'

  constructor(props) {
    super(props)
    this.state = {
      expanded: !storage.get(this.STORAGE_KEY),
    }
  }

  componentDidMount() {
    this.props.loadStarterPack()
  }

  onButtonClick = (key, url, isBlank) => {
    if (isBlank) {
      window.open(url, '_blank')
    } else {
      this.props.history.push(url)
    }
    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: 'click',
      component: 'button',
      key,
    })
  }

  onChange = (event, expanded) => {
    this.setState({expanded})
    storage.save(this.STORAGE_KEY, !expanded)
    this.props.sendLog(BQEventTypes.web.STARTER_PROGRAM, {
      type: expanded ? 'expand' : 'collapse',
      component: 'panel',
    })
  }

  render() {
    const { starterPack, classes } = this.props
    const { expanded } = this.state

    if (!starterPack) {
      return null
    }
    if (starterPack.reviewCount > 0 && starterPack.meetCount > 10 && starterPack.hiredCount > 0) {
      return null
    }

    const actions = [
      {
        index: 1,
        key: 'profile',
        title: '魅力的なプロフィールを作りましょう',
        description: (<>
          依頼者がまず見るのが事業者のプロフィールです。
          <span className={classes.descriptionBold}>提供サービスの説明</span>を具体的に伝え、<span className={classes.descriptionBold}>アイコンや画像</span>を有効活用して魅力を伝えましょう！
        </>),
        detailUrl: `${univOrigin}/tags/tips-profile`,
        settingUrl: '/account/profiles',
      },
      {
        index: 2,
        key: 'review',
        title: 'クチコミを獲得しましょう',
        description: (<>
          クチコミが3件以上ある事業者様の成約率は、<span className={classes.descriptionBold}>クチコミのない方の3倍です。</span>
          SMOOOSY外の既存顧客にクチコミ依頼もできます。
        </>),
        detailUrl: `${univOrigin}/posts/all/79581`,
        settingUrl: '/account/reviews',
      },
      {
        index: 3,
        key: 'meet',
        title: 'まずは10回応募しましょう',
        description: (<>
          準備ができたら、まずは10回応募しましょう。
          <span className={classes.descriptionBold}>10回以上応募すると8割以上の事業者様が成約</span>しています。クレカ登録で初回応募は無料です！
        </>),
        componentAfter: starterPack.isTarget && <StarterProgramBanner />,
      },
      {
        index: 4,
        key: 'message',
        title: 'メッセージを依頼者に応じてカスタマイズしましょう',
        description: (<>
          金額は安すぎても高すぎてもダメ、文章は簡潔に自分の特徴を伝えましょう！
          応募テンプレを用意して素早く応募できます。
        </>),
        detailUrl: `${univOrigin}/tags/tips-message`,
        settingUrl: '/account/templates',
      },
      {
        index: 5,
        key: 'repeat',
        title: '先々に続くお付き合いにするために、つながりを維持しましょう',
        description: (<>
          初回メッセージを送ったあとは<span className={classes.descriptionBold}>電話やLINEで直接やりとりOK。</span>
          たとえ今回の案件で成約しなくても、つながりを作ることでその後直接依頼がきた事例も多数あります。
        </>),
      },
    ]

    return (
      <ExpansionPanel defaultExpanded={expanded} classes={{root: classes.panelRoot}} onChange={this.onChange}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon fontSize='small' />}
          classes={{
            root: classes.summaryRoot,
            content: classes.summaryContent,
            expanded: classes.summaryExpanded,
            expandIcon: classes.summaryExpandIcon,
          }}
        >
          <div className={classes.summaryContentWrap}>
            <div className={classes.summaryContentTitle}>SMOOOSYで営業活動を成功させるために</div>
            <div style={{flex: 1}} />
            <div className={classes.summaryContentText}>{expanded ? '' : '開く'}</div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails classes={{root: classes.detailsRoot}}>
          <div className={classes.detailsWrap}>
            <div className={classes.detailsTitleWrap}>
              <div className={classes.detailsLeft}>
                <div className={classes.detailsTitleBorder} />
              </div>
              <div className={classes.detailsRight}>
                <div className={classes.detailsTitleSub}>成功しているプロに学ぶ</div>
                <div className={classes.detailsTitleMain}>まずはやることリスト</div>
              </div>
            </div>
            <div>
              {actions.map(action =>
              <StarterGuideRow
                index={action.index}
                key={action.key}
                title={action.title}
                description={action.description}
                componentAfter={action.componentAfter}
                onDetailClick={action.detailUrl ? () => {
                  this.onButtonClick(`detail_${action.key}`, action.detailUrl, true)
                } : null}
                onSettingClick={action.settingUrl ? () => {
                  this.onButtonClick(`setting_${action.key}`, action.settingUrl, false)
                } : null}
              />)}
            </div>
          </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

let StarterGuideRow = ({index, title, description, onDetailClick, onSettingClick, componentAfter, classes}) => (
  <div className={classes.root}>
    <div className={classes.main}>
      <div className={classes.leftBox}>
        <div className={classes.index}>{index}</div>
      </div>
      <div className={classes.rightBox}>
        <div className={classes.title}>{title}</div>
        <div className={classes.content}>
          <div className={classes.description}>{description}</div>
          <div className={classes.actions}>
            {onDetailClick && <Button className={classes.detailAction} variant='outlined' size='medium' onClick={onDetailClick}>詳細を見る<FilterNone className={classes.icon}/></Button>}
            {onSettingClick && <Button className={classes.settingAction} variant='contained' size='medium' color='secondary' onClick={onSettingClick}>設定する</Button>}
          </div>
        </div>
      </div>
    </div>
    {componentAfter}
  </div>
)

StarterGuideRow = withStyles((theme) => ({
  main: {
    display: 'flex',
    paddingTop: 24,
    paddingBottom: 24,
  },
  index: {
    color: theme.palette.grey.G650,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: '130%',
  },
  leftBox: {
    width: 32,
    minWidth: 32,
  },
  rightBox: {
    flex: 1,
  },
  content: {
    display: 'flex',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: '130%',
  },
  description: {
    flex: 1,
    fontSize: 14,
    marginTop: 12,
    color: theme.palette.grey.G650,
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
    },
  },
  actions: {
    minWidth: 294,
    marginTop: 'auto',
    textAlign: 'right',
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
      textAlign: 'center',
      minWidth: 0,
    },
  },
  detailAction: {
    color: theme.palette.grey.G650,
    border: `1px solid ${theme.palette.grey[300]}`,
    width: 134,
    height: 42,
    fontWeight: 'bold',
    boxShadow: 'none',
    [theme.breakpoints.down('xs')]: {
      marginTop: 24,
    },
  },
  settingAction: {
    marginLeft: 16,
    width: 104,
    height: 42,
    fontWeight: 'bold',
    boxShadow: 'none',
    [theme.breakpoints.down('xs')]: {
      marginTop: 24,
    },
  },
  icon: {
    width: 12,
    marginLeft: 4,
  },
}))(StarterGuideRow)
