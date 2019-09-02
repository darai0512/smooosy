import React from 'react'

const AmpContext = React.createContext(false)

export const AmpProvider = AmpContext.Provider

export function withAMP(Component) {
  return function WrappedComponent(props) {
    return (
      <AmpContext.Consumer>
        {isAMP => <Component {...props} isAMP={isAMP} />}
      </AmpContext.Consumer>
    )
  }
}
