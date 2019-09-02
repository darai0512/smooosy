import React from 'react'
import YouIcon from '@material-ui/icons/Accessibility'

const PositionViewer = ({ value, theme, outerWidth = 300, style}) => {
  const { grey, primary } = theme.palette
  const styles = {
    root: {
      width: outerWidth,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...style,
    },
    element: {
      height: 5,
      width: (outerWidth - 20)/5 - 2,
    },
    icon: {
      position: 'relative',
      left: value * (outerWidth - 20),
      display: 'flex',
      flexDirection: 'column',
      width: 30,
      alignItems: 'center',
    },
  }

  return (
    <div style={styles.root}>
      <div style={{width: outerWidth}}>
        <div style={styles.icon}>
          <span style={{color: grey[600], fontSize: 10}}>あなた</span>
          <YouIcon style={{width: outerWidth/15, height: outerWidth/15, color: primary.light}} />
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-around', width: outerWidth - 20}}>
        <div style={{background: 'rgb(244, 104, 66)', ...styles.element}} />
        <div style={{background: 'rgb(244, 150, 65)', ...styles.element}} />
        <div style={{background: 'rgb(244, 205, 65)', ...styles.element}} />
        <div style={{background: 'rgb(172, 204, 0)', ...styles.element}} />
        <div style={{background: 'rgb(0, 170, 2)', ...styles.element}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', width: outerWidth, color: grey[600], fontSize: 13}}><div>Low</div><div>High</div></div>
    </div>
  )
}
export default PositionViewer
