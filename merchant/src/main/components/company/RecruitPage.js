import React from 'react'
import { Helmet } from 'react-helmet'
import { Button, withStyles } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { company, imageOrigin } from '@smooosy/config'

import Footer from 'components/Footer'
import AccentContainer from 'components/AccentContainer'
import MissionContainer from 'components/company/MissionContainer'
import Member from 'components/company/Member'

const ARTICLE_LIST = [
  {
    title: [
      '五大商社の安定を捨て',
      'ベンチャーのSMOOOSY',
      'に飛び込む',
    ],
    image: '/static/company/recruit1.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/post_articles/157443',
    position: 'topRight',
    textColor: 'black',
  },
  {
    title: [
      'Uber本社のエンジニア',
      '日本に移住しSMOOOSYへ',
    ],
    image: '/static/company/recruit2.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/post_articles/171908',
    position: 'bottomLeft',
    textColor: 'black',
  },
  {
    title: [
      '新卒エンジニア',
      '大手IT企業の内定を断って',
      'SMOOOSYを選んだ理由',
    ],
    image: '/static/company/recruit3.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/post_articles/164136',
    position: 'bottomRight',
    textColor: 'black',
  },
  {
    title: [
      '社内イベント',
    ],
    image: '/static/company/recruit4.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/feed',
    position: 'topRight',
    textColor: 'black',
  },
  {
    title: [
      'CEOからの',
      'メッセージ',
    ],
    image: '/static/company/recruit5.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/post_articles/155774',
    position: 'bottomRight',
    textColor: 'black',
  },
]

const JOB_CATEGORY_LIST = [
  {
    key: 'engineer',
    title: 'エンジニア',
    image: '/static/company/job-categories-engineer.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#engineer',
  },
  {
    key: 'designer',
    title: 'デザイナー',
    image: '/static/company/job-categories-designer.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#designer',
  },
  {
    key: 'director',
    title: '経営企画',
    image: '/static/company/job-categories-director.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#director',
  },
  {
    key: 'manager',
    title: 'プロダクトマネージャー',
    image: '/static/company/job-categories-manager.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#director',
  },
  {
    key: 'marketing',
    title: 'マーケター',
    image: '/static/company/job-categories-marketing.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#marketing',
  },
  {
    key: 'writer',
    title: 'ライター',
    image: '/static/company/job-categories-writer.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#writer',
  },
  {
    key: 'customer_success',
    title: 'カスタマーサクセス',
    image: '/static/company/job-categories-customer_success.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#corporate_staff',
  },
  {
    key: 'corporate_staff',
    title: 'コーポレート・スタッフ',
    image: '/static/company/job-categories-corporate_staff.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#corporate_staff',
  },
  {
    key: 'others',
    title: 'その他',
    image: '/static/company/job-categories-others.jpg',
    url: 'https://www.wantedly.com/companies/smooosy/projects#others',
  },
]

