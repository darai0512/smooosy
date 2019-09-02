import React from 'react'

const ApiClientContext = React.createContext(false)

export const ApiClientProvider = ApiClientContext.Provider

export function withApiClient(Component) {
  return function WrappedComponent(props) {
    return (
      <ApiClientContext.Consumer>
        {apiClient => <Component {...props} apiClient={apiClient} />}
      </ApiClientContext.Consumer>
    )
  }
}
