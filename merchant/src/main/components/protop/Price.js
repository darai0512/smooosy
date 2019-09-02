import React from 'react'
import { withStyles } from '@material-ui/core'

const Price = withStyles((theme) => ({
  container: {
    background: 'linear-gradient(90deg, #1A237E 0%, #F63355 100%)',
    padding: '96px 0',
    [theme.breakpoints.down('xs')]: {
      padding: '80px 0 96px 0',
    },
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    lineHeight: '30px',
    textAlign: 'center',
    color: theme.palette.common.white,
    marginBottom: 56,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 48,
    },
  },

  priceContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 632,
    minHeight: 235,
    textAlign: 'center',
    color: theme.palette.common.white,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxSizing: 'border-box',
    borderRadius: 4,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      marginLeft: 40,
      marginRight: 40,
    },
  },

  firstTimeContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    [theme.breakpoints.down('xs')]: {
      marginTop: 48,
      marginBottom: 32,
    },
  },
  firstTimeTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: '21px',
    marginBottom: 12,
  },
  firstTimePrice: {
    fontWeight: 'bold',
    fontSize: 32,
    lineHeight: '37px',
  },

  borderLine: {
    width: 1,
    height: 155,
    margin: '40px 0',
    border: '0.5px solid rgba(255, 255, 255, 0.3)',
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: 1,
      margin: '0 51px',
    },
  },

  detailContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    [theme.breakpoints.down('xs')]: {
      marginTop: 32,
      marginBottom: 48,
    },
  },
  priceDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    width: 176,
    paddingTop: 12,
    paddingBottom: 12,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 10.5,
      paddingBottom: 10.5,
    },
  },
}))(({classes}) => (
  <div className={classes.container}>
    <h2 className={classes.title}>料金</h2>

    <div className={classes.priceContainer}>
      <div className={classes.firstTimeContainer}>
        <div>
          <p className={classes.firstTimeTitle}>月額利用料</p>
          <p className={classes.firstTimePrice}>10,000円</p>
        </div>
      </div>

      <div className={classes.borderLine} />

      <div className={classes.detailContainer}>
        <div>
          <div className={classes.priceDetail}>
            <p>募集料</p>
            <p>0円</p>
          </div>
          <div className={classes.priceDetail}>
            <p>成約手数料</p>
            <p>決済額の5%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
))

export default Price
