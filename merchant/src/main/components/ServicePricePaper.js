import React from 'react'
import { Paper } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import PricePaper from 'components/PricePaper'


const ServicePricePaper = ({price, service, classes}) => {
  if (!service.name || !price.average || !price.low || !price.high) {
    return null
  }

  return (
    <div className={classes.container}>
      <PricePaper
        className={service.priceComment ? classes.pricePaper : [classes.pricePaper, classes.center].join(' ')}
        title={`${service.name}の価格分布`}
        component={Paper}
        price={price}
      />
      {
        service.priceComment &&
        <Paper className={classes.priceComment}>
          <div dangerouslySetInnerHTML={{__html: service.priceComment}} />
        </Paper>
      }
    </div>
  )
}

export default withStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 0',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  center: {
    justifyContent: 'center',
  },
  pricePaper: {
    height: '33.3vw',
    width: '60vw',
    maxHeight: 389,
    maxWidth: 700,
    [theme.breakpoints.down('xs')]: {
      height: '65vw',
      width: '100vw',
    },
  },
  priceComment: {
    width: 'auto',
    flex: '1',
    height: '33.3vw',
    maxHeight: 389,
    padding: 20,
    overflowY: 'auto',
    marginLeft: 20,
    [theme.breakpoints.down('xs')]: {
      width: '100vw',
      height: 'auto',
      marginLeft: 0,
      overflowY: 'initial',
    },
  },
}))(ServicePricePaper)
