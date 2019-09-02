import React from 'react'
import { withStyles } from '@material-ui/core/styles'

const SubHeader = ({ className, headerClass, classes, children }) => {
  const rootClasses = [classes.root]
  if (className) rootClasses.push(className)
  return (
    <header>
      <h2 className={rootClasses.join(' ')}>
        <div className={[classes.header, headerClass].join(' ')}>{children}</div>
      </h2>
    </header>
  )
}

export default withStyles(theme => ({
  root: {
    padding: '24px 0px 16px 0',
  },
  header: {
    width: '100%',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 auto',
    padding: '12px 0',
    borderBottom: `2px solid ${theme.palette.grey[700]}`,
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      fontSize: 18,
      padding: '6px 0',
    },
  },
}))(SubHeader)
