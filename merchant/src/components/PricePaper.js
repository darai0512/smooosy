import React from 'react'
import { CircularProgress } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const PricePaper = ({loading, title, component = 'div', price, className, classes}) => {

  return React.createElement(component, {
    className: [classes.root, className].join(' '),
  },
    <>
      {title &&
        <h3 className={classes.priceChartPaperTitle}>
          {title}
        </h3>
      }
      {loading && <div className={classes.loading}><CircularProgress color='secondary' className={classes.progress} /></div>}
      <div className={[classes.priceValue, classes.priceValueAverage].join(' ')}>
        {!loading && price.average &&
          <>
            <p className={classes.price}>{price.average.toLocaleString()}円</p>
            <p className={classes.type}>標準</p>
          </>
        }
      </div>
      <div className={[classes.priceValue, classes.priceValueLow].join(' ')}>
        {!loading && price.low &&
          <>
            <p className={classes.price}>{price.low.toLocaleString()}円</p>
            <p className={classes.type}>リーズナブル</p>
          </>
        }
      </div>
      <div className={[classes.priceValue, classes.priceValueHigh].join(' ')}>
        {!loading && price.high &&
          <>
            <p className={classes.price}>{price.high.toLocaleString()}円</p>
            <p className={classes.type}>プレミアム</p>
          </>
        }
      </div>
      {!loading && !(price.average && price.low && price.high) &&
        <div className={[classes.priceValue, classes.unknown].join(' ')}>
          データが足りません
        </div>
      }
    </>
  )
}

export default withStyles(theme => ({
  root: {
    maxHeight: 389,
    maxWidth: 700,
    position: 'relative',
    backgroundColor: theme.palette.common.white,
    backgroundImage: 'url("/images/pricechart.png")',
    backgroundPosition: 'center bottom',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
  },
  priceChartPaperTitle: {
    padding: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      padding: 10,
    },
  },
  loading: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    width: 80,
    height: 80,
  },
  priceValue: {
    position: 'absolute',
    textAlign: 'center',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,.80)',
    fontSize: 26,
    [theme.breakpoints.down('sm')]: {
      fontSize: 22,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '4vw',
    },
  },
  priceValueAverage: {
    right: 0,
    left: 0,
    bottom: 130,
    margin: 'auto',
    [theme.breakpoints.only('sm')]: {
      bottom: 110,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '4vw',
      bottom: '20vw',
    },
  },
  priceValueLow: {
    left: '20%',
    bottom: 30,
    [theme.breakpoints.down('xs')]: {
      left: '19vw',
      bottom: '6vw',
    },
  },
  priceValueHigh: {
    right: '20%',
    bottom: 30,
    [theme.breakpoints.down('xs')]: {
      right: '19vw',
      bottom: '6vw',
    },
  },
  unknown: {
    right: 0,
    left: 0,
    bottom: '30%',
    margin: 'auto',
    marginLeft: '15%',
    marginRight: '15%',
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: 'center',
    background: 'rgba(80,80,80,.8)',
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
    },
  },
  price: {
    fontWeight: 'bold',
  },
  type: {
    fontSize: '.8em',
  },
}))(PricePaper)
