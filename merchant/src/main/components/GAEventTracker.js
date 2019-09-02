import React from 'react'
import ReactGA from 'react-ga'
import { withAMP } from 'contexts/amp'

const GAEventTracker = ({category, action, label, isAMP, children}) => {
  if (!category || !action) return children
  const childrenWithProp = React.Children.map(
    children,
    child => React.cloneElement(child,
      isAMP ?
      {
        className: [child.className || '', child.props.className || '', 'tracking-click'].join(' '),
        'data-vars-category': category,
        'data-vars-action': action,
        'data-vars-label': label,
        'data-amp-addparams': 'ampId=CLIENT_ID(uid)&referrer=DOCUMENT_REFERRER&canonicalPath=CANONICAL_PATH',
        'data-amp-replace': 'CLIENT_ID DOCUMENT_REFERRER CANONICAL_PATH',
      }
      :
      {onClick: (e) => {
        // 左クリック or 中クリック（遷移するクリック）
        if (e.button === 0 || e.button === 1) {
          sendGAEvent(category, action, label)
        }
        child.props.onClick && child.props.onClick(e)
      }}
    )
  )

  return childrenWithProp
}

export function sendGAEvent(category, action, label) {
  ReactGA.event({category, action, label })
}

export default withAMP(GAEventTracker)