import React from 'react'
import qs from 'qs'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { Button } from '@material-ui/core'
import { ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core'
import { withTheme, withStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { loadAll } from 'modules/formattedRequest'
import { loadAll as loadKeywords } from 'modules/keyword'
import CoverImages from 'components/CoverImages'
import Container from 'components/Container'
import BreadCrumb from 'components/BreadCrumb'
import RequestCard from 'components/RequestCard'
import Pagination from 'components/Pagination'
import Loading from 'components/Loading'
import renderTextInput from 'components/form/renderTextInput'
import Footer from 'components/Footer'
import { searchWords, imageSizes } from '@smooosy/config'

/*
 * リクエストパターン
 *
 * - /search-requests => パラメータのみで絞り込み
 * - /services/[key]/requests => サービスとパラメータで絞り込み
 * - /services/[key]/path/[path] => サービスとキーワードとパラメータで絞り込み
 *
 * パラメータ
 *
 * - location
 * - search
 * - page
 *
 */

@reduxForm({
  form: 'search',
})
@connect(
  state => ({
    requests: state.formattedRequest.info.requests || [],
    service: state.formattedRequest.info.service,
    services: state.formattedRequest.info.services,
    total: state.formattedRequest.info.total,
    keyword: state.formattedRequest.info.keyword,
    keywords: state.keyword.keywords,
  }),
  { loadAll, loadKeywords }
)
@withWidth()
@withTheme
export default class RequestSearchPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      option: {
        page: 1,
      },
    }
  }

  componentDidMount() {
    this.search(this.props)
    this.props.loadKeywords()
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.search === prevProps.location.search &&
      this.props.location.pathname === prevProps.location.pathname) return

    this.search(this.props)
  }

  onSubmit = (option) => {
    const url = this.linkFunction(option)
    this.props.history.push(url)
  }

  linkFunction = option => {
    let url = ''
    if (option.key) {
      url += `/services/${option.key}`
      if (option.path) {
        url += `/path/${option.path}`
      } else {
        url += '/requests'
      }
    } else {
      url += '/search-requests'
    }

    const query = qs.stringify({
      query: option.query,
      location: option.location,
      page: option.page,
    })
    if (query) url += `?${query}`

    return url
  }

  search = (props) => {
    const { key, path, query, location, page } = {
      ...qs.parse(props.location.search.slice(1)),
      ...props.match.params,
    }
    const option = { key, path, query, location, page }

    if (option.page) option.page = parseInt(option.page)
    this.setState({loaded: false})
    this.props.loadAll(option).then(({info}) => {
      if (info.service && info.service.deleted) {
        return this.props.history.replace(`/services/${info.service.key}`)
      }
      this.setState({loaded: true, option})
      this.props.initialize({
        query: option.query,
        location: option.location,
      })
    })
  }

  render() {
    const { requests, service, services, total, keyword, keywords, handleSubmit, width, theme } = this.props
    const { loaded, option } = this.state
    const { query, location, page } = option
    const currentPath = this.props.match.params.path
    const { common, grey } = theme.palette

    if (!loaded) {
      return <Loading />
    }

    const styles = {
      header: {
        height: '100%',
        color: common.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: width === 'xs' ? 20 : 30,
      },
      content: {
        width: width === 'xs' ? '100%' : '90%',
        maxWidth: 1200,
        margin: '20px auto',
      },
      row: {
        display: 'flex',
        flexDirection: width === 'xs' ? 'column' : 'row-reverse',
      },
      subtitle: {
        borderWidth: width === 'xs' ? '1px 0 0' : '1px 1px 0',
        borderStyle: 'solid',
        borderColor: grey[300],
        background: grey[50],
        padding: '5px 10px',
        fontSize: 18,
        fontWeight: 'bold',
      },
      menu: {
        marginRight: width === 'xs' ? 0 : 20,
        width: width === 'xs' ? '100%' : 260,
      },
      main: {
        flex: 1,
        minWidth: 0,
        marginBottom: 20,
      },
      card: {
        marginBottom: 10,
      },
      box: {
        borderWidth: width === 'xs' ? '1px 0' : 1,
        borderStyle: 'solid',
        borderColor: grey[300],
        background: common.white,
        padding: 16,
        marginBottom: 30,
      },
    }

    const title = keyword && keyword.title ? keyword.title :
      service ? `${service.name}の見積もり一覧` :
      query ? `「${query}${location ? ` × ${location}` : ''}」の見積もり一覧` :
      'SMOOOSYでの見積もり一覧'
    const cover = requests[0] ? requests[0].service.image + imageSizes.cover : '/images/top.jpg'

    const paths = currentPath ? currentPath.split(',') : []
    const breadcrumbs = service && currentPath ? [
      {path: '/', text: 'トップ'},
      {path: `/t/${service.category.key}`, text: service.category.name},
      {path: `/services/${service.key}`, text: service.name},
      {path: `/services/${service.key}/requests`, text: '見積もり一覧'},
      ...paths.map((p, i) => i < paths.length - 1 ? {
        path: `/services/${service.key}/path/${paths.slice(0, i + 1).join(',')}`,
        text: p,
      } : {
        text: p,
      }),
    ] : service ? [
      {path: '/', text: 'トップ'},
      {path: `/t/${service.category.key}`, text: service.category.name},
      {path: `/services/${service.key}`, text: service.name},
      {text: '見積もり一覧'},
    ] : query ? [
      {path: '/', text: 'トップ'},
      {path: '/search-requests', text: '見積もり一覧'},
      {text: service ? service.name : `${query}${location ? ` × ${location}` : ''}`},
    ] : [
      {path: '/', text: 'トップ'},
      {text: '見積もり一覧'},
    ]

    if (service) {
      for (let s of services) {
        if (service.id === s._id) {
          service.count = s.count
          break
        }
      }
    }

    return (
      <div>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <CoverImages paddingTop height={200} firstImage={cover} alpha='0.5'>
          <div style={styles.header}>{title}</div>
        </CoverImages>
        <Container>
          <BreadCrumb breads={breadcrumbs} style={{marginBottom: 20, fontSize: 13}} />
          <div style={styles.row}>
            <div style={styles.main}>
              {requests.length > 0 ?
                requests.map(r => <RequestCard key={r.id} request={r} style={styles.card} />)
              :
                <div style={{margin: 40, textAlign: 'center'}}>見つかりませんでした</div>
              }
              {requests.length > 0 &&
                <Pagination total={total} current={page} perpage={20} onChange={page => this.onSubmit({...option, page})} />
              }
            </div>
            <div style={styles.menu}>
              {service ? [
                <div key='subtitle' style={styles.subtitle}>絞り込み</div>,
                <div key='box' style={{...styles.box, fontSize: 12}}>
                  <KeywordTree
                    defaultExpanded
                    service={service}
                    keywords={keywords.filter(k => k.service === service.id)}
                    currentPath={currentPath}
                    active
                    total={total}
                    linkFunction={this.linkFunction}
                  />
                </div>,
              ] : [
                <div key='subtitle' style={styles.subtitle}>おすすめワード</div>,
                <div key='box' style={styles.box}>
                  {searchWords.map((query, i) =>
                    <div key={i} style={{fontSize: 12}}>
                      <Link to={this.linkFunction({query})}>{query}</Link>
                    </div>
                  )}
                </div>,
              ]}
              <div style={styles.subtitle}>サービスごとの見積もり</div>
              <div style={{...styles.box, fontSize: 12}}>
                {services.map((s, i) =>
                  <KeywordTree
                    key={i}
                    service={s}
                    keywords={keywords.filter(k => k.service === s._id)}
                    currentPath={currentPath}
                    active={service && service.id === s._id}
                    total={total}
                    linkFunction={this.linkFunction}
                  />
                )}
              </div>
              <div style={styles.subtitle}>検索</div>
              <div style={styles.box}>
                <form onSubmit={handleSubmit(this.onSubmit)}>
                  <Field name='query' label='キーワード' component={renderTextInput} />
                  <Field name='location' label='地域' component={renderTextInput} />
                  <Button variant='contained' color='primary' type='submit'>検索</Button>
                </form>
              </div>
            </div>
          </div>
        </Container>
        <Footer />
      </div>
    )
  }
}