@withWidth()
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
      padding: '0 16px',
    },
  },
  footer: {
    marginTop: 40,
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
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    margin: '24px 0px',
    padding: 8,
    overflowX: 'hidden',
  },
  introMessageWrap: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0px auto',
    position: 'relative',
  },
  introMessage: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 21,
    lineHeight: '36px',
    marginBottom: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
      lineHeight: '30px',
      marginBottom: 32,
    },
  },
  blockMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  introDeco1: {
    position: 'absolute',
    left: -35,
    [theme.breakpoints.up('sm')]: {
      top: -5,
    },
    [theme.breakpoints.down('xs')]: {
      bottom: 32,
    },
  },
  introDeco2: {
    position: 'absolute',
    top: -5,
    right: -24,
  },
  recruitWrap: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    overflowX: 'hidden',
    paddingBottom: 32,
    [theme.breakpoints.down('xs')]: {
      display: 'block',
      padding: '0px 8px 32px',
    },
  },
  recruitMain: {
    display: 'flex',
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
    },
  },
  recruitBoxLeft: {
    display: 'flex',
    flexDirection: 'column',
    width: 540,
    [theme.breakpoints.down('sm')]: {
      width: 400,
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      height: '100%',
    },
  },
  recruitBoxLeftBottom: {
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  recruitBoxRight: {
    display: 'flex',
    flexDirection: 'column',
    width: 405,
    [theme.breakpoints.down('sm')]: {
      width: 300,
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      height: '100%',
    },
  },
  recruitSideBoxLeft: {
    position: 'absolute',
    alignItems: 'right',
    left: -405,
    [theme.breakpoints.down('sm')]: {
      left: -300,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  recruitSideBoxRight: {
    position: 'absolute',
    right: -540,
    [theme.breakpoints.down('sm')]: {
      right: -400,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  recruitBox: {
    flex: 1,
    padding: 8,
  },
  jobCategoryFlexs: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: '0px auto 24px',
  },
  jobCategoryFlex: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '33.3333%',
    padding: 15,
    [theme.breakpoints.down('sm')]: {
      width: '50%',
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      padding: '12px 0px',
    },
  },
  jobCategoryLink: {
    color: theme.palette.common.black,
    textAlign: 'center',
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      margin: 0,
    },
  },
  jobCategoryImage: {
    width: '100%',
    marginBottom: 16,
  },
  memberFlexs: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '0px 30px',
    marginBottom: 24,
    [theme.breakpoints.down('xs')]: {
      padding: '0px 10px',
    },
  },
  memberFlex: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0px 15px 30px',
    width: '33.3333%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      padding: '0px 0px 30px',
    },
  },
}))
export default class RecruitPage extends React.Component {

  anchors = {}

  componentDidMount() {
    // wait layout is fixed
    setTimeout(() => this.scrollTo(this.props.location.hash.slice(1)), 200)
  }

  scrollTo = (anchor) => {
    if (this.anchors[anchor]) {
      window.scrollTo(0, this.anchors[anchor].offsetTop)
    }
  }

