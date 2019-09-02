import React from 'react'
import { connect } from 'react-redux'
import { loadAllForPro as loadMeets } from 'modules/meet'
import { loadAll as loadProfiles } from 'modules/profile'
import { loadAllForProInsight as loadRequests } from 'modules/request'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import withWidth from '@material-ui/core/withWidth'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import PositionViewer from 'components/PositionViewer'

@withWidth()
@withTheme
@connect(
  null,
  { loadMeets, loadProfiles, loadRequests }
)
export default class PersonalInsight extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      profiles: [],
      meets: [],
      requests: [],
    }
  }

  componentDidMount() {
    this.props.loadMeets().then(res => this.setState({meets: res.meets}))
    this.props.loadProfiles().then(res => this.setState({profiles: res.profiles}))
    this.props.loadRequests().then(res => this.setState({requests: res.requestsForPro}))
  }

  render() {
    const { width, theme } = this.props
    const { profiles, meets, requests } = this.state
    const { grey, common, secondary } = theme.palette

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        padding: '20px 0',
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: width === 'xs' ? 'initial' : 700,
        margin: '0 auto',
      },
      block: {
        marginBottom: 40,
      },
      paper: {
        padding: width === 'xs' ? 10 : 20,
        marginBottom: width === 'xs' ? 10 : 30,
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
      },
      subtitle: {
        fontWeight: 'bold',
      },
      item: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        fontSize: width === 'xs' ? 14 : 16,
      },
      itemValue: {
        color: secondary.main,
        fontSize: 24,
      },
    }

    return (
        <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><ChevronLeftIcon /></Button>
                </Link>
              }
            </div>
            <div>統計情報</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <div style={styles.main}>
          <div style={styles.paper}>
            <div style={styles.subtitle}>アクティビティ</div>
            <div style={{display: 'flex'}}>
              <div style={styles.item}><div>受取り依頼</div><div style={styles.itemValue}>{requests.length}</div></div>
              <div style={styles.item}><div>送信見積もり</div><div style={styles.itemValue}>{meets.length}</div></div>
              <div style={styles.item}><div>雇われた</div><div style={styles.itemValue}>{meets.filter(m => m.hiredAt).length}</div></div>
              <div style={styles.item}><div>レビュー</div><div style={styles.itemValue}>{profiles.map(p => p.reviews.length).reduce((a, b) => a + b, 0)}</div></div>
            </div>
          </div>
          {profiles.map(p => {
            const meetsInThisProfile = meets.filter(m => m.profile === p.id)
            return (
              <div style={styles.paper} key={p.id}>
                <div style={styles.subtitle}>{p.name}</div>
                <div style={{display: 'flex', color: grey[600]}}>
                  <div style={styles.item}><div>送信見積もり</div><div style={styles.itemValue}>{meetsInThisProfile.length}</div></div>
                  <div style={styles.item}><div>未読チャット</div><div style={styles.itemValue}>{meetsInThisProfile.filter(m => m.chats.filter(c => !c.system && !c.read && c.user.id !== p.pro).length !== 0).length}</div></div>
                  <div style={styles.item}><div>レビュー</div><div style={styles.itemValue}>{p.reviews.length}</div></div>
                </div>
                <div style={{display: 'flex', marginTop: 10, flexDirection: width === 'xs' ? 'column' : 'row', alignItems: 'center'}}>
                  <PositionViewer value={0.4} theme={theme} outerWidth={width === 'xs' ? 300 : 400} style={{marginBottom: 10}} />
                  <div style={{flex: 1}} />
                  <Button variant='contained' color='primary' style={{height: 40, width: width === 'xs' ? '100%' : 105}} onClick={() => this.props.history.push(`/account/insights/${p.id}`)}>詳細</Button>
                </div>
              </div>
            )
          })}
        </div>
      </AutohideHeaderContainer>
    )
  }
}
