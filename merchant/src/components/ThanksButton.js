import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Button, Popover } from '@material-ui/core'
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles'
import { pink } from '@material-ui/core/colors'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import FavoriteIcon from '@material-ui/icons/Favorite'

import { withApiClient } from 'contexts/apiClient'
import { load, send } from 'modules/thank'

const localTheme = theme => ({
  ...theme,
  palette: {
    ...theme.palette,
    primary: {
      light: pink[200],
      main: pink[400],
      dark: pink[600],
      contrastText: theme.palette.common.white,
    },
  },
})

@withApiClient
@withStyles({
  root: {
    display: 'flex',
  },
  button: {
    padding: '0 8px',
    height: 24,
    minHeight: 24,
    minWidth: 0,
    fontSize: 12,
    border: `1px solid ${pink[400]}`,
  },
  popover: {
    pointerEvents: 'none',
  },
  popoverPaper: {
    maxWidth: 280,
    marginTop: -10,
    borderRadius: 5,
    border: `1px solid ${pink[400]}`,
    padding: '4px 8px',
    fontSize: 14,
  },
  icon: {
    pointerEvents: 'none',
    fontSize: 18,
    marginRight: 4,
  },
})
@connect(
  (state, props) => ({
    me: state.auth.user,
    thank: state.thank.thanks[props.user.id],
  }),
  { load, send }
)
@withRouter
export default class ThanksButton extends React.Component {
  state = {}

  componentDidMount() {
    const { user, thank } = this.props
    if (!user.id) return

    if (thank) {
      this.setState({type: this.checkType(thank.today)})
    } else {
      this.props.load(user.id).then(({thank}) => {
        this.setState({type: this.checkType(thank.today)})
      })
    }
  }

  onClick = () => {
    const { user } = this.props
    const { type } = this.state

    if (type === 'self') {
      return this.props.history.push('/account/thanks')
    } else if (type === 'ok') {
      this.props.send(user.id)
        .then(() => this.setState({type: 'done'}))
        .catch(() => this.setState({type: 'ng'}))
    } else if (type === 'done') {
      this.setState({type: 'ng'})
    }
  }

  onHover = e => {
    this.setState({anchor: e.currentTarget})
  }

  checkType = (today) => {
    const { me, user, preview } = this.props
    if (!me) return 'tools'
    if (!me.id) return 'logout'
    if (me.id === user.id) {
      if (preview) return 'preview'
      return 'self'
    }
    if (today) return 'ng'
    return 'ok'
  }

  render() {
    const { thank, user, classes, className } = this.props
    const { type, anchor } = this.state

    if (!thank) return null

    const { count } = thank

    const name = this.props.name || user.lastname

    const title = {
      tools: 'ここでありがとうはできません',
      logout: `ログインして${name}様にありがとうを伝えましょう！`,
      self: '貰ったありがとうをみる',
      preview: '依頼者からありがとうを受け取れます',
      ok: 'ありがとう！',
      ng: 'ありがとうは1日1回送ることができます',
      done: `${name}様にありがとうを送りました！`,
    }[type]

    return (
      <div className={[classes.root, className].join(' ')}>
        <MuiThemeProvider theme={localTheme}>
          <Button
            color='primary'
            variant='outlined'
            className={classes.button}
            onMouseOver={this.onHover}
            onMouseOut={() => this.setState({anchor: null})}
            onClick={this.onClick}
          >
            {['done', 'ng'].includes(type) ?
              <FavoriteIcon className={classes.icon} />
            :
              <FavoriteBorderIcon className={classes.icon} />
            }
            {count}
          </Button>
        </MuiThemeProvider>
        <Popover
          open={!!anchor}
          anchorEl={anchor}
          elevation={2}
          className={classes.popover}
          classes={{paper: classes.popoverPaper}}
          onClose={() => this.setState({anchor: null})}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          disableRestoreFocus
        >
          <div>{title}</div>
        </Popover>
      </div>
    )
  }
}
