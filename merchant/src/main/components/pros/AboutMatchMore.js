import React from 'react'
import { withStyles } from '@material-ui/core'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import { indigo } from '@material-ui/core/colors'

import CampaignBanner from 'components/pros/CampaignBanner'

import { loadAll as loadProServices } from 'modules/proService'
import { update as updateUser } from 'modules/auth'

@withStyles(theme => ({
  root: {
    paddingTop: 110,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '70px 10px 10px',
    },
  },
  new: {
    textAlign: 'center',
    color: indigo[500],
  },
  head: {
    fontSize: 48,
    [theme.breakpoints.down('xs')]: {
      fontSize: 28,
    },
  },
  paper: {
    padding: 20,
    marginTop: 10,
    background: theme.palette.common.white,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
  },
  start: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 20,
    background: indigo[500],
    '&:hover': {
      background: indigo[700],
    },
  },
  bold: {
    fontWeight: 'bold',
    color: theme.palette.red[500],
  },
  campaign: {
    maxWidth: 700,
    width: '100%',
    marginBottom: 50,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 20,
    },
  },
}))
@connect(
  state => ({
    user: state.auth.user,
    proServices: state.proService.proServices,
  }),
  { updateUser, loadProServices }
)
export default class AboutMatchMore extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
    }
  }

  startMatchMore = () => {
    const next = this.props.user.isMatchMore ? '/setup-services/bulk/business-hour' : '/setup-services/bulk/introduction'
    this.props.updateUser({isMatchMore: true})
      .then(() => this.props.history.push(next))
  }

  componentDidMount() {
    this.props.loadProServices(true)
      .then(() => this.setState({loaded: true}))
  }

  render () {
    const { classes } = this.props
    const { loaded } = this.state

    return (
      <div className={classes.root}>
        <div className={classes.campaign}>
          <CampaignBanner />
        </div>
        <h1 className={classes.new}>NEW</h1>
        <h1 className={classes.head}>ご指名方式とは？</h1>
        <div className={classes.paper}>
          <div>
            <div>「依頼者があなたのプロフィールや価格を見て、あなたを指名して連絡する」方式です！</div>
            <ol>
              <li>寝ている間に<span className={classes.bold}>自動で集客！</span>応募する手間が省けます</li>
              <li><span className={classes.bold}>高確度！</span>依頼者からあなたがご指名される方式です</li>
              <li><span className={classes.bold}>かんたん！</span>仕事条件や価格のパターンを、15分で設定するだけ</li>
            </ol>
            <div>依頼は今後、ご指名方式で行われますので、今すぐ設定を。</div>
          </div>
        </div>
        <Button className={classes.start} disabled={!loaded} size='medium' variant='contained' color='primary' onClick={this.startMatchMore}>ご指名方式を設定する</Button>
      </div>
    )
  }
}