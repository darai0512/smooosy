import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import LeftIcon from '@material-ui/icons/ChevronLeft'

const ProServiceContainer = ({ stepper, children, submitLabel = '更新する', submitDisabled, classes, prevPage, back, passLabel, pass }) => (
  <div className={classes.root}>
    {stepper}
    <div className={classes.main}>
      <div className={classes.container}>
        {children}
      </div>
    </div>
    <div className={classes.footer}>
      <div className={classes.footerContainer}>
        {prevPage ?
          <Button variant='outlined' component={Link} to={prevPage} className={classes.button}>
            <LeftIcon />
            戻る
          </Button>
        : back ?
          <Button variant='outlined'  onClick={back} className={classes.button}>
            <LeftIcon />
            戻る
          </Button>
        :
          <div />
        }
        <div className={classes.flex}>
          {passLabel &&
            <Button variant='text' onClick={pass} disabled={submitDisabled} className={[classes.button, classes.cancel].join(' ')}>
              {passLabel}
            </Button>
          }
          <Button variant='contained' color='primary' type='submit' disabled={submitDisabled} className={classes.button}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  </div>
)

export default withStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  container: {
    margin: '20px auto',
    width: '90%',
    maxWidth: 600,
  },
  footer: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '10px auto',
    width: '90%',
    maxWidth: 600,
  },
  withStepper: {
    justifyContent: 'flex-end',
  },
  cancel: {
    marginRight: 10,
  },
  flex: {
    display: 'flex',
  },
  button: {
    [theme.breakpoints.up('sm')]: {
      padding: '12px 24px',
    },
  },
}))(ProServiceContainer)