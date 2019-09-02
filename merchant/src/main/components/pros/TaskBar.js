import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { red, green, orange, indigo } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import AlertWarning from '@material-ui/icons/Warning'
import PeopleIcon from '@material-ui/icons/People'
// import ArticleIcon from '@material-ui/icons/Assignment'

import { loadCampaigns } from 'modules/point'
import { loadAll as loadProServices } from 'modules/proService'

const smooosyGreen = '#74B000'

@withWidth()
@connect(
  state => ({
    user: state.auth.user,
    mustTasks: state.point.campaigns.filter(c => c.status !== 'done' && c.priority > 0),
    proServices: state.proService.proServices,
  }),
  { loadCampaigns, loadProServices }
)
@withStyles(theme => ({
  root: {
    width: '100%',
  },
  icon: {
    margin: 'auto',
    color: orange[500],
  },
  green: {
    color: green[500],
  },
  smooosyGreen: {
    color: smooosyGreen,
  },
  red: {
    color: red[500],
  },
  orange: {
    color: orange[500],
  },
  indigo: {
    color: indigo[500],
  },
  title: {
    fontWeight: 'bold',
    flexWrap: 'wrap',
    margin: 'auto 10px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  subtitle: {
    margin: 'auto 10px',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 11,
    },
  },
  proMediaLinks: {
    margin: '4px 8px 4px 24px',
    listStyleType: 'disc',
  },
  link: {
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  newText: {
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: theme.palette.red[500],
    fontSize: 14,
    marginLeft: 4,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  button: {
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    fontSize: 14,
    wordBreak: 'keep-all',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
}))
export default class TaskBar extends React.Component {

  proMediaLinks = [
    {
      href: '/pro/tax-accountant/media/15689',
      text: '【山口育男税理士事務所】圧倒的なコスパを誇る税理士。他のサイトよりもSMOOOSYを選ぶ理由とは？',
      textSp: '【税理士】圧倒的なコスパ。SMOOOSYを選ぶ理由とは？',
      newText: 'NEW',
    },
    {
      href: '/pro/car-maintenance/media/15346',
      text: '【カーコンビニ倶楽部環八ストリート蒲田東店】半信半疑から一転、コツをつかんで次々と成約へ',
      textSp: '【車検・修理】半信半疑から一転、次々と成約へ',
      newText: 'NEW',
    },
  ]

  componentDidMount() {
    this.props.loadCampaigns()
    this.props.loadProServices()
  }

  render() {
    const { proServices, mustTasks, classes, width } = this.props
    const keys = Object.keys(proServices)

    const notices = []
    if (keys.some(k => proServices[k].service.matchMoreEditable)) {
      notices.push(<MatchMoreStartNotice classes={classes} width={width} />)
    }

    if (keys.some(k => proServices[k].service.showJobRequirements)) {
      notices.push(<JobRequirementsAvailableNotice classes={classes} width={width} />)
    } else if (mustTasks && mustTasks.find(t => t.key === 'proServiceDescription')) {
      notices.push(<ServiceDescriptionNotice classes={classes} width={width} />)
    }

    return (
      <div className={classes.root}>
        {notices}
      </div>
    )
  }
}

export const Cell = withStyles(theme => ({
  cell: {
    display: 'flex',
    marginBottom: 5,
    width: '100%',
  },
  contents: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    padding: '10px 30px 10px 20px',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderLeft: 'none',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '10px 10px',
    },
  },
  border: {
    width: 10,
  },
  green: {
    background: green[500],
  },
  red: {
    background: red[500],
  },
  orange: {
    background: orange[500],
  },
  indigo: {
    background: indigo[500],
  },
  smooosyGreen: {
    background: smooosyGreen,
  },
}))(props => {
  const { classes, color, children, style, contentStyle } = props

  return (
    <div className={classes.cell} style={style}>
      <div className={[classes.border, classes[color]].join(' ')} />
      <div className={classes.contents} style={contentStyle}>
        {children}
      </div>
    </div>
  )
})

const MatchMoreStartNotice = props => {
  const { classes, width } = props

  return <Cell color='orange'>
    <PeopleIcon className={[classes.icon, classes.orange].join(' ')} />
    {width === 'xs' ?
      <div className={classes.title}>
        <span className={classes.red}>{'<重要>'}</span>
        <Link to='/pros/matchmore'>自動で集客ができる、ご指名方式の設定をしましょう。</Link>
      </div>
    :
      <>
        <div className={classes.title}>
          <span className={classes.red}>{'<重要>'}</span>自動で集客ができる、ご指名方式の設定を完了しましょう。
        </div>
        <div style={{flex: 1}} />
        <Button variant='outlined' className={classes.button} component={Link} to='/pros/matchmore'>詳細を見る</Button>
      </>
    }
  </Cell>
}

const JobRequirementsAvailableNotice = props => {
  const { classes, width } = props

  const title = '🆕 ご登録のサービスで仕事条件を設定できるようになりました。'
  const subtitle = '条件に合う依頼をより多くお届けします。'

  return <Cell color='smooosyGreen'>
    <AlertWarning className={[classes.icon, classes.smooosyGreen].join(' ')} />
    {width === 'xs' ?
      <>
        <div className={classes.title}>
          <Link to='/account/services/bulk/job-requirements'>
            {title}
          </Link>
        </div>
        <div className={classes.subtitle}>
          {subtitle}
        </div>
      </>
    :
      <>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div className={classes.title}>
              {title}
            </div>
            <div className={classes.subtitle}>
              {subtitle}
            </div>
          </div>
          <div style={{flex: 1}} />
          <Button variant='outlined' className={classes.button} style={{}} component={Link} to='/account/services/bulk/job-requirements'>詳細を見る</Button>
      </>
    }
  </Cell>
}

const ServiceDescriptionNotice = props => {
  const { classes, width } = props
  const title = 'サービス別自己紹介文を設定して、無料ポイントを獲得しましょう'
  return <Cell color='orange'>
    <AlertWarning className={[classes.icon, classes.orange].join(' ')} />
    {width === 'xs' ?
      <>
        <div className={classes.title}>
          <Link to='/account/services/bulk/descriptions'>
            {title}
          </Link>
        </div>
      </>
    :
      <>
        <div>
          <div className={classes.title}>{title}</div>
        </div>
        <div style={{flex: 1}} />
        <Button variant='outlined' className={classes.button} component={Link} to='/account/services/bulk/descriptions'>{width === 'xs' ? '設定' : '設定する'}</Button>
      </>
    }
  </Cell>
}

