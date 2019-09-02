import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'

import { sppFetch, loadEstimate, sppUnload } from 'modules/service'
import OGPMeta from 'components/OGPMeta'
import ZipBox from 'components/ZipBox'
import LPButton from 'components/LPButton'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import SelectQuery from 'components/SelectQuery'
import PricePaper from 'components/PricePaper'
import ArticleContents from 'components/wp/ArticleContents'
import QueryDialog from 'components/cards/QueryDialog'
import LinkList from 'components/LinkList'
import Footer from 'components/Footer'
import Loading from 'components/Loading'
import { webOrigin, imageSizes, GAEvent } from '@smooosy/config'
const { category: {dialogOpen}, pageType } = GAEvent

@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  header: {
    position: 'relative',
    background: theme.palette.grey[100],
    overflow: 'hidden',
  },
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cover: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    background: theme.palette.grey[500],
  },
  mask: {
    background: 'rgba(0, 0, 0, .6)',
  },
  title: {
    textAlign: 'center',
    paddingTop: 60,
    fontSize: 36,
    color: theme.palette.common.white,
    zIndex: 10,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    [theme.breakpoints.down('xs')]: {
      paddingTop: 0,
      fontSize: 26,
    },
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    color: theme.palette.common.white,
    zIndex: 10,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  coverText: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
    [theme.breakpoints.down('xs')]: {
      padding: '70px 15px 10px',
      alignItems: 'stretch',
    },
  },
  Q: {
    fontSize: 28,
  },
  question: {
    fontSize: 18,
  },
  questions: {
    marginTop: 0,
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
    },
  },
  zip: {
    display: 'flex',
    justifyContent: 'center',
  },
  zipInput: {
    fontSize: 18,
    height: 40,
  },
  zipButton: {
    fontSize: 16,
    height: 40,
  },
  zipIcon: {
    marginLeft: 0,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.common.white,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    [theme.breakpoints.down('xs')]: {
      padding: '20px 0',
    },
  },
  side: {
    marginTop: 0,
    maxWidth: 300,
    zIndex: 0,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginTop: 10,
      maxWidth: 'inherit',
    },
  },
  result: {
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      marginRight: 0,
    },
  },
  waitingFrame: {
    width: 540,
    height: 230,
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: '40vw',
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waiting: {
    width: 80,
    height: 80,
  },
  priceChartPaperTitle: {
    padding: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  pricePaper: {
    width: 540,
    height: 230,
    backgroundColor: 'transparent',
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: '40vw',
    },
  },
  questionScroll: {
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: 225,
  },
  openButton: {
    background: '#fb6458',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    margin: 0,
    minWidth: 'auto',
    width: '100%',
    '&:hover': {
      background: '#db4438',
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  list: {
    padding: '5px 0',
  },
  button: {
    marginRight: 10,
  },
  empty: {
    width: 600,
    padding: 40,
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  content: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paddingText: {
    paddingLeft: '0%',
    paddingRight: '0%',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: '5%',
      paddingRight: '5%',
    },
  },
  desktop: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}))
@connect(
  state => ({
    service: state.service.sppInfo.service,
    priceEstimate: state.service.sppInfo.priceEstimate,
    wpInfo: state.service.sppInfo.wpInfo,
    relatedServices: state.service.sppInfo.relatedServices,
  }),
  { sppFetch, loadEstimate, sppUnload }
)
export default class ServicePricePage extends React.Component {

  constructor(props) {
    super(props)
    const state = props.location.state || qs.parse(props.location.search.slice(1))
    this.state = {
      open: !!(state && state.modal),
      specialSent: state ? state.sp : null,
      zip: state ? state.zip : null,
      questions: [],
      dialogInfo: {},
      loading: false,
    }
    this.state.questions = this.setQuestions(props.service)
  }

  componentDidMount() {
    if (!this.props.service) { // already have data by SSR
      this.load()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.search !== this.props.location.search) {
      const state = qs.parse(this.props.location.search.slice(1))
      this.setState({
        open: !!(state && state.modal),
        specialSent: state ? state.sp : null,
        zip: state ? state.zip : null,
      })
    }
  }

  componentWillUnmount() {
    this.props.sppUnload()
  }

  load = () => {
    const key = this.props.match.params.key

    this.props.sppFetch(key)
      .then(res => res.sppInfo)
      .then(sppInfo => this.setState({questions: this.setQuestions(sppInfo.service)}))
      .catch(() => this.props.history.replace(`/services/${key}`))
  }

  setQuestions = (service) => {
    if (!service) return []
    const { queries, priceEstimateQueries } = service
    const questions = []
    for (let query of queries) {
      const peq = priceEstimateQueries.find(pe => pe.query === query.id)
      if (!peq) continue
      query.answers = query.options.filter(o => peq.options.includes(o.id))
      questions.push(query)
    }
    return questions
  }

