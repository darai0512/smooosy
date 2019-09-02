import React from 'react'
import { Link } from 'react-router-dom'
import { Hidden } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import NotificationEventAvailable from '@material-ui/icons/EventAvailable'
import ActionHome from '@material-ui/icons/Home'
import PlacesBusinessCenter from '@material-ui/icons/BusinessCenter'
import ActionSupervisorAccount from '@material-ui/icons/SupervisorAccount'

import { sections, univOrigin } from '@smooosy/config'

import Container from 'components/Container'

sections[0].icon = NotificationEventAvailable
sections[1].icon = ActionHome
sections[2].icon = PlacesBusinessCenter
sections[3].icon = ActionSupervisorAccount


class Footer extends React.PureComponent {
  render() {
    const { classes, rootClass = '' } = this.props
    return (
      <Container type='footer' className={[classes.root, rootClass].join(' ')}>
        <div className={classes.content}>
          <div className={classes.companyColumn}>
            <Link to='/'><img alt='ロゴ' src='/images/smooosy.png' className={classes.logo} width='160' height='160' /></Link>
          </div>
          <div className={classes.flex} />
          <div className={classes.menuWrap}>
            <div className={classes.menu}>
              <h3 className={classes.title}>SMOOOSYについて</h3>
              <div className={classes.list}><a className={classes.link} href='/company' target='_blank'>会社概要</a></div>
              <div className={classes.list}><a className={classes.link} href='https://help.smooosy.com/' target='_blank' rel='noopener noreferrer'>お問い合わせ</a></div>
            </div>
            <div className={classes.menu}>
              <h3 className={classes.title}>人気のカテゴリ</h3>
              <div className={classes.list}><Link className={classes.link} to={'/t/photographers'}>エステ</Link></div>
              <div className={classes.list}><Link className={classes.link} to={'/t/tax-accountant'}>ネイル</Link></div>
              <div className={classes.list}><Link className={classes.link} to={'/t/cleaning'}>ヘアサロン</Link></div>
              <div className={classes.list}><Link className={classes.link} to={'/t/utilityman'}>まつげ</Link></div>
              <div className={classes.list}><Link className={classes.link} to={'/t/videographers'}>リラグゼーション</Link></div>
            </div>
            <div className={classes.menu}>
              <h3 className={classes.title}>事業者向け情報</h3>
              <div className={classes.list}><Link className={classes.link} to='/signup'>事業者登録</Link></div>
              <div className={classes.list}><Link className={classes.link} to='/login'>事業者ログイン</Link></div>
            </div>
          </div>
        </div>
        <div className={classes.bottom}>
          <div className={classes.bottomLinks}>
            <a className={classes.link} href='https://smooosy.glitch.me/policies/terms' target='_blank'>
              <Hidden implementation='css' smUp>規約</Hidden>
              <Hidden implementation='css' xsDown>利用規約</Hidden>
            </a>
            <span className={classes.link}>・</span>
            <a className={classes.link} href='https://smooosy.glitch.me/policies/privacy' target='_blank'>
              <Hidden implementation='css' smUp>プライバシー</Hidden>
              <Hidden implementation='css' xsDown>プライバシーポリシー</Hidden>
            </a>
            <span className={classes.link}>・</span>
            <a className={classes.link} href='https://smooosy.glitch.me/policies/low' target='_blank'>
              <Hidden implementation='css' smUp>特商法の表記</Hidden>
              <Hidden implementation='css' xsDown>特定商取引法に基づく表記</Hidden>
            </a>
          </div>
          <span className={classes.copyright}>
            &copy; 2019-{new Date().getFullYear()} smooosy Inc.
          </span>
        </div>
      </Container>
    )
  }
}

export default withStyles(theme => ({
  root: {
    color: theme.palette.grey[800],
    background: theme.palette.grey[300],
    borderTop: `1px solid ${theme.palette.grey[400]}`,
    padding: '16px 0',
    fontSize: 13,
  },
  content: {
    display: 'flex',
    margin: '0 auto',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
    },
  },
  companyColumn: {
    margin: 12,
  },
  logo: {
    display: 'block',
    width: 160,
    height: 160,
    margin: '0px auto',
  },
  social: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 10,
  },
  flex: {
    flex: 1,
  },
  menuWrap: {
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      flexWrap: 'wrap',
      maxWidth: 400,
    },
    [theme.breakpoints.down('xs')]: {
      maxWidth: 'initial',
      flexDirection: 'column',
    },
  },
  menu: {
    margin: 12,
    width: 140,
    [theme.breakpoints.down('xs')]: {
      margin: '12px auto',
      width: '90%',
    },
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    borderBottom: `1px solid ${theme.palette.grey[800]}`,
    margin: '0 0 10px',
    minWidth: 120,
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  list: {
    marginTop: 0,
    [theme.breakpoints.down('xs')]: {
      marginTop: 5,
    },
  },
  link: {
    fontSize: 13,
    color: theme.palette.grey[800],
    [theme.breakpoints.down('xs')]: {
      fontSize: 15,
    },
  },
  shareButton: {
    margin: 5,
  },
  bottom: {
    fontSize: 13,
    display: 'flex',
    flexDirection: 'row-reverse',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  bottomLinks: {
    display: 'flex',
    justifyContent: 'flex-start',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
    },
  },
  copyright: {
    marginTop: 0,
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginTop: 12,
    },
  },
  sections: {
    display: 'flex',
    justifyContent: 'center',
  },
  section: {
    borderBottom: '4px solid transparent',
  },
  sectionLink: {
    height: 80,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '10px 6px 6px',
    fontSize: 13,
    color: theme.palette.grey[700],
    '&:hover': {
      color: theme.palette.blue.B200,
    },
  },
  section0: {
    color: sections[0].color,
  },
  section1: {
    color: sections[1].color,
  },
  section2: {
    color: sections[2].color,
  },
  section3: {
    color: sections[3].color,
  },
}))(Footer)