  render() {
    const { classes } = this.props

    return (
      <div className={classes.root}>
        <Helmet>
          <title>採用情報</title>
        </Helmet>
        <Cover />
        <div className={classes.intro}>
          <div className={classes.introMessageWrap}>
            <img className={classes.introDeco1} src={`${imageOrigin}/static/company/intro-decoration1.png`} />
            <div className={classes.introMessage}>
              <div>
                <span className={classes.blockMobile}>わたしたちSMOOOSYの成長に</span>
                <span className={classes.blockMobile}>ご協力いただける方を募集しています！</span>
              </div>
              <div>一緒にお話だけでもしませんか？</div>
            </div>
            <img className={classes.introDeco2} src={`${imageOrigin}/static/company/intro-decoration2.png`} />
          </div>
          <div className={classes.actions}>
            <a className={classes.action} href='https://www.wantedly.com/companies/smooosy/projects' target='_blank' rel='noopener noreferrer'>
              <Button variant='contained' size='large' color='secondary' className={classes.actionButton}>詳しくみる</Button>
            </a>
          </div>
        </div>
        <MissionContainer containerRef={e => this.anchors.mission = e} />
        <AccentContainer title='SMOOOSYで働く理由' containerRef={e => this.anchors.reason = e}>
          <div className={classes.recruitWrap}>
            <div className={classes.recruitMain}>
              <div className={classes.recruitSideBoxLeft}>
                <div className={classes.recruitBoxRight}>
                  <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[1]} />
                  <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[2]} />
                </div>
              </div>
              <div className={classes.recruitBoxLeft}>
                <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[0]} />
                <div className={classes.recruitBoxLeftBottom}>
                  <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[3]} />
                  <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[4]} />
                </div>
              </div>
              <div className={classes.recruitBoxRight}>
                <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[1]} />
                <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[2]} />
              </div>
              <div className={classes.recruitSideBoxRight}>
                <div className={classes.recruitBoxLeft}>
                  <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[4]} />
                  <div className={classes.recruitBoxLeftBottom}>
                    <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[3]} />
                    <Recruitment className={classes.recruitBox} recruit={ARTICLE_LIST[0]} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={classes.actions}>
            <a className={classes.action} href='https://www.wantedly.com/companies/smooosy/projects' target='_blank' rel='noopener noreferrer'>
              <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>もっと見る</Button>
            </a>
          </div>
        </AccentContainer>
        <AccentContainer title='募集中の職種' containerRef={e => this.anchors.jobPostings = e}>
          <div className={classes.wrap}>
            <div className={classes.jobCategoryFlexs}>
            {JOB_CATEGORY_LIST.map((jobCategory) =>
              jobCategory && jobCategory.title ?
              <div key={`job_category_${jobCategory.key}`} className={classes.jobCategoryFlex}>
                <a className={classes.jobCategoryLink} href={jobCategory.url} target='_blank' rel='noopener noreferrer'>
                  <div>
                    <img className={classes.jobCategoryImage} src={`${imageOrigin}${jobCategory.image}`}/>
                  </div>
                  <div>{jobCategory.title}</div>
                </a>
              </div>
              : <div key={`job_category_${jobCategory.key}`} className={classes.jobCategoryFlex}/>
            )}
            </div>
            <div className={classes.actions}>
              <a className={classes.action} href='https://www.wantedly.com/companies/smooosy/projects' target='_blank' rel='noopener noreferrer'>
                <Button variant='outlined' size='large' color='primary' className={classes.actionButton}>募集一覧を見る</Button>
              </a>
            </div>
          </div>
        </AccentContainer>
        <AccentContainer title='チーム紹介' containerRef={e => this.anchors.members = e}>
          <div className={classes.wrap}>
            <div className={classes.memberFlexs}>
              {company.managers.map((member, i) => <div key={`manager_${i}`} className={classes.memberFlex}><Member member={member} /></div>)}
              {company.members.map((member, i) => <div key={`member_${i}`} className={classes.memberFlex}><Member member={member} /></div>)}
            </div>
            <div className={classes.actions}>
              <a className={classes.action} href='https://www.wantedly.com/companies/smooosy/projects' target='_blank' rel='noopener noreferrer'>
                <Button variant='contained' size='large' color='primary' className={classes.actionButton}>募集一覧を見る</Button>
              </a>
            </div>
          </div>
        </AccentContainer>
        <Footer rootClass={classes.footer}/>
      </div>
    )
  }
}

let Cover = ({classes}) => (
  <div className={classes.root}>
    <div className={classes.cover} />
  </div>
)

Cover = withStyles((theme) => ({
  root: {
    width: '100%',
    height: '50vw',
    minHeight: 250,
    maxHeight: 480,
  },
  cover: {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundImage: `url('${imageOrigin}/static/company/recruit-cover-pc.jpg');`,
    [theme.breakpoints.down('xs')]: {
      backgroundImage: `url('${imageOrigin}/static/company/recruit-cover-m.jpg');`,
    },
  },
}))(Cover)

let Recruitment = ({recruit, className, classes}) => (
 <div className={[classes.root, className].join(' ')}>
    <a href={recruit.url} target='_blank' rel='noopener noreferrer'>
      <img className={classes.image} src={`${imageOrigin}${recruit.image}`} />
      <div className={classes[recruit.position]}>
        {recruit.title.map((t, i) => <div key={i} className={[classes.title, classes[recruit.textColor]].join(' ')}>{t}</div>)}
      </div>
    </a>
  </div>
)

Recruitment = withStyles((theme) => ({
  root: {
    position: 'relative',
    fontWeight: 'bold',
  },
  image: {
    objectFit: 'cover',
    width: '100%',
  },
  title: {
    fontSize: 12,
    lineHeight: '24px',
  },
  black: {
    color: theme.palette.common.black,
  },
  white: {
    color: theme.palette.common.white,
  },
  topLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    textAlign: 'left',
  },
  topRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    textAlign: 'right',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    textAlign: 'left',
  },
  bottomRight: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    textAlign: 'right',
  },
}))(Recruitment)
