import React from 'react'

const RollOutContext = React.createContext({})

export const RollOutProvider = RollOutContext.Provider

export function withRollOut(Component) {
  return function WrappedComponent(props) {
    return (
      <RollOutContext.Consumer>
        {rollouts => <Component {...props} rollouts={rollouts} />}
      </RollOutContext.Consumer>
    )
  }
}
