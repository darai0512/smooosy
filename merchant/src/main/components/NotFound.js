import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import { List, ListItem, Paper, Button } from '@material-ui/core'
import NotificationEventAvailable from '@material-ui/icons/EventAvailable'
import ActionHome from '@material-ui/icons/Home'
import PlacesBusinessCenter from '@material-ui/icons/BusinessCenter'
import ActionSupervisorAccount from '@material-ui/icons/SupervisorAccount'

import CoverImages from 'components/CoverImages'
import Container from 'components/Container'
import Footer from 'components/Footer'

import { sections } from '@smooosy/config'

sections[0].icon = NotificationEventAvailable
sections[1].icon = ActionHome
sections[2].icon = PlacesBusinessCenter
sections[3].icon = ActionSupervisorAccount

const NotFound = ({classes}) => {

  const list = [
    {title: 'トップ', link: '/'},
    {title: '事業者登録', link: '/pro'},
  ]


  const cards = (
    <div className={classes.main}>
      <div className={classes.cardList}>
        {sections.map(sec =>
          <Paper key={sec.key} className={classes.card}>
            <sec.icon style={{width: 80, height: 80, color: sec.color}} />
            <div style={{fontSize: 20, fontWeight: 'bold'}}>
              <Button
                color='primary'
                style={{fontWeight: 'bold', width: '100%', marginTop: 10}}
                component={Link}
                to={`/sections/${sec.key}`}
              >
                {sec.name}
              </Button>
            </div>
            <div style={{flex: 1, textAlign: 'center', width: '100%', marginTop: 20, fontSize: 13}}>
              {sec.description}
            </div>
          </Paper>
        )}
      </div>
    </div>
  )

  return (
    <div className={classes.root}>
      <Helmet>
        <title>お探しのページは見つかりませんでした</title>
      </Helmet>
      <CoverImages
        height={280}
        firstImage={'/images/sorry.jpg'}
        alpha='0.5'
      >
        <div className={classes.mask}>
          <div className={classes.title}>
            <h1 style={{fontSize: 40}}>404 Not Found</h1>
            <div style={{margin: '10px 0'}}>
              <p>申し訳ございません。お探しのページは見つかりませんでした</p>
            </div>
          </div>
        </div>
      </CoverImages>
      <Footer />
    </div>
  )
}

export default withStyles(theme => ({
  mask: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 20,
    textAlign: 'center',
    color: theme.palette.common.white,
    textShadow: '1px 1px 8px rgba(0, 0, 0, .8)',
  },
  container: {
    padding: '30px 0',
  },
  list: {
    fontSize: 13,
    paddingTop: 0,
    paddingBottom: 0,
  },
  subtitle: {
    borderWidth: '1px 1px 0',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    background: theme.palette.grey[50],
    padding: '5px 10px',
    fontSize: 18,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      borderWidth: '1px 0 0',
    },
  },
  menuWrap: {
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  menu: {
    marginRight: 20,
    minWidth: 300,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
  box: {
    width: 300,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    background: theme.palette.common.white,
    padding: 16,
    marginBottom: 30,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      borderWidth: '1px 0',
    },
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: '5px 10px',
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  main: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    flex: 1,
  },
  cardList: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  card: {
    width: '48%',
    padding: 20,
    background: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },

}))(NotFound)
