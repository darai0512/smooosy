import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import withWidth from '@material-ui/core/withWidth'
import withTheme from '@material-ui/core/styles/withTheme'

import { loadAll as loadCategories } from 'modules/category'
import { loadAll as loadServices } from 'modules/service'
import ServiceValues from 'components/ServiceValues'
import SectionTab from 'components/SectionTab'
import Container from 'components/Container'
import SubHeader from 'components/SubHeader'
import ServicePapers from 'components/ServicePapers'
import CategoryList from 'components/CategoryList'
import Footer from 'components/Footer'
import { sections, webOrigin, imageSizes } from '@smooosy/config'


@withWidth()
@connect(
  state => ({
    categories: state.category.categories,
    services: state.service.services.filter(s => s.enabled && s.imageUpdatedAt),
  }),
  { loadCategories, loadServices }
)
@withTheme
export default class SectionPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = { section: null }
  }

  componentDidMount() {
    this.load(this.props.match.params.key)
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.key !== prevProps.match.params.key) this.load(this.props.match.params.key)
  }

  load(key) {
    let section = null
    for (let sec of sections) {
      if (sec.key === key) {
        section = sec
        break
      }
    }
    if (!section) this.props.history.push('/')

    this.props.loadCategories()
      .then(categories => this.props.loadServices(categories.filter(c => c.parent === section.key).map(c => c.name)))
      .then(({services}) => {
        const coverService = services.find(s => s.enabled && s.imageUpdatedAt)
        this.setState({section, coverService})
      })
  }

  render() {
    const { section, coverService } = this.state
    const { categories, services, width, theme } = this.props
    const { common, grey } = theme.palette

    if (!services.length || !section) return null

    const cover = coverService ? coverService.image + imageSizes.cover : '/images/top.jpg'

    const styles = {
      column: {
        columnBreakInside: 'avoid',
        pageBreakInside: 'avoid',
        marginBottom: 20,
      },
      header: {
        padding: width === 'xs' ? '50px 8px 80px' : '60px 15px 110px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: `url(${cover}) center/cover`,
        position: 'relative',
        color: common.white,
      },
      title: {
        margin: width === 'xs' ? '30px 20px' : '40px 20px',
        textAlign: 'center',
        color: common.white,
        textShadow: '1px 1px 8px rgba(0, 0, 0, .8)',
        zIndex: 10,
      },
      service: {
        fontSize: 14,
        marginBottom: 10,
      },
      wrap: {
        columnCount: {xs: 1, sm: 3, md: 3, lg: 4, xl: 4}[width],
        columnGap: 30,
        margin: width === 'xs' ? '20px 30px' : '0 0 30px',
      },
    }

    return (
      <div>
        <Helmet>
          <title>{`${section.name}のサービス一覧`}</title>
          <meta name='description' content={`${section.name}カテゴリの人気サービス。${categories.filter(c => c.parent === section.key).map(sub => sub.name).join('、')}など、様々なこだわりを叶えてくれるプロが待っています。`}/>
          <link rel='canonical' href={`${webOrigin}/sections/${section.key}`} />
        </Helmet>
        <div style={styles.header}>
          <div style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0, 0, 0, .5)'}} />
          <div style={styles.title}>
            <div style={{fontSize: width === 'xs' ? 40 : 50, fontWeight: 'bold'}}>{section.name}</div>
            <div style={{fontSize: width === 'xs' ? 18 : 22, margin: 10}}>
              <div>{section.description}</div>
            </div>
          </div>
          <ServiceValues />
        </div>
        <SectionTab showMoreTab section={section} linkFunction={cat => `/sections/${cat.key}`} />
        {services.filter(s => s.enabled && s.imageUpdatedAt).length > 0 &&
          <Container gradient>
            <SubHeader>{section.name}カテゴリの人気サービス</SubHeader>
            <ServicePapers
              wrap
              services={services.slice(0, 12)}
              linkFunction={s => `/services/${s.key}`}
              hoverText={s => `近くの${s.providerName}を探す`}
            />
          </Container>
        }
        <Container gradient>
          <SubHeader>{section.name}カテゴリのサービス一覧</SubHeader>
          <div style={styles.wrap}>
            {categories.filter(c => c.parent === section.key).map(c => {
              const ss = services.filter(s => s.tags.includes(c.name))
              if (!ss.length) return
              return (
                <div key={c.id} style={styles.column}>
                  <Link to={`/t/${c.key}`}><h3 style={{marginBottom: 10, color: common.black}}>{c.name}</h3></Link>
                  {ss.map(s => <div key={s._id} style={styles.service}><Link to={`/services/${s.key}`} style={{color: grey[600]}}>{s.name}</Link></div>)}
                </div>
              )
            })}
          </div>
        </Container>
        {services.filter(s => !s.enabled).length > 0 &&
          <Container gradient>
            <SubHeader>プロとして登録する</SubHeader>
            <CategoryList categories={categories.filter(c => c.parent === section.key)} linkFunction={category => `/pro/${category.key}`} />
          </Container>
        }
        <Footer />
      </div>
    )
  }
}
