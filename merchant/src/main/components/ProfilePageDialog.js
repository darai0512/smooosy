import React from 'react'
import {
  AppBar,
  Dialog,
  IconButton,
  Paper,
  Slide,
  Fade,
  Toolbar,
  withWidth,
  RootRef,
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import CloseIcon from '@material-ui/icons/Close'

import ProfilePage from 'components/ProfilePage'
import { unload as unloadProfilePage } from 'modules/profile'

const ProfilePageWithRoute = withRouter(ProfilePage)

const Transition = withWidth()(({width, ...props}) => {
  if (width === 'xs') return <Slide direction='up' {...props} />
  return <Fade {...props} />
})

const PaperWithRootRef = ({rootRef, ...props}) => {
  return (
    <RootRef rootRef={rootRef}>
      <Paper {...props} />
    </RootRef>
  )
}

@withWidth()
@withStyles(theme => ({
  dialog: {
    WebkitOverflowScrolling: 'touch',
  },
  paper: {
    [theme.breakpoints.up('sm')]: {
      width: '100%',
      height: '85%',
      maxWidth: 1044,
    },
  },
  appBar: {
    height: 60,
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  closeButton: {
    position: 'sticky',
    marginBottom: -50,
    zIndex: 1000,
    color: theme.palette.grey[700],
    marginLeft: 'auto',
  },
  closeButtonMobile: {
    color: theme.palette.grey[700],
    marginLeft: 'auto',
  },
  logo: {
    marginTop: 0,
    marginLeft: 10,
    height: 40,
    width: 160,
  },
  profilePage: {
    padding: '0 10px',
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100% - 60px)', // 100% - height of header
    },
  },
  padding: {
    [theme.breakpoints.up('sm')]: {
      height: 10,
      width: '100%',
      background: theme.palette.common.white,
      zIndex: 12,
    },
  },
}))
@connect(null, { unloadProfilePage })
export default class ProfilePageDialog extends React.Component {
  constructor(props) {
    super(props)
    this.scrollableEl = React.createRef()
    this.state = {}
  }

  onClose = () => {
    this.props.onClose()
    this.props.unloadProfilePage()
  }

  render() {
    const { classes, history, width, open, ...props } = this.props

    return (
      <Dialog fullScreen={width === 'xs'} open={open} onClose={this.onClose} TransitionComponent={Transition} className={classes.dialog} PaperProps={{className: classes.paper, component: PaperWithRootRef, rootRef: this.scrollableEl}}>
        {width === 'xs' ?
          <AppBar elevation={0} className={classes.appBar} position='sticky'>
            <Toolbar>
              <img alt='SMOOOSYロゴ' src='/images/logo.png' className={classes.logo} height='40' width='160' />
              <IconButton className={classes.closeButtonMobile} onClick={this.onClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        :
          <IconButton className={classes.closeButton} onClick={this.onClose}>
            <CloseIcon />
          </IconButton>
        }
        <div className={classes.padding} />
        <ProfilePageWithRoute hideFooter noUnload className={classes.profilePage} scrollableEl={this.scrollableEl.current} scrollAdjustment={width === 'xs' ? -60 : -10} {...props} />
      </Dialog>
    )
  }
}
