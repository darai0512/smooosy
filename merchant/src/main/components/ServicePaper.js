import React from 'react'
import { Link } from 'react-router-dom'
import { Paper, Button } from '@material-ui/core'
import withStyles from '@material-ui/core/styles/withStyles'
import GAEventTracker from 'components/GAEventTracker'
import { LazyLoadImage } from 'components/LazyLoad'
import { imageSizes } from '@smooosy/config'

@withStyles(theme => ({
  service: {
    position: 'relative',
    borderRadius: 5,
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  image: {
    display: 'block',
    minWidth: 200,
    minHeight: 120,
    maxWidth: 300,
    maxHeight: 180,
    objectFit: 'cover',
  },
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 200,
    minHeight: 120,
    maxWidth: 300,
    maxHeight: 180,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, .12)',
  },
  priceButton: {
    fontSize: 20,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  },
  maskHover: {
    opacity: 0,
    [theme.breakpoints.down('xs')]: {
      opacity: 1,
      zIndex: 10,
    },
    '&:hover': {
      opacity: 1,
    },
    '&:hover > .hoverButton': {
      background: theme.palette.primary.main,
    },
  },
  desc: {
    padding: 8,
    color: theme.palette.common.black,
    fontSize: 13,
    lineHeight: '1.2em',
    fontWeight: 'bold',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
      background: theme.palette.common.white,
      zIndex: 1,
    },
  },
  priceWrap: {
    padding: '0 8px 8px',
  },
  price: {
    fontSize: 16,
    borderRadius: 2,
    color: theme.palette.common.white,
    backgroundColor: theme.palette.secondary.main,
    minWidth: 120,
    textAlign: 'center',
    padding: '6px 16px',
  },
}))
export default class ServicePaper extends React.PureComponent {
  static defaultProps = {
    services: [],
    onSelect: () => {},
    linkFunction: null,
    hoverText: '',
    showPrice: false,
    gaEvent: {},
  }

  render() {
    const { service, onSelect, linkFunction, hoverText, showPrice, classes, classNames, gaEvent } = this.props

    const link = linkFunction ? {tag: Link, to: linkFunction} : {tag: 'div', to: () => null}
    const textWhenHover = typeof hoverText === 'function' ? hoverText(service) : hoverText

    return (
      <GAEventTracker category={gaEvent.category} action={gaEvent.action} label={gaEvent.label}>
        <link.tag to={link.to(service)} onClick={() => onSelect(service)}>
          <Paper className={[classes.service, classNames.outerSize].join(' ')}>
            <div className={classNames.innerSize}><LazyLoadImage layout='fill' className={[classes.image, classNames.innerSize].join(' ')} src={service.image + imageSizes.service} /></div>
            {hoverText &&
              <div className={[classes.mask, classes.maskHover, classNames.innerSize].join(' ')}>
                <Button variant='contained' color='primary' className='hoverButton'>{textWhenHover}</Button>
              </div>
            }
            {showPrice &&
              <div className={[classes.mask, classNames.innerSize].join(' ')}>
                <Button variant='contained' color='primary' className={classes.priceButton}>{service.price.toLocaleString()}円</Button>
              </div>
            }
            <h4 className={classes.desc}>{service.name}</h4>
          </Paper>
        </link.tag>
      </GAEventTracker>
    )
  }
}
