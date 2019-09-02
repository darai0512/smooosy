import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { red, orange } from '@material-ui/core/colors'

@connect(
  state => ({
    expCardFooter: state.experiment.experiments.card_footer || 'control',
  })
)
@withStyles(theme => ({
  footer: {
    background: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    display: 'flex',
    flexShrink: 0,
    padding: '16px 12px',
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      padding: '12px 8px',
    },
  },
  msg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -36,
    height: 35,
    background: 'rgba(255, 255, 255, .9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  error: {
    color: red[500],
  },
  warn: {
    color: orange[500],
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      top: -69,
      height: 'auto',
      padding: 10,
    },
  },
  backOld: {
    flex: 1,
    margin: '0 12px',
    [theme.breakpoints.down('xs')]: {
      margin: '0 8px',
    },
  },
  back: {
    flex: 1,
    margin: '0 8px',
  },
  backButton: {
    height: 50,
    fontSize: 15,
    width: '100%',
  },
  nextOld: {
    flex: 1,
    margin: '0 12px',
    [theme.breakpoints.down('xs')]: {
      margin: '0 8px',
    },
  },
  next: {
    flex: 1,
    margin: '0 8px',
  },
  nextButtonOld: {
    height: 50,
    fontSize: 15,
    width: '100%',
    transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
    '&:hover': {
      opacity: 0.6,
    },
  },
  nextButton: {
    height: 50,
    fontSize: 20,
    fontWeight: 'bold',
    width: '100%',
    transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
    '&:hover': {
      opacity: 0.6,
    },
  },
}))
export default class QueryCardFooter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      error: false,
    }
  }

  static defaultProps = {
    disabledBack: false,
    disabledNext: false,
    prevTitle: '',
    nextTitle: '',
    type: 'button',
    onPrev: null,
    onNext: () => {},
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.disabledNext && !this.props.disabledNext) {
      this.setState({error: false})
    }
  }

  onNext = (...args) => {
    if (this.props.disabledNext) {
      this.setState({error: true})
      return
    }

    this.setState({error: false})
    return this.props.onNext(args)
  }

  render() {
    const {classes, className, onPrev, disabledBack, prevTitle, nextTitle, type, warn, expCardFooter} = this.props

    return (
      <div className={classes.footer}>
        {this.state.error ?
          <div className={[classes.msg, classes.error].join(' ')}>未回答です</div>
          : warn ?
          <div className={[classes.msg, classes.warn].join(' ')}>{warn}</div>
          :
          null
        }
        {onPrev &&
          <div className={expCardFooter === 'fontSize' ? classes.back : classes.backOld}>
            <Button
              className={classes.backButton}
              disabled={disabledBack}
              onClick={onPrev}>
              {prevTitle}
            </Button>
          </div>
        }
        <div className={expCardFooter === 'fontSize' ? classes.next : classes.nextOld}>
          <Button
            variant='contained'
            color='primary'
            type={type}
            className={className}
            classes={{root: expCardFooter === 'fontSize' ? classes.nextButton : classes.nextButtonOld}}
            onClick={this.onNext}>
            {nextTitle}
          </Button>
        </div>
      </div>
    )
  }
}
