import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'

import { load } from 'modules/formattedRequest'
import CoverImages from 'components/CoverImages'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import SubHeader from 'components/SubHeader'
import LPButton from 'components/LPButton'
import RequestPaper from 'components/RequestPaper'
import MeetPapers from 'components/MeetPapers'
import Chats from 'components/Chats'
import QueryDialog from 'components/cards/QueryDialog'
import Footer from 'components/Footer'
import { prefectures, imageSizes } from '@smooosy/config'

@withWidth()
@withTheme
@connect(
  state => ({
    request: state.formattedRequest.formattedRequest,
  }),
  { load }
)
export default class RequestPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.load(this.props.match.params.id).then(({formattedRequest}) => {
      if (this.props.match.params.key !== formattedRequest.service.key) {
        this.props.history.replace(`/services/${formattedRequest.service.key}/requests/${formattedRequest.id}`)
      } else if (formattedRequest.service.deleted) {
        this.props.history.replace(`/services/${formattedRequest.service.key}`)
      }
    })
  }

  render() {
    const { request, width, theme } = this.props

    const { common } = theme.palette

    if (!request) return null

    const styles = {
      root: {
      },
      header: {
        height: '100%',
        color: common.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
      paper: {
        width: width === 'xs' ? '100%' : '90%',
        margin: '20px auto 20px',
      },
    }

    const breads = [
      {path: '/', text: 'SMOOOSYトップ'},
    ]
    if (request.category) {
      breads.push({path: `/t/${request.category.key}`, text: request.category.name})
    }
    breads.push({path: `/services/${request.service.key}`, text: request.service.name})
    if (request.prefecture) {
      const prefKey = prefectures[request.prefecture]
      breads.push({path: `/services/${request.service.key}/${prefKey}`, text: request.prefecture + 'の' + request.service.name})
    }
    breads.push({text: `${request.address ? `${request.address.replace(request.prefecture, '')}の`: ''}${request.customer}様の依頼`})

    let featureIndex = null
    let featureMeet
    for (let i in request.meets) {
      if (request.meets[i].feature) {
        featureIndex = i
        featureMeet = request.meets[i]
        break
      }
    }
    if (featureIndex !== null) {
      request.meets.splice(featureIndex, 1)

      const newIndex = Math.ceil(request.meets.length / 2)
      featureMeet.chats = featureMeet.chats.map(c => ({
        ...c,
        text: c.text.replace(/UUU/g, request.customer).replace(/PPP/g, String.fromCharCode(65 + newIndex)),
      }))
      request.meets.splice(newIndex, 0, featureMeet)
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>{request.searchTitle}</title>
          <meta name='description' content='TODO' />
        </Helmet>
        <CoverImages
          paddingTop
          height={280}
          firstImage={request.service.image + imageSizes.cover}
          alpha='0.5'
        >
          <h1 style={styles.header}>
            <div style={{margin: 10, fontSize: width === 'xs' ? 28 : 32, fontWeight: 'bold'}}>
              {request.address ? `${request.address}の`: ''}{request.customer}様の依頼
            </div>
            <div style={{margin: 10, fontSize: width === 'xs' ? 18 : 22}}>
              {request.service.name}
            </div>
          </h1>
        </CoverImages>
        <Container gradient>
          <BreadCrumb breads={breads} />

          <SubHeader>依頼した内容</SubHeader>
          <RequestPaper noName request={request} style={styles.paper} />
          <div style={{textAlign: 'center'}}>
            <LPButton onClick={() => this.setState({open: true})}>似た内容で依頼する</LPButton>
          </div>
        </Container>
        <Container gradient>
          <SubHeader>{request.meets.length}人の{request.service.providerName}から見積もりがきました</SubHeader>
          <MeetPapers meets={request.meets} averagePrice={request.averagePrice} service={request.service} customer={request.customer} />
        </Container>
        {featureMeet &&
          <Container gradient>
            <SubHeader>{request.service.providerName}とのチャット</SubHeader>
            <div style={{maxWidth: 600, margin: '0 auto', padding: 10}}>
              <Chats chats={featureMeet.chats} />
            </div>
            <div style={{textAlign: 'center'}}>
              <LPButton onClick={() => this.setState({open: true})}>同じような依頼をする</LPButton>
            </div>
          </Container>
        }
        <Footer />
        <QueryDialog open={!!this.state.open} serviceKey={request.service.key} onClose={() => this.setState({open: false})} />
      </div>
    )
  }
}
