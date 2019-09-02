import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import DownIcon from '@material-ui/icons/KeyboardArrowDown'

import { loadProArticle, unload } from 'modules/article'
import Loading from 'components/Loading'
import OGPMeta from 'components/OGPMeta'
import WhiteBox from 'components/WhiteBox'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import QueryDialog from 'components/cards/QueryDialog'
import ArticleContents from 'components/wp/ArticleContents'
import LPButton from 'components/LPButton'
import RelatedPost from 'components/wp/RelatedPost'
import Footer from 'components/Footer'
import SelectService from 'components/SelectService'
import { webOrigin, GAEvent } from '@smooosy/config'
const { pageType } = GAEvent


@withStyles(theme => ({
  root: {
    background: theme.palette.common.white,
  },
  header: {
    zIndex: 5,
    position: 'relative',
    background: theme.palette.grey[100],
  },
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: theme.palette.grey[500],
  },
  mask: {
    background: 'rgba(0, 0, 0, .5)',
  },
  coverText: {
    height: '100%',
    padding: '100px 15px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: '70px 15px 15px',
    },
  },
  title: {
    width: '100%',
    maxWidth: 1200,
    textAlign: 'center',
    fontSize: 34,
    color: theme.palette.common.white,
    zIndex: 10,
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(0, 0, 0, .5)',
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  coverBox: {
    width: '100%',
    display: 'flex',
  },
  coverSelect: {
    flex: 1,
    padding: '5px 15px',
    fontSize: 20,
    maxWidth: 300,
    minWidth: 270,
    borderRadius: '2px 0 0 2px',
    borderWidth: '1px 0 1px 1px',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[400],
    [theme.breakpoints.down('xs')]: {
      minWidth: 160,
      height: 40,
      padding: '3px 8px',
      fontSize: 15,
    },
  },
  coverButton: {
    borderRadius: '0 2px 2px 0',
    height: 50,
    fontSize: 22,
    padding: '4px 16px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      height: 40,
      padding: '4px 12px',
    },
  },
  main: {
    paddingTop: '40px',
    [theme.breakpoints.down('xs')]: {
      paddingTop: '20px',
    },
  },
  breadcrumbs: {
    marginBottom: 10,
  },
  container: {
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  article: {
    flex: 1,
  },
  content: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  side: {
    width: 300,
    marginLeft: 20,
    marginBottom: 20,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      margin: '20px 0',
    },
  },
  sticky: {
    marginTop: 20,
    borderRadius: 5,
    border: `1px solid ${theme.palette.grey[300]}`,
    position: 'sticky',
    top: 20,
    [theme.breakpoints.down('sm')]: {
      position: 'relative',
      border: 0,
      display: 'flex',
    },
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  part: {
    flex: 1,
    padding: 10,
  },
  sideTitle: {
    fontSize: 20,
    margin: '10px 0',
  },
  boxes: {
    display: 'flex',
    justifyContent: 'center',
    margin: '10px 0',
  },
  zero: {
    marginLeft: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
  select: {
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    padding: 10,
    cursor: 'pointer',
  },
  serviceName: {
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  button: {
    display: 'block',
    margin: '10px auto',
  },
  other: {
    display: 'block',
    fontSize: 14,
    marginBottom: 20,
  },
}))
@connect(
  state => ({
    wpInfo: state.article.wpInfo,
  }),
  { loadProArticle, unload }
)
export default class ProArticlePage extends React.Component {
  constructor(props) {
    super(props)
    const selected = props.wpInfo && props.wpInfo.services ? [props.wpInfo.services[0]] : []
    const profiles = props.wpInfo && props.wpInfo.profiles ? props.wpInfo.profiles : []
    // プロメディアでプロフィールは 1 人しか紹介されない前提で、簡略化のため profiles[0] を利用する
    // 複数プロが出てくるようであれば、「プロに相談する」ボタンごとに切り替えられるようにする
    const requestServices = profiles.length > 0 ? profiles[0].services : selected
    this.state = {
      open: false,
      selected,
      requestServices,
      ...this.getRequestState(requestServices),
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.props.unload()
      this.load()
    }
    if (prevProps.location.search !== this.props.location.search) {
      this.setState(this.getRequestState(this.state.requestServices))
    }
  }

  load = () => {
    const { id, category: key } = this.props.match.params
    this.props.loadProArticle(id, key)
      .then(res => res.wpInfo)
      .then(wpInfo => this.setState({
        selected: [wpInfo.services[0]],
        requestServices: wpInfo.profiles && wpInfo.profiles.length > 0 ? wpInfo.profiles[0].services : [wpInfo.services[0]],
      }))
      .catch(() => this.props.history.replace(`/pro/${key}`))
  }

  componentDidMount() {
    if (Object.keys(this.props.wpInfo).length === 0) {
      this.load()
    }
    window.hj && window.hj('trigger', 'ProArticlePage')
  }

  componentWillUnmount() {
    this.props.unload()
  }

  onClose= selected => {
    if (selected && selected.length > 0) {
      this.setState({selected, open: false})
    } else {
      this.setState({open: false})
    }
  }

  getRequestState = (requestServices) => {
    const state = qs.parse(this.props.location.search.slice(1))
    const requestDialogOpen = !!(state && state.modal)
    // 対応サービスが１つの時は QueryDialog をすぐに出す
    const requestServiceKey = requestServices && requestServices.length === 1 ? requestServices[0].key : null
    return {
      requestDialogOpen: requestDialogOpen && !requestServiceKey,
      requestServiceKey: requestDialogOpen && requestServiceKey,
      requestSpecialSent: state ? state.sp : null,
      requestZip: state ? state.zip : null,
    }
  }

  onRequestServiceSelect = (service) => {
    this.setState({
      requestDialogOpen: false,
      requestServiceKey: service.key,
    })
  }

  onRequestDialogClose = () => {
    this.props.history.replace(this.props.location.pathname.replace(/^\/amp\//, '/'))
    this.setState({
      requestDialogOpen: false,
    })
  }

  onRequestQueryDialogClose = () => {
    this.props.history.replace(this.props.location.pathname.replace(/^\/amp\//, '/'))
    this.setState({
      requestServiceKey: null,
    })
  }

  onSelect = selected => {
    if (selected.length === 0) return
    let query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    selected = selected.map(s => s.id)
    query = qs.stringify({...query, selected})
    this.props.history.push(`/signup-pro?${query}`)
  }

  render() {
    const { wpInfo, classes } = this.props
    const { selected } = this.state
    if (Object.keys(wpInfo).length === 0) return  <Loading />

    const { title, author, authorId, published, modified, doms, shareImage, meta, relatedPosts, category, services } = wpInfo

    const currentPath = this.props.location.pathname.replace(/^\/amp\//, '/')
    const currentURL = webOrigin + currentPath

    const breadcrumbs = [{path: '/', text: 'トップ'}]
    breadcrumbs.push({path: '/pro-media', text: 'プロフェッショナルズ'})
    breadcrumbs.push({path: `/pro/${category.key}/media`, text: `${category.name}の記事一覧`})
    breadcrumbs.push({text: title})

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <OGPMeta
          title={title}
          description={meta.yoast_wpseo_metadesc || ''}
          url={currentURL}
          shareImage={shareImage}
          width={1200}
          height={630}
          twitterCard='summary_large_image'
          structuredDataType='Article'
          published={published}
          modified={modified}
          author={author}
        />
        <div className={classes.header}>
          <img layout='fill' className={[classes.fullSize, classes.cover].join(' ')} src={shareImage} />
          <div className={[classes.fullSize, classes.mask].join(' ')} />
          <div className={classes.coverText}>
            <h1 className={classes.title}>
              {title}
            </h1>
            <WhiteBox title={`無料で${category.name}の仕事を受け取る`}>
              <div className={classes.coverBox}>
                <div className={[classes.select, classes.coverSelect].join(' ')} onClick={() => this.setState({open: true})}>
                  <div className={classes.serviceName}>{selected[0] ? selected[0].name : ''}</div>
                  <DownIcon />
                </div>
                <Button variant='contained' color='primary' className={classes.coverButton} onClick={() => this.onSelect(selected)}>
                  次へ
                </Button>
              </div>
            </WhiteBox>
          </div>
        </div>
        <Container maxWidth={1200} className={classes.main}>
          <div className={classes.container}>
            <div className={classes.article}>
              <div className={classes.breadcrumbs}>
                <BreadCrumb breads={breadcrumbs} />
              </div>
              <div className={classes.content}>
                <ArticleContents
                  doms={doms}
                  author={author}
                  authorId={authorId}
                  published={published}
                  modified={modified}
                  serviceOrCategory={category}
                  pageType={pageType.ProArticlePage}
                  currentPath={currentPath}
                />
              </div>
            </div>
            <aside className={classes.side}>
              <div className={classes.sticky}>
                <div className={classes.part}>
                  <h3 className={classes.sideTitle}>SMOOOSYについて</h3>
                  <div>SMOOOSYは掲載料・成約料・紹介料無料で利用できる集客サービスです。</div>
                  <div className={classes.boxes}>
                    <img layout='fixed' width={120} height={120} src='/images/lp_list.png' />
                    <img layout='fixed' width={140} height={120} src='/images/lp_0yen.png' className={classes.zero} />
                  </div>
                </div>
                <div className={classes.part}>
                  <h3 className={classes.sideTitle}>さっそく事業者登録する</h3>
                  <div className={classes.label}>サービスを選択してください</div>
                  <div className={classes.select} onClick={() => this.setState({open: true})}>
                    <div className={classes.serviceName}>{selected[0] ? selected[0].name : ''}</div>
                    <DownIcon />
                  </div>
                  <LPButton fullWidth onClick={() => this.onSelect(selected)} className={classes.button}>
                    無料で依頼を受け取る
                  </LPButton>
                  <Link to='/pro' className={classes.other}>{category.name}以外のお仕事はこちら</Link>
                  <h3 className={classes.sideTitle}>詳しく知りたい</h3>
                  <LPButton fullWidth onClick={() => this.props.history.push(`/pro/${category.key}`)} color='secondary' className={classes.button}>
                    仕組みや料金を確認する
                  </LPButton>
                </div>
              </div>
            </aside>
          </div>
        </Container>
        <Container gradient maxWidth={1200}>
          <h3 className={classes.subtitle}>関連記事</h3>
          <RelatedPost posts={relatedPosts} />
        </Container>
        <Footer />
        <SelectService
          multi
          open={this.state.open}
          services={services}
          title='提供できるサービスを選んでください'
          label='次へ'
          onClose={this.onClose}
          onSelect={this.onSelect}
        />
        <SelectService open={!!this.state.requestDialogOpen} services={this.state.requestServices} title='どのようなサービスをお探しですか？' label='次へ' onClose={this.onRequestDialogClose} onSelect={this.onRequestServiceSelect} />
        <QueryDialog open={!!this.state.requestServiceKey} serviceKey={this.state.requestServiceKey} specialSent={this.state.requestSpecialSent} initialZip={this.state.requestZip} onClose={this.onRequestQueryDialogClose} />
      </div>
    )
  }
}
