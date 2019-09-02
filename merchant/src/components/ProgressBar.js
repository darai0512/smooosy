import React from 'react'

const ProgressBar = ({value, style, errorOnOverflow}) => {
  const width = value > 1 ? '100%' : value > 0.8 ? '80%' : value > 0.6 ? '60%' : value > 0.4 ? '40%' : value > 0.2 ? '20%' : '1%'
  const styles = {
    root: {
      display: 'flex',
      ...style,
    },
    main: {
      transitionDuration: '0.5s',
      width,
      height: 4,
      background: errorOnOverflow && value > 1 ? 'rgb(244, 67, 54)'
        : value > 0.8 ? 'rgb(0, 170, 2)'
        : value > 0.6 ? 'rgb(172, 204, 0)'
        : value > 0.4 ? 'rgb(244, 205, 65)'
        : value > 0.2 ? 'rgb(244, 150, 65)'
        : value > 0 ? 'rgb(244, 104, 66)'
        : '#fff',
    },
    other: {
      flex: 1,
      height: 2,
    },
  }

  return (
    <div style={styles.root}>
      <div style={styles.main} />
      <div style={styles.other} />
    </div>
  )
}

export default ProgressBar
