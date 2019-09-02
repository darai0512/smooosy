import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { loadCampaigns, applyCampaign } from 'modules/point'
import { Paper, Button, LinearProgress } from '@material-ui/core'
import ActionCheckCircle from '@material-ui/icons/CheckCircle'
import ActionCardGiftcard from '@material-ui/icons/CardGiftcard'
import ToggleCheckBox from '@material-ui/icons/CheckBox'
import ToggleCheckBoxOutline from '@material-ui/icons/CheckBoxOutlineBlank'
import withWidth from '@material-ui/core/withWidth'
import AgreementLinks from 'components/AgreementLinks'
import ConfirmDialog from 'components/ConfirmDialog'
import { withStyles, withTheme } from '@material-ui/core/styles'
import { amber, red } from '@material-ui/core/colors'

@withWidth()
@withTheme
@withStyles(theme => ({
  campaign: {
    marginBottom: 20,
    background: theme.palette.common.white,
    padding: '10px 20px',
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  subheader: {
    fontWeight: 'bold',
    margin: '0 10px',
  },
  pointRate: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: '20px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  description: {
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  note: {
    fontSize: 12,
    color: theme.palette.grey[600],
    [theme.breakpoints.down('xs')]: {
      fontSize: 10,
    },
  },
  level: {
    flex: 1,
    fontSize: 16,
    color: theme.palette.common.black,
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    },
  },
  appliedLevel: {
    flex: 1,
    fontSize: 16,
    textDecoration: 'line-through',
    color: theme.palette.grey[500],
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    },
  },
  point: {
    fontSize: 24,
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      margin: '0 5px',
    },
  },
  red: {
    color: red[500],
  },
}))
@connect(
  state => ({
    campaigns: state.point.campaigns,
  }),
  { loadCampaigns, applyCampaign }
)
export default class PointCampaign extends React.Component {

  constructor(props) {
    super(props)
    this.state = {}
    this.scrollRefs = {}
  }

  componentDidMount() {
    const { anchor, scrollTo } = this.props
    this.props.loadCampaigns().then(() => {
      if (!scrollTo || !anchor || !this.scrollRefs[anchor]) return
      scrollTo(this.scrollRefs[anchor])
    })
  }

  apply = (key) => {
    this.setState({submitting: key})
    this.props.applyCampaign(key).then(() => {
      this.setState({submitting: null, appliedModal: true})
    })
    .catch((err) => {
      if (this.props.onError) {
        this.props.onError(err)
      }
      this.setState({submitting: null})
    })
  }

  closeConfirmDialog = () => {
    this.setState({appliedModal: false})
  }

  render() {
    const { submitting } = this.state
    const { campaigns, showProgress, width, classes, theme } = this.props
    const { grey, secondary } = theme.palette

    let currentPoint = 0
    let totalPoint = 0
    if (campaigns && campaigns.length > 0) {
      const sumReducer = (total, val) => total + val
      currentPoint = campaigns.map(c => c.point * (c.level ? c.applied : c.status === 'done' ? 1 : 0)).reduce(sumReducer)
      totalPoint = campaigns.map(c => c.point * (c.level ? c.level.length : 1)).reduce(sumReducer)
    }

    return (
      <div>
        <div style={{padding: width === 'xs' ? 10 : 20}}>
          {!!showProgress &&
            <div className={classes.pointRate}>
              <div style={{flex: 1}}>
                <div className={classes.title}>無料ポイント獲得率</div>
                <div className={classes.description}>タスクを消化することで最大<b>{totalPoint}</b>ポイント獲得できます</div>
                <p className={classes.note}>※本キャンペーンは予告なく変更・終了することがあります。</p>
              </div>
              <div style={{width: width === 'xs' ? '100%' : '50%', marginLeft: width === 'xs' ? 0 : 20}}>
                <div style={{display: 'flex', fontWeight: 'bold', alignItems: 'center'}}>
                  <div style={{flex: 1}} />
                  <div className={classes.point}>{currentPoint} / {totalPoint}</div>
                  <div>pt</div>
                </div>
                <LinearProgress variant='determinate' value={currentPoint} style={{height: 10, borderRadius: 5}}/>
              </div>
            </div>
          }
          {campaigns.map(c =>
            c.status === 'done' ?
              <div ref={(e) => this.scrollRefs[c.key] = e}>
                <Paper key={c.key} className={classes.campaign} style={{background: grey[200], padding: width === 'xs' ? 10 : '10px 20px'}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <ActionCheckCircle style={{color: secondary.main}} />
                    <div className={classes.subheader}>{c.title}</div>
                    <div style={{flex: 1}} />
                  </div>
                </Paper>
              </div>
            : ['open', 'clear'].includes(c.status) ?
              <div ref={(e) => this.scrollRefs[c.key] = e}>
                <Paper key={c.key} className={classes.campaign} >
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <ActionCardGiftcard style={{color: amber[800]}} />
                    <div className={classes.subheader}>{c.title}</div>
                    <div style={{flex: 1}} />
                    <div className={classes.point}>{c.point}</div>
                    <div>pt</div>
                    {c.level && <div className={classes.point}>{` × ${c.level.length}`}</div>}
                  </div>
                  <div style={{margin: '10px 0 0'}}>
                    {c.link ? <Link to={c.link}>{c.body}</Link> : c.body}
                  </div>
                  {c.level &&
                    <div>
                      <div style={{margin: 10, maxHeight: 150, overflowY: 'auto'}}>
                        {c.level.map((l, i) =>
                          <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                            {i < c.applied ?
                              <ToggleCheckBox style={{color: grey[500]}} />
                            : i < c.clear ?
                              <ToggleCheckBox style={{color: secondary.main}} />
                            :
                              <ToggleCheckBoxOutline />
                            }
                            <div className={i < c.applied ? classes.appliedLevel : classes.level}>{l}</div>
                          </div>
                        )}
                      </div>
                      <div style={{textAlign: 'center', marginBottom: 10}}>{c.applied} / {c.level.length}</div>
                      <LinearProgress variant='determinate' style={{height: 5, borderRadius: 5}} value={c.applied / c.level.length * 100} />
                    </div>
                  }
                  {c.status === 'clear' &&
                    <div>
                      <AgreementLinks label='ポイントを受け取る' point={true} style={{marginBottom: 10}} />
                      <Button variant='contained'
                        color='primary'
                        style={{ width: '100%' }}
                        disabled={submitting === c.key}
                        onClick={() => this.apply(c.key)}
                      >
                      {submitting === c.key ? '処理中' : 'ポイントを受け取る'}
                      </Button>
                    </div>
                  }
                </Paper>
              </div>
            : null
          )}
        </div>
        <ConfirmDialog
          open={!!this.state.appliedModal}
          title='ポイントが付与されました！'
          alert={true}
          onSubmit={this.closeConfirmDialog}
          onClose={this.closeConfirmDialog}
        >
          獲得ポイントの利用期限は<a href='/account/points' target='_blank'>ポイントページ</a>で確認できます。
        </ConfirmDialog>
      </div>
    )
  }
}