  loadPriceEstimate = (key, questions = []) => {
    questions = questions.map(q => ({
      id: q.id,
      answers: q.answers.filter(a => a.checked).map(a => a.id),
    }))
    this.setState({loading: true})
    // API読み込み時間と500msの遅い方でresolve
    Promise.all([
      this.props.loadEstimate({key, questions}),
      new Promise(resolve => setTimeout(resolve, 500)),
    ])
      .then(() => this.setState({loading: false}))
  }

  onChange = (questionId, answers) => {
    const { questions, dialogInfo } = this.state
    const question = questions.find(q => q.id === questionId)
    question.answers = answers
    dialogInfo[questionId] = answers
    this.setState({questions, dialogInfo})
    this.loadPriceEstimate(this.props.match.params.key, questions)
  }

  onZipEnter = (zip, pos) => {
    const { service } = this.props
    const currentPath = this.props.location.pathname

    if (service.matchMoreEnabled) {
      this.props.history.push(`/instant-results?serviceId=${service.id}&zip=${zip ? zip : ''}`)
    } else {
      this.setState({zip})
      this.props.history.replace(`${currentPath}?modal=true${zip ? `&zip=${zip}` : ''}&source=zipbox&pos=${pos}`)
    }
  }

  onClickLPButton = () => {
    const { service } = this.props
    const currentPath = this.props.location.pathname
    if (service.matchMoreEnabled) {
      this.props.history.push(`/instant-results?serviceId=${service.id}`)
    } else {
      this.props.history.replace(`${currentPath}?modal=true`)
    }
  }

  render () {
    const { service, priceEstimate, wpInfo, relatedServices, classes } = this.props
    const { questions, loading } = this.state
    if (!priceEstimate) {
      return <Loading />
    }

    const {
      title,
      meta,
      published,
      modified,
      doms,
    } = wpInfo

    const currentPath = this.props.location.pathname
    const currentURL = webOrigin + currentPath
    const pageMetaDescription = meta.yoast_wpseo_metadesc || ''
    const breadcrumbs = [{path: '/', text: 'SMOOOSYトップ'}]
    if (service.category) breadcrumbs.push({path: `/t/${service.category.key}`, text: service.category.name})
    breadcrumbs.push({path: `/services/${service.key}`, text: service.name})
    breadcrumbs.push({text: `${service.name}の参考価格`})
    const matchMorePath = service.matchMoreEnabled ? `/instant-results?serviceId=${service.id}` : null

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <OGPMeta
          title={title}
          description={pageMetaDescription}
          url={currentURL}
          shareImage={service.image + imageSizes.ogp}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='LocalBusiness'
          published={published}
          modified={modified}
          service={service.key}
        />
        <div className={classes.header}>
          <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={service.image + imageSizes.cover} />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={[classes.coverText].join(' ')}>
            <h1 className={classes.title}>{service.name}の価格を知ろう</h1>
            <h2 className={classes.subtitle}>SMOOOSYでの数万件の見積もりデータから算出しています</h2>
            <div className={classes.row}>
              <div className={classes.result}>
                <PricePaper loading={loading} price={priceEstimate} className={classes.pricePaper} />
              </div>
              <div className={classes.side}>
                <div className={classes.questions}>
                  {questions.map(q =>
                    <div key={q.id}>
                      <h4 className={classes.Q}>Q. <span className={classes.question}>{q.text}</span></h4>
                      <SelectQuery
                        query={q}
                        answers={q.answers}
                        onChange={answers => this.onChange(q.id, answers)}
                        className={classes.questionScroll}
                      />
                    </div>
                  )}
                  <LPButton className={classes.openButton} onClick={this.onClickLPButton}>実際に見積もりをもらう</LPButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Container maxWidth={1024}>
          <div className={classes.breadcrumbs}>
            <BreadCrumb breads={breadcrumbs} />
          </div>
          <div className={classes.content}>
            <ArticleContents
              doms={doms}
              published={published}
              modified={modified}
              serviceOrCategory={wpInfo.service}
              pageType={pageType.ServicePricePage}
              currentPath={currentPath}
              matchMorePath={matchMorePath}
            />
          </div>
        </Container>
        <div className={classes.zip}>
          <ZipBox
            title={`無料で${service.providerName}から見積もりをもらおう！`}
            gaEvent={{
              category: dialogOpen,
              action: pageType.ServicePricePage,
              label: service.key,
            }}
            currentPath={matchMorePath || currentPath}
            onEnter={zip => this.onZipEnter(zip, 'cover')}
          />
        </div>
        <Container>
          <aside className={classes.paddingText}>
            <h3>関連サービス一覧</h3>
            <LinkList list={relatedServices} linkFunction={s => `/services/${s.key}`} />
          </aside>
        </Container>
        <Footer />
        <QueryDialog
          noSimilarSelect
          open={!!this.state.open}
          serviceKey={service.key}
          dialogInfo={this.state.dialogInfo}
          onClose={() => this.props.history.replace(currentPath)}
          specialSent={this.state.specialSent}
          initialZip={this.state.zip}
        />
      </div>
    )
  }
}
