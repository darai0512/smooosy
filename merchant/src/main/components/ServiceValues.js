import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import Container from 'components/Container'
import RatingStar from 'components/RatingStar'

@withStyles(theme => ({
  main: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, .5)',
    width: '100%',
    textAlign: 'center',
    padding: '24px 0',
    [theme.breakpoints.down('xs')]: {
      padding: '16px 0',
    },
  },
  flex: {
    display: 'flex',
  },
  item: {
    color: theme.palette.grey[200],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  body: {
    fontSize: 24,
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  name: {
    fontSize: 18,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  rating: {
    fontSize: '1.2em',
  },
  stars: {
    width: 125,
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: 100,
    },
  },
}))
export default class ServiceValues extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  render() {
    const { classes } = this.props

    return (
      <Container className={classes.main}>
        <div className={classes.flex}>
          <div className={classes.item}>
            <div className={classes.name}>依頼者数</div>
            <div className={classes.body}>7万人以上</div>
          </div>
          <div className={classes.item}>
            <div className={classes.name}>平均評価 <span className={classes.rating}>4.90</span></div>
            <div className={classes.body}>
              <div className={classes.stars}>
                <RatingStar rating={4.90} />
              </div>
            </div>
          </div>
          <div className={classes.item}>
            <div className={classes.name}>依頼総額</div>
            <div className={classes.body}>60億円以上</div>
          </div>
        </div>
      </Container>
    )
  }
}
