import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { withStyles } from '@material-ui/core/styles'
import { Snackbar } from '@material-ui/core'

import Header from 'components/Header'
import LoggedInHeader from 'components/LoggedInHeader'
import DevelopmentRibbon from 'components/DevelopmentRibbon'
import { close as closeSnack } from 'modules/snack'
import { loadActiveRuntimeConfigs } from 'modules/runtimeConfig'

@withStyles({
  content: {
    marginTop: 0,
    position: 'relative',
    height: '100%',
  },
})
@connect(
  state => ({
    user: state.auth.user || {},
    snack: state.snack,
  }),
  { closeSnack, loadActiveRuntimeConfigs }
)
export default class Layout extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loadActiveRuntimeConfigs()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user.id !== this.props.user.id) {
      this.props.loadActiveRuntimeConfigs()
    }
  }

  render() {
    const { user, classes, snack, children, hideHeader, hideMenu, ...rest } = this.props

    return (
      <>
        <Helmet titleTemplate='%s - SMOOOSY' />
        <div>
        {hideHeader ?
          null
        : user.id && !hideMenu ?
          <LoggedInHeader {...rest} />
        :
          <Header hideMenu={hideMenu} {...rest} />
        }
        </div>
        <div className={classes.content}>
          {children}
        </div>
        {process.env.TARGET_ENV !== 'production' &&
          <DevelopmentRibbon />
        }
        <Snackbar
          open={snack.open}
          message={snack.message}
          onClose={() => this.props.closeSnack()}
          anchorOrigin={snack.option.anchor}
          autoHideDuration={snack.option.duration}
          action={snack.option.action}
        />
      </>
    )
  }
}
