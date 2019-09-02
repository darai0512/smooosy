import React from 'react'
import GAEventTracker from 'components/GAEventTracker'
import LPButton from 'components/LPButton'
import { withAMP } from 'contexts/amp'
import { withStyles } from '@material-ui/core'

@withAMP
@withStyles(theme => ({
  mobileSticky: {
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    position: 'fixed',
    bottom: 0,
    width: '100%',
    background: theme.palette.common.white,
    zIndex: 100,
  },
  ampMobileStickyMarker: {
    position: 'absolute',
    top: 1500,
    width: '100%',
    height: '100%',
  },
  ampMobileSticky: {
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    position: 'fixed',
    bottom: 0,
    width: '100%',
    background: theme.palette.common.white,
    zIndex: 100,
    transform: 'translateY(100%)',
  },
  footerButton: {
    width: '80%',
    margin: 10,
  },
}))
export default class MobileStickyLPButton extends React.Component {

  static defaultProps = {
    gaEvent: {},
    buttonProps: () => ({}),
  }

  render () {
    const { buttonProps, gaEvent, isAMP, classes, children } = this.props

    return (
      isAMP ?
      <>
        <div className={classes.ampMobileStickyMarker}>
          <amp-position-observer on='enter:showTransition.start; exit:hideTransition.start'
            layout='nodisplay'
          />
        </div>
        <div className={['ampMobileStickyLPButton', classes.ampMobileSticky].join(' ')}>
          <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label} >
            <LPButton classes={{root: classes.footerButton}} {...buttonProps}>
              {children}
            </LPButton>
          </GAEventTracker>
          <amp-animation id='showTransition'
            layout='nodisplay'>
            <script type='application/json' dangerouslySetInnerHTML={{__html:
            `{
              "duration": "500ms",
              "fill": "both",
              "easing": "ease-out",
              "direction": "alternate",
              "animations": [{
                "selector": ".ampMobileStickyLPButton",
                "keyframes":  [{
                  "transform": "translateY(100%)"
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
              "duration": "500ms",
              "fill": "both",
              "easing": "ease-out",
              "direction": "alternate",
              "animations": [{
                "selector": ".ampMobileStickyLPButton",
                "keyframes":  [{
                  "transform": "translateY(0)"
                },
                {
                  "transform": "translateY(100%)"
                }]
              }]
            }`}}/>
          </amp-animation>
        </div>
      </>
      :
      <div className={classes.mobileSticky}>
        <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label} >
          <LPButton classes={{root: classes.footerButton}} {...buttonProps}>
            {children}
          </LPButton>
        </GAEventTracker>
      </div>
    )
  }
}