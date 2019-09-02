import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core'
import { withStyles, withTheme } from '@material-ui/core/styles'
import ArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'
import { withApiClient } from 'contexts/apiClient'
import { imageOrigin, webOrigin, company } from '@smooosy/config'

import Footer from 'components/Footer'
import AccentContainer from 'components/AccentContainer'
import MissionContainer from 'components/company/MissionContainer'
import Member from 'components/company/Member'
import NewsList from 'components/company/NewsList'
import PagerPapers from 'components/PagerPapers'
import ArticlePaper from 'components/ArticlePaper'
import { companyData } from 'lib/json-ld'

@withApiClient
@withTheme
@withStyles((theme) => ({
  root: {
    background: theme.palette.common.white,
  },
  wrap: {
    width: '90%',
    maxWidth: 960,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      padding: '0 10px',
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
  newsWrap: {
    width: '90%',
    maxWidth: 640,
    margin: '0 auto',
    padding: '0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  newsList: {
    margin: '20px 0 28px',
  },
  flexs: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  flex3: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0px 20px 10px',
    width: '33.3333%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  serviceWrap: {
    margin: '0px auto',
  },
  service: {
    display: 'flex',
    flexDirection: 'row-reverse',
    height: '100%',
    maxWidth: 740,
    margin: '10px auto 24px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      margin: '0px auto 24px auto',
    },
  },
  serviceInfo: {
    maxWidth: 400,
    textAlign: 'center',
    margin: 'auto 32px auto 64px',
    [theme.breakpoints.down('xs')]: {
      margin: '0px auto',
    },
  },
  serviceLogo: {
    width: 285,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: '15px 0px',
  },
  serviceDescription: {
    margin: '30px 0px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
  },
  smartphone: {
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      marginBottom: 40,
    },
  },
  smartphoneInner: {
    backgroundImage: `url('${imageOrigin}/static/company/iphone.png');`,
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

    '& img': {
      animationName: '$ssSlide',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
      animationDuration: '12s',
    },
    '& img:nth-of-type(1)': {
      animationDelay: '9s',
    },
    '& img:nth-of-type(2)': {
      animationDelay: '6s',
    },
    '& img:nth-of-type(3)': {
      animationDelay: '3s',
    },
    '& img:nth-of-type(4)': {
      animationDelay: '0s',
    },
  },
  '@keyframes ssSlide': {
    '0%': { opacity: 1 },
    '21%': { opacity: 1 },
    '25%': { opacity: 0 },
    '96%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  smartphoneScreenShot: {
    position: 'absolute',
    maxWidth: '100%',
    maxHeight: '100%',
    border: `1px solid ${theme.palette.grey[700]}`,
  },
  sliderWrap: {
    width: '100%',
    marginBottom: 64,
  },
  tableRoot: {
    margin: '0px auto',
    width: 'auto',
  },
  aboutWrap: {
    display: 'flex',
    width: '90%',
    maxWidth: 960,
    margin: '0 auto',
    padding: '0px 10px 40px',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      width: '100%',
      padding: '0 10px',
    },
  },
  map: {
    width: '50%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      marginTop: 30,
    },
  },
  hidePc: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  hideMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
}))
export default class CompanyPage extends React.PureComponent {

  anchors = {}

  state = {
    articles: [],
  }

