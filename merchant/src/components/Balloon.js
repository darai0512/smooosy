import React from 'react'
import Joyride from 'react-joyride'

// Styling: https://github.com/gilbarbara/react-joyride/blob/3e08384415a831b20ce21c8423b6c271ad419fbf/src/styles.js

export default class Balloon extends React.Component {
  state = {
    run: false,
  }
  componentDidMount() {
    this.checkTargetExist()
  }

  componentDidUpdate() {
    if (this.props.open && !this.state.run) {
      this.checkTargetExist()
    }
  }

  checkTargetExist = () => {
    const { steps } = this.props
    if (steps.every(s => document.querySelector(s.target))) {
      this.setState({run: true})
    }
  }

  render() {
    const { open, showProgress, onChange, children, ...rest } = this.props
    const { run } = this.state
    return (
      <Joyride
        tooltipComponent={children}
        debug={process.env.TARGET_ENV !== 'production'}
        showProgress={showProgress}
        run={run && open}
        callback={onChange}
        spotlightPadding={5}
        {...rest}
      />
    )
  }
}