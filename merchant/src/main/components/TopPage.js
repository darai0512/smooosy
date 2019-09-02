import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import ReactGA from 'react-ga'
import qs from 'qs'

import { Button, List, ListItem, ListItemIcon, ListItemText, Typography, NoSsr } from '@material-ui/core'
import Collapse from '@material-ui/core/Collapse'
import { amber } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera'
import FilterVintageIcon from '@material-ui/icons/FilterVintage'
import AttachMoneyIcon from '@material-ui/icons/AttachMoney'
import BusinessIcon from '@material-ui/icons/Business'
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount'

import { withApiClient } from 'contexts/apiClient'
import AccentContainer from 'components/AccentContainer'
// import PagerPapers from 'components/PagerPapers'
import ConfirmDialog from 'components/ConfirmDialog'
import QueryDialog from 'components/cards/QueryDialog'
import Footer from 'components/Footer'
import CountDown from 'components/CountDown'
import OGPMeta from 'components/OGPMeta'
import { loadAll as loadServices } from 'modules/service'
import { read as readNotice } from 'modules/notice'
import { sendGAEvent } from 'components/GAEventTracker'
import { imageSizes, popularCategories, GAEvent } from '@smooosy/config'
import Loading from 'components/Loading'
const { category: {dialogOpen}, pageType } = GAEvent

@withApiClient
@withStyles(theme => ({
  loading: {
    margin: 40,
  },
  background: {
    background: theme.palette.common.white,
  },
  mobilePadding: {
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 80,
    },
  },
  padding: {
    paddingBottom: 80,
  },
  articlePaperDescription: {
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  articlePaperBox: {
    [theme.breakpoints.down('xs')]: {
      height: 310,
    },
  },
}))
@connect(
  state => {
    const tagServices = {}
    for (let s of state.service.allServices) {
      if (!s.enabled) continue
      if (!tagServices[s.tags[0]]) {
        tagServices[s.tags[0]] = []
      }
      tagServices[s.tags[0]].push(s)
    }
    // todo
    console.log(tagServices)
    tagServices['エステ'] = [];
    return {
      notices: state.notice.notices.filter(n => !n.checked),
      tagServices,
      authFailed: state.auth.failed,
    }
  },
  { readNotice, loadServices }
)
export default class TopPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      mounted: false,
    }
  }

  componentDidMount() {
    this.props.loadServices()
      .then(() => this.setState({mounted: true}))
  }

  handleReadNotice = (id, link) => {
    this.props.readNotice(id)
    this.props.history.push(link)
  }

  handleTouchTapService = (service) => {
    if (service.enabled) {
      sendGAEvent(dialogOpen, pageType.TopPage, service.key)

      if (service.matchMoreEnabled) {
        this.props.history.push(`/instant-results?serviceId=${service._id}`)
      } else {
        this.setState({openService: service.key})
      }
    } else {
      this.setState({notyet: service})
      ReactGA.modalview(`/search-service/nopro/${service.key}`)
    }
  }

  goSignupPro = (selected) => {
    const query = qs.stringify({selected: [selected._id]})
    this.props.history.push(`/signup-pro?${query}`)
  }

  search = (query) => {
    return this.props.apiClient
      .get('/api/search/services', { params: { query } })
      .then(res => res.data.data)
  }

  onClickService = (service) => {
    this.props.history.push(`/services/${service.key}`)
  }

  render() {
    const { mounted } = this.state
    const { notices, tagServices, authFailed, classes } = this.props

    const title = 'SMOOOSY - あの人気店のドタキャンをお得にあなたへ'

    return (
      <div>
        <Helmet titleTemplate=''>
          <title>{title}</title>
        </Helmet>
        <OGPMeta
          title={title}
          description='あの人気店の『ドタキャン』の時間枠を、お店のお近くの会員限定であなただけに『お得に』『今すぐ』こっそりご提供！'
          url='https://smooosy.com'
          shareImage='https://smooosy.com/images/icon.png'
          width={320}
          height={320}
          twitterCard='summary'
          structuredDataType='WebSite'
        />
        <NoticeList notices={notices} handleReadNotice={this.handleReadNotice} />
        <FirstView authFailed={authFailed} search={this.search} handleTouchTapService={this.handleTouchTapService} />
        <AccentContainer title='使い方' className={classes.background} >
          <About search={this.search} handleTouchTapService={this.handleTouchTapService} />
        </AccentContainer>
        <NoSsr>
          <AccentContainer title='人気のカテゴリ' className={[classes.background, classes.mobilePadding].join(' ')} >
            <div className={classes.loading}><Loading /></div>
          </AccentContainer>
        </NoSsr>
        <Footer />
      </div>
    )
  }
}

