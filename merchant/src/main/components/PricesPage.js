import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'

import { withApiClient } from 'contexts/apiClient'
import { loadAll } from 'modules/category'
import CoverImages from 'components/CoverImages'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import ServicePapers from 'components/ServicePapers'
import Footer from 'components/Footer'
import { popularCategories, sections } from '@smooosy/config'

@withApiClient
@withWidth()
@connect(
  state => ({
    categories: state.category.categories,
  }),
  { loadAll }
)
@withTheme
export default class PricesPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      services: [],
    }
  }

  componentDidMount() {
    this.props.loadAll()
    this.props.apiClient
      .get('/api/services/averagePrice')
      .catch(() => this.props.history.replace('/'))
      .then(res => this.setState({services: res.data}))
  }

  render () {

    const { categories, width, theme } = this.props
    const { secondary, common } = theme.palette

    const styles = {
      root: {
        background: common.white,
      },
      header: {
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
      categoryContent: {
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        padding: '10px 0 20px',
      },
      service: {
        display: 'flex',
        alignItems: 'center',
        margin: '0 10px 10px 10px',
        padding: 5,
        width: 300,
        fontSize: 14,
        cursor: 'pointer',
      },
      serviceName: {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      dummyService: {
        margin: '0 10px',
        padding: 5,
        width: 300,
      },
      subtitle: {
        width: width === 'xs' ? '90%' : '100%',
        margin: '0 auto',
        padding: width === 'xs' ? '20px 0 0' : '20px 40px 0',
        fontSize: width === 'xs' ? 18 : 22,
        fontWeight: 'bold',
      },
    }

    return (
      <div style={styles.root}>
        <Helmet>
          <title>各サービスの参考価格</title>
          <meta name='description' content='各サービスの参考価格。プロの応募実績から各サービスの参考価格を算出しています。参考価格を目安に見積もりを依頼しましょう。' />
        </Helmet>
        <CoverImages
          paddingTop
          height={width === 'xs' ? 280 : 320}
          firstImage={'/images/prices-top.jpg'}
          alpha='0.5'
        >
          <div style={styles.header}>
            <div style={styles.title}>
              <h1 style={{fontSize: width === 'xs' ? 32 : 45}}>各サービスの参考価格</h1>
              <div style={{fontSize: width === 'xs' ? 13 : 18, margin: '10px 0'}}>
                <p>プロの応募実績から各サービスの参考価格を算出しています。</p>
                <p>参考価格を目安に見積もりを依頼しましょう。</p>
              </div>
            </div>
          </div>
        </CoverImages>
        <Container gradient>
          <SubHeader>人気サービスの参考価格</SubHeader>
          {popularCategories.map(c =>
            <ServicePapers
              showPrice
              key={c.key}
              categoryKey={c.key}
              title={c.title}
              services={this.state.services.filter(s => c.title === s.tags[0])}
              linkFunction={s => `/prices/${s.key}`}
            />
          )}
        </Container>
        <Container gradient>
          <SubHeader>すべてのサービスの参考価格</SubHeader>
            {
              categories.length > 0 && sections.map(sec => {
                const categoryNames = categories.filter(c => c.parent === sec.key).map(c => c.name)
                const filteredServices = this.state.services.filter(s => s.tags.findIndex(t => categoryNames.includes(t)) !== -1)

                if (filteredServices.length === 0) return null

                return (
                  <div key={sec.key}>
                    <div style={styles.subtitle}>{sec.name}</div>
                    <div style={styles.categoryContent}>
                      {
                        filteredServices.map(s => {
                          return (
                            <div key={sec.name + s.id} style={styles.service} onClick={() => this.props.history.push(`/prices/${s.key}`)}>
                              <div style={styles.serviceName}>
                                <div style={{marginBottom: 4}}>{s.name}</div>
                                <div style={{
                                  fontSize: 14, borderRadius: 16, color: common.white, backgroundColor: secondary.main, padding: '4px 12px'}}>{s.price.toLocaleString()}円</div>
                              </div>
                            </div>
                          )
                        })
                      }
                      {[...Array(3)].map((_, i) => <div key={`dummy_${i}`} style={styles.dummyService} />)}
                    </div>
                  </div>
                )
              })
            }
        </Container>
        <Footer />
      </div>
    )
  }
}
