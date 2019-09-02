import React from 'react'
import { withAMP } from 'contexts/amp'
import { withStyles } from '@material-ui/core'

const animationTime = '0.3s'

@withAMP
@withStyles({
  sticky: {
    textAlign: 'center',
    position: 'fixed',
    width: '100%',
    zIndex: 100,
    display: 'inline',
  },
  ampSticky: {
    textAlign: 'center',
    position: 'fixed',
    width: '100%',
    zIndex: 100,
  },
  topBar: {
    top: 0,
    transform: 'translateY(-100%)',
    boxShadow: '0px 1px 5px rgba(0,0,0,0.2)',
  },
  bottomBar: {
    bottom: 0,
    transform: 'translateY(100%)',
    boxShadow: '0px 1px 5px rgba(0,0,0,0.2)',
  },
  ampStickyMarker: {
    position: 'absolute',
    top: '400vh',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  input: {
    display: 'none',
    '&:checked + div': {
      animationName: 'stickyBarShowTransition',
      animationTimingFunction: 'ease-in-out',
      animationDuration: animationTime,
      animationDelay: '0.0s',
      animationIterationCount: 1,
      animationDirection: 'normal',
      animationFillMode: 'forwards',
    },
    '&:not(:checked) + div': {
      animationName: 'stickyBarHideTransition',
      animationTimingFunction: 'ease-in-out',
      animationDuration: animationTime,
      animationDelay: '0.0s',
      animationIterationCount: 1,
      animationDirection: 'normal',
      animationFillMode: 'forwards',
    },
  },
})
export default class StickyBar extends React.Component {
  static defaultProps = {
    gaEvent: {},
    buttonProps: () => ({}),
    direction: 'top',
  }

  componentDidMount() {
    if (this.props.isAMP) return

    this.prevPageY = this.pageY = document.scrollTop
    this.stickyInput = document.querySelector('#sticky_bar_input')
    document.addEventListener('scroll', this.scroll)
  }

  scroll = () => {
    this.pageY = Math.max(
      window.pageYOffset,
      document.documentElement.scrollTop,
      document.body.scrollTop,
      (document.scrollingElement || {}).scrollTop // IE not support
    )
    const startPos = this.props.startPos ? (window.screen.height * parseFloat(this.props.startPos)) : (window.screen.height * 3)

    // 下スクロール
    if (this.pageY > this.prevPageY && this.pageY > startPos && !this.stickyInput.checked) {
      this.stickyInput.checked = true
    // 上スクロール
    } else if (this.pageY < this.prevPageY && this.pageY < startPos && this.stickyInput.checked) {
      this.stickyInput.checked = false
    }

    this.prevPageY = this.pageY
  }

  componentWillUnmount() {
    if (this.props.isAMP) return
    document.removeEventListener('scroll', this.scroll)
  }

  render () {
    const { direction, children, isAMP, classes } = this.props

    let classSticky = classes.sticky
    let classAmpSticky = classes.ampSticky
    let transInit = ''
    if (direction === 'top') {
      transInit = 'translateY(-100%)'
      classSticky = [classSticky, classes.topBar].join(' ')
      classAmpSticky = [classAmpSticky, classes.topBar].join(' ')
    } else {
      transInit = 'translateY(100%)'
      classSticky = [classSticky, classes.bottomBar].join(' ')
      classAmpSticky = [classAmpSticky, classes.bottomBar].join(' ')
    }

    return (
      isAMP ?
      <>
        <div className={classes.ampStickyMarker}>
          <amp-position-observer on='enter:showTransition.start; exit:hideTransition.start'
            layout='nodisplay'
          />
        </div>
        <div className={['ampStickyBar', classAmpSticky].join(' ')}>
          {children}
          <amp-animation id='showTransition'
            layout='nodisplay'>
            <script type='application/json' dangerouslySetInnerHTML={{__html:
            `{
              "duration": "${animationTime}",
              "fill": "both",
              "easing": "ease-out",
              "direction": "alternate",
              "animations": [{
                "selector": ".ampStickyBar",
                "keyframes":  [{
                  "transform": "${transInit}"
                },
                {
                  "transform": "translateY(0)"
                }]
              }]
            }`}}/>
          </amp-animation>
          <amp-animation id='hideTransition'
            layout='nodisplay'>
            <script type='application/json' dangerouslySetInnerHTML={{__html:
            `{
              "duration": "${animationTime}",
              "fill": "both",
              "easing": "ease-out",
              "direction": "alternate",
              "animations": [{
                "selector": ".ampStickyBar",
                "keyframes":  [{
                  "transform": "translateY(0)"
                },
                {
                  "transform": "${transInit}"
                }]
              }]
            }`}}/>
          </amp-animation>
        </div>
      </>
      :
      <>
        <style>{`
          @keyframes stickyBarShowTransition {
            0% {transform:${transInit};}
            100% {transform:translateY(0);}
          }
          @keyframes stickyBarHideTransition {
            0% {transform:translateY(0);}
            100% {transform:${transInit};}
          }
        `}</style>
        <input className={classes.input} type='checkbox' id='sticky_bar_input' />
        <div className={classSticky}>
          {children}
        </div>
      </>
    )
  }
}