const NoticeList = withStyles(theme => ({
  task: {
    display: 'flex',
    alignItems: 'center',
  },
  newRequest: {
    background: theme.palette.red[50],
  },
  noticeContent: {
    width: '100%',
    padding: 0,
  },
  noticeIcon: {
    marginLeft: 10,
    color: amber[800],
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  centerPadding: {
    flex: 1,
  },
  confirm: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  main: {
    marginTop: 0,
  },
}))(({notices, handleReadNotice, classes}) => (
  <>
   {notices.filter(t => t.type === 'newRequest').slice(0, 3).map(n =>
      <ListItem button divider key={n._id} className={classes.newRequest} onClick={() => handleReadNotice(n._id, n.link)}>
        <AccentContainer className={classes.noticeContent} mainClassName={classes.main}>
          <div className={classes.task}>
            <Typography variant='body1'>未返信: {n.description}</Typography>
            <Typography variant='body1' className={classes.noticeIcon}>
              <CountDown start={new Date(n.createdAt)} prefix='残り' />
            </Typography>
            <div className={classes.centerPadding} />
            <Typography variant='body1' className={classes.confirm}>確認する</Typography>
            <ChevronRightIcon />
          </div>
        </AccentContainer>
      </ListItem>
    )}
  </>
))

const FirstView = withStyles(theme => ({
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'nowrap',
    width: '100%',
    height: 500,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
      height: 'auto',
    },
  },
  firstText: {
    display: 'flex',
    justifyContent: 'center',
    width: '50%',
    height: '100%',
    background: 'linear-gradient(120deg, #1A237E, #F63355)',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  cover: {
    width: '50%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#F63355',
    backgroundImage: `url('/images/relax.png')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPositionX: 'center',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      backgroundColor: '#F63355',
      backgroundImage: `url('/images/relax.png')`, // todo mobile size
      height: 160,
    },
  },
  title: {
    margin: '20px 12px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '30px 0px',
    maxWidth: 400,
    [theme.breakpoints.down('xs')]: {
      margin: '20px 20px',
      padding: 0,
    },
  },
  titleImage: {
    width: '100%',
  },
  sub: {
    flex: 1,
    color: theme.palette.common.white,
    fontSize: 42,
    fontWeight: 'bold',
    maxWidth: 400,
    [theme.breakpoints.down('xs')]: {
      fontSize: 32,
      maxWidth: 300,
    },
  },
  subImage: {
    width: '100%',
  },
  phrase: {
    flex: 1,
    color: theme.palette.common.white,
    lineHeight: 1.8,
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      marginTop: 10,
      marginBottom: 10,
    },
  },
  lineWrap: {
    position: 'relative',
    textAlign: 'center',
  },
  searchIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    top: 16,
    right: 10,
    color: theme.palette.grey[700],
  },
}))(({authFailed, search, handleTouchTapService, classes}) => {

  const headerClass = [classes.header]
  if (authFailed) {
    headerClass.push(classes.loggedOut)
  } else {
    headerClass.push(classes.loggedIn)
  }

  return (
    <div className={headerClass.join(' ')}>
      <div className={classes.wrapper}>
        <div className={classes.firstText} >
          <div className={classes.title}>
            <h1 className={classes.sub}>
              <div>あの人気店のドタキャンをお得にあなたへ</div>
            </h1>
            <div className={classes.phrase}>
              <div>近くの人気店のドタキャン枠を、あなただけに『お得に』『今すぐ』こっそりご提供！</div>
            </div>
            <div>
              <div className={classes.lineWrap}>
                <a href="http://nav.cx/ciclc7k"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" style={{height:'36', border:'0'}}/></a>
              </div>
            </div>
          </div>
        </div>
        <div className={classes.cover} />
      </div>
    </div>
  )
})


const About = withStyles(theme => ({
  pc: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  mobile: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inherit',
    },
  },
  step: {
    color: theme.palette.common.white,
    fontSize: '24px',
    background: '#F63355',
    borderRadius: '50%',
    width: 48,
    height: 48,
    minWidth: 48,
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'table-cell',
  },
  wrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 40,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 0,
    },
  },
  last: {
    marginBottom: 0,
  },
  wrapReverse: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginBottom: 40,
  },
  container: {
    display: 'flex',
    paddingLeft: 10,
    paddingRight: 10,
  },
  description: {
    width: 400,
    marginLeft: 20,
    marginRight: 20,
    lineHeight: 2,
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      marginLeft: 10,
    },
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 10,
      fontSize: 18,
      marginTop: 5,
    },
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
      marginBottom: 20,
    },
  },
  stepLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepLineEnd: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 48,
  },
  vLine: {
    width: 4,
    height: '100%',
    background: '#F63355',
  },
  vLineEnd: {
    width: 24,
    height: 24,
    background: '#F63355',
    borderRadius: '50%',
  },
  searchBox: {
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
  },
  searchHeader: {
    display: 'flex',
    marginBottom: 10,
  },
  searchSub: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    top: 10,
    right: 20,
    color: theme.palette.grey[700],
  },
}))(({search, handleTouchTapService, classes}) => {

  const steps1 = {title: 'LINEで友だち追加'}
  const steps2 = {title: 'タイムラインからサービスを選択'}
  const steps3 = {title: '内容を確認して予約、お店へGO !'}

  return (
    <>
      <section className={classes.pc}>
        <div className={classes.wrap}>
          <div className={classes.container}>
            <div><div className={classes.step}>1</div></div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps1.title}</h3>
              <div>
                アプリダウンロード不要！<br/>
                LINE内ですぐに利用できます♪
              </div>
            </div>
          </div>
          <div className={classes.image}>
            <PhoneImage src='/images/logo_as_line_friend.png' />
          </div>
        </div>
        <div className={classes.wrapReverse}>
          <div className={classes.container}>
            <div><div className={classes.step}>2</div></div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps2.title}</h3>
              <div>
あなたの近くの、今すぐ予約できるお店が一覧に。<br/>
通常よりお安くなってます♪
              </div>
            </div>
          </div>
          <div className={classes.image}>
            <PhoneImage src='/images/timeline.png' />
          </div>
        </div>
        <div className={[classes.wrap, classes.last].join(' ')}>
          <div className={classes.container}>
            <div><div className={classes.step}>3</div></div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps3.title}</h3>
              <div>
                詳細や時間をチェック。<br/>
                事前決済を選べばお財布いらず。<br/>
                場所は地図でナビゲート、さぁお店へ向かいましょう。
              </div>
            </div>
          </div>
          <div className={classes.image}>
            <PhoneImage src='/images/booking.png' />
          </div>
        </div>
      </section>
      <section className={classes.mobile}>
        <div className={classes.wrap}>
          <div className={classes.container}>
            <div className={classes.stepLine}>
              <div><div className={classes.step}>1</div></div>
              <div className={classes.vLine} />
            </div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps1.title}</h3>
              <div>アプリダウンロード不要！LINE内ですぐに利用できます♪</div>
              <div className={classes.imageContainer}>
                <PhoneImage src='/images/logo_as_line_friend.png' />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.wrap}>
          <div className={classes.container}>
            <div className={classes.stepLine}>
              <div><div className={classes.step}>2</div></div>
              <div className={classes.vLine} />
            </div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps2.title}</h3>
              <div>あなたの近くにある、今すぐ予約できるお店が一覧に。通常よりお安くなってます♪</div>
              <div className={classes.imageContainer}>
                <PhoneImage src='/images/timeline.png' />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.wrap}>
          <div className={classes.container}>
            <div className={classes.stepLine}>
              <div><div className={classes.step}>3</div></div>
              <div className={classes.vLine} />
            </div>
            <div className={classes.description}>
              <h3 className={classes.header}>{steps3.title}</h3>
              <div>詳細や時間をチェック。事前決済ならお財布いらず。場所は地図上でナビゲート、さぁお店へ向かいましょう。</div>
              <div className={classes.imageContainer}>
                <PhoneImage src='/images/booking.png' />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.wrap}>
          <div className={classes.searchBox}>
            <div className={classes.searchHeader}>
              <div className={classes.stepLineEnd}>
                <div className={classes.vLineEnd}/>
              </div>
              <div className={classes.searchSub}>まずは友だち登録 !</div>
            </div>
            <div className={classes.lineWrap}>
              <a href="http://nav.cx/ciclc7k"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="友だち追加" style={{height:'36', border:'0'}}/></a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
})

const PhoneImage = withStyles((theme) => ({
  smartphoneInner: {
    backgroundImage: `url('/images/iphone.png');`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    width: 214,
    height: 431,
    margin: '0 auto',
  },
  smartphoneScreenShots: {
    position: 'relative',
    top: 48,
    paddingLeft: 13,
    width: '100%',
    height: 332,
    margin: '0 auto',
  },
  smartphoneScreenShot: {
    position: 'absolute',
    maxWidth: '100%',
    maxHeight: '100%',
    border: `1px solid ${theme.palette.grey[700]}`,
  },
}))(({src, classes}) => (
  <div className={classes.smartphoneInner}>
    <div className={classes.smartphoneScreenShots}>
      <img className={classes.smartphoneScreenShot} src={`${src}`} />
    </div>
  </div>
))

@withStyles(theme => ({
  pc: {
    display: 'inherit',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  selector: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: 1024,
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      maxWidth: 768,
    },
  },
  mobile: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inherit',
      borderTop: `1px solid ${theme.palette.grey[300]}`,
    },
  },
  categoryList: {
    marginRight: 20,
  },
  list: {
    width: 180,
    listStyle: 'none',
    height: '100%',
    marginLeft: 0,
    marginTop: 10,
    background: '#dfedc0',
    borderRight: '1px solid #F63355',
  },
  selectCategory: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    background: '#F63355',
    color: theme.palette.common.white,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    color: '#F63355',
    cursor: 'pointer',
  },
  serviceList: {
    display: 'flex',
    flex: 1,
    flexWrap: 'wrap',
  },
  service: {
    width: '33%',
    padding: 10,
    cursor: 'pointer',
    [theme.breakpoints.down('sm')]: {
      width: '50%',
    },
  },
  serviceName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  serviceImage: {
    width: '100%',
    maxHeight: 168,
    objectFit: 'cover',
    borderRadius: 8,
    display: 'block',
  },
  cover: {
    position: 'relative',
  },
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, .12)',
    borderRadius: 8,
    padding: 10,
  },
  maskHover: {
    opacity: 0,
    '&:hover': {
      opacity: 1,
    },
    '&:hover > .hoverButton': {
      background: theme.palette.primary.main,
    },
  },
  paper: {
    height: '100%',
  },
  serviceButton: {
    maxWidth: '100%',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  action: {
    margin: 5,
    width: '100%',
    maxWidth: 320,
    height: 48,
  },
  actionButton: {
    width: '100%',
    height: '100%',
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 2,
  },
  mobileListItem: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  mobileListText: {
    padding: 0,
  },
  mobileSubListItem: {
    background: theme.palette.grey[100],
    paddingLeft: 56,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  last: {
    borderBottom: 'none',
  },
}))
class PopularService extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      category: null,
      opens: {},
    }

    this.categoryIcons = {
      'エステ': <PhotoCameraIcon />,
      'ネイル': <FilterVintageIcon />,
      'ヘアサロン': <AttachMoneyIcon />,
      'まつげ': <BusinessIcon />,
      'リラグゼーション': <SupervisorAccountIcon />,
    }
  }

  select = (category) => {
    this.setState({category})
  }

  toggle = (category) => {
    const { opens } = this.state
    opens[category.title] = !opens[category.title]
    this.setState({opens})
  }

  render () {
    const { popularCategories, tagServices, onClickService, classes } = this.props
    const { opens } = this.state

    let category = this.state.category
    const popularServices = []
    if (!category && Object.keys(tagServices).length) {
      for (let cat of popularCategories) {
        popularServices.push({category: cat.title, services: this.props.tagServices[cat.title]})
      }
      if (!category) {
        category = popularCategories[0]
      }
    }

    return (
      <>
        <div className={classes.pc}>
          <div className={classes.selector}>
            <div className={classes.categoryList}>
              <ul className={classes.list}>
                {popularCategories.map(cat =>
                  <div key={cat.key}>
                    {category && category.key === cat.key ?
                      <div className={classes.selectCategory} >
                        <li onClick={() => this.select(cat)}>{cat.title}</li>
                        <ChevronRightIcon />
                      </div>
                    :
                      <li className={classes.category} onClick={() => this.select(cat)}>{cat.title}</li>
                    }
                  </div>
                )}
              </ul>
            </div>
            <div className={classes.serviceList}>
              {category && tagServices[category.title].map((s, idx) =>
                <Link key={s.key} to={`/services/${s.key}`} className={classes.service}>
                  {idx < 6 ?
                    <>
                      <div className={classes.cover}>
                        <img src={s.image + imageSizes.r320} className={classes.serviceImage} />
                        <div className={[classes.mask, classes.maskHover].join(' ')}>
                          <Button variant='contained' color='primary' className={[classes.serviceButton, 'hoverButton'].join(' ')}>{`近くの${s.providerName}を探す`}</Button>
                        </div>
                      </div>
                      <div className={classes.serviceName}>{s.name}</div>
                    </>
                  : <div className={classes.serviceName}>{s.name}</div>
                  }
                </Link>
              )}
            </div>
          </div>
          <div className={classes.actions}>
            <Link className={classes.action} to='/services'>
              <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>すべて見る</Button>
            </Link>
          </div>
        </div>
        <div className={classes.mobile}>
          {popularCategories.map(category => ({category, services: tagServices[category.title]})).map(item =>
            <List
              key={item.category.title}
              component='nav'
              disablePadding
            >
              <ListItem button onClick={() => this.toggle(item.category)} className={classes.mobileListItem}>
                <ListItemIcon>{this.categoryIcons[item.category.title]}</ListItemIcon>
                <ListItemText primary={item.category.title} className={classes.mobileListText} />
                {opens[item.category.title] ? <ExpandMoreIcon /> : <ChevronRightIcon /> }
              </ListItem>
              <Collapse in={!!opens[item.category.title]} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                  {item.services.map(s =>
                    <ListItem key={s.key} button className={classes.mobileSubListItem} onClick={() => onClickService(s)}>
                      {s.name}
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </List>
          )}
        </div>
      </>
    )
  }
}

