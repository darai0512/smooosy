import React from 'react'
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied'

const NotFound = () => {
  const styles = {
    root: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    icon: {
      width: 200,
      height: 200,
    },
  }

  return (
    <div style={styles.root}>
      <SentimentVeryDissatisfiedIcon style={styles.icon} />
    </div>
  )
}

export default NotFound