  load = () => {
    this.props.apiClient
      .get(`${webOrigin}/api/news?per_page=3&page=1`)
      .then(({data}) => {
        this.setState({
          articles: data.posts,
        })
      })
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate() {
    this.scrollTo(this.props.location.hash.slice(1))
  }

  scrollTo = (anchor) => {
    const offsetTop = this.anchors[anchor] ? this.anchors[anchor].offsetTop : 0
    window.scrollTo(0, offsetTop)
  }

  render() {
    const { classes } = this.props
    const { articles } = this.state

    return (
      <div className={classes.root}>
        <Helmet>
          <title>会社概要</title>
        </Helmet>
        <Cover />
        <AccentContainer title='ニュース' containerRef={e => this.anchors.news = e}>
          <div className={classes.newsWrap}>
            <NewsList articles={articles} className={classes.newsList} />
            <div className={classes.actions}>
              <Link className={classes.action} to='/company/news'>
                <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>もっと見る</Button>
              </Link>
            </div>
          </div>
        </AccentContainer>
        <AccentContainer title='サービス' containerRef={e => this.anchors.service = e}>
          <div className={classes.wrap}>
            <div className={classes.service}>
              <div className={classes.serviceInfo}>
                <img className={classes.serviceLogo} src={`${webOrigin}/images/logo-top-black.png`} />
                <div className={classes.serviceTitle}>仕事の出会いを笑顔に</div>
                <div className={classes.serviceDescription}>
                  「この仕事、誰にお願いしたらいいんだろう…」
                  そんな疑問が家にも、会社にもあふれていませんか？
                  その疑問を、笑顔に変えられるプロは存在します。
                  「お願いしたい」「サポートしたい」
                  依頼者とプロの想いを かんたん、ぴったりにつなぐ、
                  <div>それが「SMOOOSY」です。</div>
                </div>
                <div className={classes.actions}>
                  <Link className={[classes.action, classes.hideMobile].join(' ')} to='/' target='_blank'>
                    <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>サイトを見る</Button>
                  </Link>
                </div>
              </div>
              <div className={classes.smartphone}>
                <div className={classes.smartphoneInner}>
                  <div className={classes.smartphoneScreenShots}>
                    {company.images.map((img, i) => <img key={i} className={classes.smartphoneScreenShot} src={`${imageOrigin}${img}`} />)}
                  </div>
                </div>
              </div>
              <div className={classes.actions}>
                <Link className={[classes.action, classes.hidePc].join(' ')} to='/' target='_blank'>
                  <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>サイトを見る</Button>
                </Link>
              </div>
            </div>
          </div>
        </AccentContainer>
        <MissionContainer containerRef={e => this.anchors.mission = e} />
        <AccentContainer title='事業者の声' containerRef={e => this.anchors.proArticles = e}>
          <div className={classes.sliderWrap}>
            <PagerPapers
              items={company.proArticles}
              Component={ArticlePaper}
            />
          </div>
          <div className={classes.wrap}>
            <div className={classes.actions}>
              <Link className={classes.action} to='/pro-media' target='_blank'>
                <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>もっと見る</Button>
              </Link>
            </div>
          </div>
        </AccentContainer>
        <AccentContainer title='経営チーム' containerRef={e => this.anchors.managers = e}>
          <div className={classes.wrap}>
            <div className={classes.flexs}>
              {company.managers.map((member, i) => <div key={`manager_${i}`} className={classes.flex3}><Member member={member} /></div>)}
            </div>
            <div className={classes.actions}>
              <Link className={classes.action} to='/company/recruit#members'>
                <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>もっと見る</Button>
              </Link>
              <Link className={classes.action} to='/company/recruit'>
                <Button size='large' color='primary' className={classes.actionButton}>採用情報はこちら<ArrowRightIcon /></Button>
              </Link>
            </div>
          </div>
        </AccentContainer>
        <AccentContainer title='会社概要' containerRef={e => this.anchors.about = e}>
          <div className={classes.aboutWrap}>
            <Table classes={{root: classes.tableRoot}}>
              <TableBody>
                <CustomRow title='会社名'>株式会社SMOOOSY</CustomRow>
                <CustomRow title='設立年月日'>2017年2月8日</CustomRow>
                <CustomRow title='資本金'>5億8100万円（資本準備金を含む）</CustomRow>
                <CustomRow title='代表者'>石川 彩子</CustomRow>
                <CustomRow title='事業内容'>
                  <a href='https://smooosy.com/' target='_blank' rel='noopener noreferrer'>「SMOOOSY」</a>
                  の開発と運営
                </CustomRow>
                <CustomRow title='従業員数'>42人（パートタイムを含む）</CustomRow>
                <CustomRow title='お問い合わせ'>info@smooosy.biz</CustomRow>
                <CustomRow title='所在地'>
                  <div>〒107-0052</div>
                  <div>東京都港区赤坂2-22-19南部坂アネックス601号室</div>
                </CustomRow>
              </TableBody>
            </Table>
            <div className={classes.map}>
              <iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6482.695754528055!2d139.73407583211244!3d35.66843532475304!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188b845d7515d3%3A0xf04ed59081afce57!2z44CSMTA3LTAwNTIg5p2x5Lqs6YO95riv5Yy66LWk5Z2C77yS5LiB55uu77yS77yS4oiS77yR77yZ!5e0!3m2!1sja!2sjp!4v1553922664785!5m2!1sja!2sjp' width='100%' height='320px' frameBorder={0} style={{border: 0}} allowFullScreen={true} />
            </div>
          </div>
        </AccentContainer>
        <Footer />
        <script type='application/ld+json'>{JSON.stringify({...companyData, '@context': 'http://schema.org'})}</script>
      </div>
    )
  }
}

let Cover = ({ classes }) => (
  <div className={classes.root}>
    <div className={classes.flex} />
    <div className={classes.box} />
    <div className={classes.cover}>
      <div className={classes.wrap}>
        <div className={classes.back} />
        <div className={classes.back2} />
        <div className={classes.decoration} />
        <img className={classes.icon} src={`${webOrigin}/images/icon.png`} />
        <img className={classes.mission} src={`${imageOrigin}/static/company/mission-left-white-pc.png`} />
        <img className={classes.missionSp} src={`${imageOrigin}/static/company/mission-left-white-m.png`} />
      </div>
    </div>
  </div>
)

const COVER_BASE_WIDTH_MD = 12
const COVER_BASE_WIDTH_SM = 9

Cover = withStyles((theme) => ({
  root: {
    display: 'flex',
    position: 'relative',
    height: 320,
    maxHeight: 320,
    [theme.breakpoints.down('sm')]: {
      height: 250,
      maxHeight: 250,
    },
    [theme.breakpoints.down('xs')]: {
      maxHeight: 560,
      height: '100vw',
    },
  },
  flex: {
    width: 'calc((100% - 1200px) / 2)',
  },
  box: {
    width: '22vw',
    background: theme.palette.common.white,
    display: 'flex',
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  icon: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(0%, -50%);',
    left: -(COVER_BASE_WIDTH_MD * 10),
    width: COVER_BASE_WIDTH_MD * 14.5,
    [theme.breakpoints.down('sm')]: {
      left: -(COVER_BASE_WIDTH_SM * 10),
      width: COVER_BASE_WIDTH_SM * 14.5,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  cover: {
    justifyContent: 'center',
    width: '78vw',
    position: 'relative',
    background: `linear-gradient(122deg, ${theme.palette.secondary.sub} 20%, ${theme.palette.secondary.main} 60%);`,
    [theme.breakpoints.down('xs')]: {
      overflowX: 'hidden',
      background: `linear-gradient(148deg, ${theme.palette.secondary.sub} 10%, ${theme.palette.secondary.main} 60%);`,
      width: '100vw',
      right: 0,
    },
  },
  wrap: {
    width: '100%',
    maxWidth: COVER_BASE_WIDTH_MD * 100,
    [theme.breakpoints.down('sm')]: {
      maxWidth: COVER_BASE_WIDTH_SM * 100,
    },
  },
  back: {
    width: 0,
    height: 0,
    position: 'absolute',
    '&::before': {
      content: '\'\'',
      position: 'absolute',
      borderTop: `${COVER_BASE_WIDTH_MD * 6.2}px solid transparent`,
      borderLeft: `${COVER_BASE_WIDTH_MD * 14.5}px solid ${theme.palette.common.white}`,
    },
    [theme.breakpoints.down('sm')]: {
      '&::before': {
        content: '\'\'',
        position: 'absolute',
        borderTop: `${COVER_BASE_WIDTH_SM * 6.8}px solid transparent`,
        borderLeft: `${COVER_BASE_WIDTH_SM * 14.5}px solid ${theme.palette.common.white}`,
      },
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  back2: {
    position: 'absolute',
    bottom: 0,
    background: theme.palette.common.white,
    width: COVER_BASE_WIDTH_MD * 6.25,
    height: COVER_BASE_WIDTH_MD * 20.5, // 少しずれるので調整
    '&::before': {
      content: '\'\'',
      position: 'absolute',
      bottom: 0,
      borderBottom: `${COVER_BASE_WIDTH_MD * 20.5}px solid transparent`,
      borderLeft: `${COVER_BASE_WIDTH_MD * 8.3}px solid ${theme.palette.common.white}`,
      marginLeft: `${COVER_BASE_WIDTH_MD * 6.2}px`,
    },
    [theme.breakpoints.down('sm')]: {
      width: COVER_BASE_WIDTH_SM * 6.25,
      height: COVER_BASE_WIDTH_SM * 21,
      '&::before': {
        content: '\'\'',
        position: 'absolute',
        bottom: 0,
        borderBottom: `${COVER_BASE_WIDTH_SM * 21}px solid transparent`,
        borderLeft: `${COVER_BASE_WIDTH_SM * 8.3}px solid ${theme.palette.common.white}`,
        marginLeft: `${COVER_BASE_WIDTH_SM * 6.2}px`,
      },
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  decoration: {
    position: 'absolute',
    backgroundRepeat: 'no-repeat',
    backgroundImage: `url('${webOrigin}/images/company/cover-decoration-pc.svg');`,
    backgroundSize: 'contain',
    height: '100%',
    width: COVER_BASE_WIDTH_MD * 67.3,
    left: COVER_BASE_WIDTH_MD * 12,
    [theme.breakpoints.down('sm')]: {
      width: COVER_BASE_WIDTH_SM * 67.3,
      left: COVER_BASE_WIDTH_SM * 12,
    },
    [theme.breakpoints.down('xs')]: {
      backgroundImage: `url('${webOrigin}/images/company/cover-decoration-m.svg');`,
      backgroundSize: 'cover',
      width: '100%',
      height: '100%',
      left: '12vw',
      maxWidth: 560,
      maxHeight: 560,
    },
  },
  mission: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(0%, -50%);',
    filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.32));',
    width: COVER_BASE_WIDTH_MD * 50,
    left: COVER_BASE_WIDTH_MD * 16,
    [theme.breakpoints.down('sm')]: {
      width: COVER_BASE_WIDTH_SM * 50,
      left: COVER_BASE_WIDTH_SM * 16,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  missionSp: {
    position: 'absolute',
    width: '75%',
    top: '24%',
    left: '4vw',
    maxWidth: 400,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
}))(Cover)

let CustomRow = ({ title, children, classes }) => (
  <TableRow className={classes.root}>
    <TableCell className={classes.title}>{title}</TableCell>
    <TableCell className={classes.body}>{children}</TableCell>
  </TableRow>
)

CustomRow = withStyles((theme) => ({
  root: {
    height: 'auto',
    fontSize: 16,
  },
  title: {
    padding: '5px 10px 5px 10px',
    border: 0,
    fontSize: 16,
    fontWeight: 'bold',
    verticalAlign: 'top',
    minWidth: 120,
    [theme.breakpoints.down('xs')]: {
      padding: '5px 0px 5px',
    },
  },
  body: {
    padding: '5px 10px',
    wordBreak: 'break-all',
    fontSize: 16,
    border: 0,
    [theme.breakpoints.down('xs')]: {
      padding: '5px 0px',
    },
  },
}))(CustomRow)

