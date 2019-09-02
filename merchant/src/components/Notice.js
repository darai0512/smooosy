import React from 'react'
import { blue, amber, red } from '@material-ui/core/colors'
import ActionInfo from '@material-ui/icons/Info'
import AlertWarning from '@material-ui/icons/Warning'

const Notice = props => {
  const theme = {
    info: {
      color: blue[800],
      background: blue[50],
      border: blue[300],
      Icon: ActionInfo,
    },
    warn: {
      color: amber[800],
      background: amber[50],
      border: amber[300],
      Icon: AlertWarning,
    },
    error: {
      color: red[500],
      background: red[50],
      border: red[300],
      Icon: AlertWarning,
    },
  }[props.type || 'info']

  const styles = {
    root: {
      display: 'flex',
      alignItems: 'center',
      padding: 10,
      borderRadius: 5,
      color: theme.color,
      background: theme.background,
      border: `1px solid ${theme.border}`,
      ...props.style,
    },
    icon: {
      width: 18,
      marginRight: 5,
      verticalAlign: 'middle',
      color: theme.color,
    },
  }

  return (
    <div style={styles.root} className={props.className} onClick={props.onClick}>
      <theme.Icon style={styles.icon} />
      <div style={{flex: 1}}>{props.children}</div>
    </div>
  )
}

export default Notice
