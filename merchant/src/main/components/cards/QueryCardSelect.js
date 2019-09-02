import React from 'react'
import { Paper } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withStyles } from '@material-ui/core/styles'
import CheckIcon from '@material-ui/icons/Check'

import QueryCardClose from 'components/cards/QueryCardClose'
import QueryCardHeader from 'components/cards/QueryCardHeader'
import QueryCardFooter from 'components/cards/QueryCardFooter'
import { imageSizes } from '@smooosy/config'

@withWidth()
@withStyles(theme => ({
  images: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    alignContent: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    padding: '0 0 10px',
  },
  image: {
    cursor: 'pointer',
    width: '29%',
    margin: 8,
    zIndex: 1,
    [theme.breakpoints.down('xs')]: {
      width: '42%',
    },
  },
  imageChecked: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `5px solid ${theme.palette.primary.main}`,
    background: 'rgba(0, 0, 0, .5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    width: 48,
    height: 48,
    color: theme.palette.common.white,
  },
  answer: {
    fontSize: 13,
    fontWeight: 'bold',
    padding: 5,
    textAlign: 'center',
  },
  option: {
    width: '29%',
    margin: '0 10px',
    [theme.breakpoints.down('xs')]: {
      width: '42%',
    },
  },
}))
class SimilarServiceList extends React.PureComponent {

  constructor(props) {
    super(props)
    this.state = {
      key: props.service.key,
    }
  }

  selectService = (key) => {
    this.setState({key})
    this.props.selectService(key)
  }

  render () {
    const { services, classes, width } = this.props
    const { key } = this.state

    return (
      <div className={classes.images}>
        {services.map(s =>
          <Paper key={s.id} className={classes.image} onClick={() => this.selectService(s.key)}>
            <div className='queryLabel' style={{position: 'relative', width: '100%', height: width === 'xs' ? '30vw' : 130, background: `url(${s.image}${imageSizes.service}) center/cover`}}>
              {s.key === key ?
                <div className={classes.imageChecked}>
                  <CheckIcon className={classes.check} />
                </div>
              : null}
            </div>
            <div className={classes.answer}>{s.name}</div>
          </Paper>
        )}
        {[...Array(3)].map((_, i) => <div key={i} className={classes.option} />)}
      </div>
    )
  }
}

@withStyles(theme => ({
  root: {
    overflow: 'hidden',
    position: 'relative',
    background: '#fafafa',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    height: 600,
    [theme.breakpoints.down('xs')]: {
      height: '100%',
    },
  },
  container: {
    marginTop: 48,
    overflowY: 'auto',
    overflowX: 'inherit',
    WebkitOverflowScrolling: 'touch',
    flex: 1,
  },
}))
export default class QueryCardSelect extends React.PureComponent {

  constructor(props) {
    super(props)
    this.key = props.service.key
  }

  next = () => {
    this.props.selectService(this.key)
  }

  selectService = (key) => {
    this.key = key
  }

  render() {
    const { service, similarServices, onClose, classes } = this.props
    const services = [service, ...similarServices]

    return (
      <div className={classes.root}>
        <QueryCardClose onClose={onClose} />
        <div ref={e => this.container = e} className={classes.container}>
          <QueryCardHeader>どのサービスをお探しですか？</QueryCardHeader>
          <SimilarServiceList service={service} services={services} selectService={this.selectService} />
        </div>
        <QueryCardFooter
          className='nextQuery select'
          onNext={this.next}
          nextTitle='次へ'
        />
      </div>
    )
  }
}