const KeywordTree = withStyles(theme => ({
  panelRoot: {
    boxShadow: 'none',
    '&:before': {
      backgroundColor: '#fff',
    },
    '&$expanded': {
      margin: '0 0 10px',
    },
  },
  summaryContent: {
    width: '100%',
    margin: '2px 0',
    '&> :last-child': {
      width: '100%',
      paddingRight: 24,
    },
    '&$expanded': {
      margin: '2px 0',
    },
  },
  expanded: {},
  summaryExpandIcon: {
    height: 24,
    width: 24,
    right: 0,
  },
  indent: {
    marginRight: 6,
    color: theme.palette.grey[500],
  },
  disabled: {
    color: theme.palette.grey[500],
  },
}))(({defaultExpanded, service, keywords, currentPath, active, total, linkFunction, classes}) => {
  if (keywords.length === 0) {
    return (
      <div style={{margin: '2px 0'}}>
        {active && !currentPath ?
          <span>{service.name} ({total})</span>
        :
          <Link to={linkFunction({key: service.key})}>{service.name} ({service.count})</Link>
        }
      </div>
    )
  }

  const tree = {}
  for (let k of keywords) {
    const paths = k.path.split(',')
    for (let i = 0; i < paths.length; i++) {
      const path = paths.slice(0, i + 1).join(',')
      if (path in tree) {
        tree[path].count += k.count
      } else {
        tree[path] = {
          path,
          node: paths[i],
          depth: i,
          active: active && path === currentPath,
          count: k.count,
        }
      }
    }
  }

  return (
    <ExpansionPanel defaultExpanded={defaultExpanded} classes={{root: classes.panelRoot, expanded: classes.expanded}}>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon />}
        style={{padding: 0, minHeight: 'auto'}}
        classes={{content: classes.summaryContent, expanded: classes.expanded, expandIcon: classes.summaryExpandIcon}}
      >
        {active && !currentPath ?
          <span>{service.name} ({service.count})</span>
        :
          <Link to={linkFunction({key: service.key})}>{service.name} ({service.count})</Link>
        }
      </ExpansionPanelSummary>
      <ExpansionPanelDetails style={{display: 'block', padding: 0}}>
        {Object.values(tree).map((item, i) =>
          <div key={i} style={{marginLeft: item.depth * 13}}>
            <span className={classes.indent}>└</span>
            {item.count === 0 ?
              <span className={classes.disabled}>{item.node}</span>
            : item.active ?
              <span>{item.node} ({total})</span>
            :
              <Link to={linkFunction({key: service.key, path: item.path})}>{item.node} ({item.count})</Link>
            }
          </div>
        )}
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
})
