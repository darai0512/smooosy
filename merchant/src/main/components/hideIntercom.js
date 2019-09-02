import React from 'react'

const hideIntercom = (WrapComponent) => {
  return class extends React.Component {
    componentDidMount() {
      //if (this.props.width !== 'md' && window.Intercom) {
      //  window.intercomSettings.hide_default_launcher = true
      //  window.Intercom('update', window.intercomSettings)
      //}
    }

    componentWillUnmount() {
      //window.intercomSettings.hide_default_launcher = false
      //window.Intercom && window.Intercom('update', window.intercomSettings)
    }

    render() {
      return <WrapComponent {...this.props} />
    }
  }
}

export default hideIntercom
