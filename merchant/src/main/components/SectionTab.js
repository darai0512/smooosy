import React from 'react'
import { Link } from 'react-router-dom'
import { grey } from '@material-ui/core/colors'
import { withStyles } from '@material-ui/core/styles'
import NotificationEventAvailable from '@material-ui/icons/EventAvailable'
import ActionHome from '@material-ui/icons/Home'
import PlacesBusinessCenter from '@material-ui/icons/BusinessCenter'
import ActionSupervisorAccount from '@material-ui/icons/SupervisorAccount'
import MoreIcon from '@material-ui/icons/MoreHoriz'

import Container from 'components/Container'
import { sections } from '@smooosy/config'

sections[0].icon = NotificationEventAvailable
sections[1].icon = ActionHome
sections[2].icon = PlacesBusinessCenter
sections[3].icon = ActionSupervisorAccount

const xxs = 500

@withStyles(theme => ({
  tabs: {
    display: 'flex',
  },
  tab: {
    flex: 1,
  },
  all: {
    [theme.breakpoints.down(xxs)]: {
      display: 'none',
    },
  },
  link: {
    height: 80,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '10px 10px 6px',
    fontSize: 15,
    color: theme.palette.grey[700],
    '&:hover': {
      color: theme.palette.blue.B200,
    },
  },
  active: {
    color: theme.palette.common.black,
  },
}), {withTheme: true})
export default class SectionTab extends React.Component {
  static defaultProps = {
    linkFunction: null,
    onChange: null,
    section: {},
    backgroundColor: grey[100],
  }

  render() {
    const { linkFunction, onChange, section, backgroundColor, theme, classes, showMoreTab } = this.props
    const { secondary } = theme.palette

    const styles = {
      root: {
        padding: 0,
        background: backgroundColor,
      },
    }

    return (
      <Container style={styles.root}>
        <div className={classes.tabs}>
          {sections.map((sec, i) =>
            <div key={sec.key} className={classes.tab} style={{borderBottom: section.key === sec.key ? `4px solid ${secondary.main}` : '4px solid transparent'}}>
              {linkFunction ?
                <Link to={linkFunction(sec)} className={section.key === sec.key ? `${classes.link} ${classes.active}` : classes.link}>
                  <sec.icon style={{color: sec.color}} />
                  <div>{sec.name}</div>
                </Link>
              : onChange ?
                <div onClick={() => onChange(i, sec)} className={classes.link}>
                  <sec.icon className={section.key === sec.key ? `${classes.icon} ${classes.active}` : classes.icon} style={{color: sec.color}} />
                  <div className={section.key === sec.key ? `${classes.icon} ${classes.active}` : classes.icon}>{sec.name}</div>
                </div>
              : null}
            </div>
          )}
          {showMoreTab &&
            <div className={classes.tab + ' ' + classes.all}>
              <Link to='/services' className={classes.link}>
                <MoreIcon />
                <div>もっと見る</div>
              </Link>
            </div>
          }
        </div>
      </Container>
    )
  }
}
