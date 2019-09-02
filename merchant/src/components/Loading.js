import React from 'react'
import { CircularProgress } from '@material-ui/core'

const Loading = ({style, progressStyle}) => {
  const rootStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  return (
    <div style={rootStyle}>
      <CircularProgress style={{width: 40, height: 40, ...progressStyle}} />
    </div>
  )
}

Loading.defaultProps = {
  style: {},
}

export default Loading
