import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import qs from 'qs'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core'

import { withApiClient } from 'contexts/apiClient'
import { loadAll as loadServices } from 'modules/service'
import Loading from 'components/Loading'
import CoverImages from 'components/CoverImages'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import RequestInfo from 'components/RequestInfo'
import FAQForPro from 'components/FAQForPro'
import LPButton from 'components/LPButton'
import HowToModule from 'components/HowToModule'
import Footer from 'components/Footer'

const base64DecodeUnicode = (str) => {
  return decodeURIComponent(Array.from(atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

@withApiClient
@connect(
  state => ({
    authFailed: state.auth.failed,
  }),
  { loadServices }
)
@withWidth()
@withTheme
export default class NewRequestPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    const id = this.props.match.params.id
    let params
    if (id.match(/^[0-9a-f]{24}$/)) {
      params = { requestId: id }
    } else {
      const str = id.replace(/-/g, '+').replace(/_/g, '/')
      params = JSON.parse(base64DecodeUnicode(str))
    }

    this.props.apiClient
      .get(`/api/requests/${params.requestId}/new`)
      .then(res => res.data)
      .then(request => {
        this.setState({ request, params: {...params, selected: [request.service.id]}})
      })
      .catch(() => this.setState({request: null}))
    this.props.loadServices()
    window.hj && window.hj('trigger', 'signup_as_pro')
  }

  render() {
    const { theme, width, authFailed, history } = this.props
    const { request, params } = this.state
    const { common } = theme.palette

    if (request === undefined || !params.requestId) return <Loading />

    const styles = {
      mask: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      title: {
        margin: 20,
        textAlign: 'center',
        color: common.white,
        textShadow: '1px 1px 8px rgba(0, 0, 0, .8)',
      },
    }

    return (
      <div>
        <Helmet>
          <title>SMOOOSYで新しい顧客とつながろう</title>
        </Helmet>
        <CoverImages
          paddingTop
          height={width === 'xs' ? 280 : 320}
          firstImage={width === 'xs' ? '/images/pro-top-small.jpg' : '/images/pro-top.jpg'}
          alpha='0.5'
        >
          <div style={styles.mask}>
            <div style={styles.title}>
              <div style={{fontSize: width === 'xs' ? 32 : 45, fontWeight: 'bold'}}>SMOOOSYで新しい顧客とつながろう</div>
              <div style={{fontSize: width === 'xs' ? 13 : 18, margin: '10px 0'}}>
                <p>様々な顧客からの依頼を無料でお送りします。</p>
                <p>あとは依頼を選びメッセージを送るだけです。</p>
              </div>
            </div>
          </div>
        </CoverImages>
        {request ?
          <OpenRequest request={request} params={params} theme={theme} width={width} />
        :
          <ClosedRequest params={params} theme={theme} width={width} />
        }
        <ErrorRequest open={!authFailed} onClose={() => history.replace('/')} />
        <Container gradient>
          <SubHeader>SMOOOSYとは</SubHeader>
          <HowToModule />
        </Container>
        <Container gradient>
          <FAQForPro />
        </Container>
        <Footer />
      </div>
    )
  }
}

const ErrorRequest = (props) => {

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>ログイン済みエラー</DialogTitle>
      <DialogContent>
        <p>このページは表示できません。</p>
        <p>トップページに移動します</p>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='primary' component={Link} to={'/'}>OK</Button>
      </DialogActions>
    </Dialog>
  )
}


const ClosedRequest = ({params, theme, width}) => {
  const { common, grey } = theme.palette

  const styles = {
    info: {
      maxWidth: 700,
      margin: '0 auto',
      padding: '30px 20px',
      textAlign: 'center',
      background: common.white,
      borderColor: grey[300],
      borderStyle: 'solid',
      borderWidth: width === 'xs' ? '1px 0' : 1,
    },
  }

  const paramsWithoutRequest = {
    ...params,
    requestId: undefined,
  }

  return (
    <Container gradient>
      <SubHeader>詳しい依頼内容</SubHeader>
      <div style={styles.info}>
        <p>申し訳ありません、アクセス頂いた依頼はすでに成約いたしました。</p>
        <p>SMOOOSYにご登録いただくと、似たような案件を無料でご紹介いたします。</p>
      </div>
      <div style={{textAlign: 'center'}}>
        <LPButton component={Link} to={`/signup-pro-direct?${qs.stringify(paramsWithoutRequest)}`}>無料で登録する</LPButton>
      </div>
    </Container>
  )
}

const OpenRequest = ({request, params, theme, width}) => {
  const { grey } = theme.palette

  const styles = {
    info: {
      maxWidth: 700,
      margin: '0 auto',
      borderColor: grey[300],
      borderStyle: 'solid',
      borderWidth: width === 'xs' ? '1px 0' : 1,
    },
  }

  return (
    <Container gradient>
      <SubHeader>詳しい依頼内容</SubHeader>
      <div style={styles.info}>
        <RequestInfo
          forLead={
            <div style={{position: 'absolute', bottom: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.0), rgba(255,255,255,1.0))'}}>
              <div style={{position: 'absolute', bottom: 0, width: '100%'}}>
                <div style={{textAlign: 'center'}}>
                  <LPButton component={Link} to={`/signup-pro-direct?${qs.stringify(params)}`}>全部見る</LPButton>
                </div>
              </div>
            </div>
          }
          request={request}
          customer={request.customer}
          middleSpace={
            <div style={{textAlign: 'center'}}>
              <LPButton component={Link} to={`/signup-pro-direct?${qs.stringify(params)}`}>無料で応募する</LPButton>
            </div>
          }
        />
      </div>
    </Container>
  )
}
