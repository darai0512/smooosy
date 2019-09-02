import React from 'react'
import { withStyles } from '@material-ui/core/styles'

let AccentContainer = ({ title, containerRef, children, className, mainClassName, classes }) => {
  return (
    <section ref={containerRef} className={[classes.root, className].join(' ')}>
      {title && <header className={classes.header}>
        <h2 className={classes.title}>{title}</h2>
        <div className={classes.headerBorder} />
      </header>}
      <div className={[classes.main, mainClassName].join(' ')}>
        {children}
      </div>
    </section>
  )
}

export default AccentContainer = withStyles(theme => ({
  root: {
    padding: '40px 0',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
  },
  headerBorder: {
    width: 60,
    marginTop: 20,
    borderBottom: `4px solid ${theme.palette.secondary.main}`,
  },
  main: {
    marginTop: 40,
  },
}))(AccentContainer)
