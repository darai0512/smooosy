import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Hidden } from '@material-ui/core'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import { withStyles, withTheme } from '@material-ui/core/styles'
import { withRouter } from 'react-router'
import Slider from 'react-slick'

import Loading from 'components/Loading'
import ServicePaper from 'components/ServicePaper'

@withStyles(theme => ({
  serviceWrap: {
    padding: 10,
    [theme.breakpoints.down('xs')]: {
      scrollSnapAlign: 'start',
      '&:last-child': {
        padding: '10px 5vw 10px 10px',
      },
      '&:first-child': {
        padding: '10px 10px 10px 5vw',
      },
    },
  },
  titleWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    margin: '0 auto',
    padding: '20px 40px 0',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      padding: '20px 0 0',
    },
    alignItems: 'flex-end',
  },
  title: {
    color: theme.palette.common.black,
    fontSize: 22,
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  root: {
    padding: '10px 40px',
    position: 'relative',
  },
  rootWrap: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    overflowX: 'visible',
    WebkitOverflowScrolling: 'touch',
  },
  rootSmall: {
    display: 'flex',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x mandatory',
  },
  paperSize: {
    width: 250,
    height: 190,
  },
  paperSizeInline: {
    [theme.breakpoints.down('xs')]: {
      width: 200,
      height: 155,
    },
  },
  paperSizeInner: {
    width: 250,
    height: 150,
  },
  paperSizeInnerInline: {
    [theme.breakpoints.down('xs')]: {
      width: 100,
      height: 120,
    },
  },
  dummyWrap: {
    padding: '0 10px',
  },
  dummyService: {
    width: 250,
  },
}))
@withRouter
export default class ServicePapers extends React.PureComponent {
  static defaultProps = {
    wrap: false,
    categoryKey: '',
    title: '',
    services: [],
    onSelect: () => {},
    linkFunction: null,
    hoverText: '',
    className: '',
    showPrice: false,
    gaEvent: {},
  }

  render() {
    const { wrap, title, services, onSelect, linkFunction, hoverText, className, showPrice, categoryKey, classes, gaEvent } = this.props

    if (services.length === 0) {
      return <Loading style={{height: 230}} />
    }

    const sliderSetting = {
      arrows: true,
      infinite: false,
      variableWidth: true,
      initialSlide: 0,
      slidesToShow: 2,
      slidesToScroll: 2,
      prevArrow: <Arrow align='left' />,
      nextArrow: <Arrow align='right' />,
    }

    const paperClasses = {
      innerSize: wrap ? classes.paperSizeInner : [classes.paperSizeInner, classes.paperSizeInnerInline].join(' '),
      outerSize: wrap ? classes.paperSize : [classes.paperSize, classes.paperSizeInline].join(' '),
    }

    const isAMP = /^\/amp\//.test(this.props.location.pathname)

    let titleComponent = null

    if (title) {
      if (categoryKey) {
        titleComponent =
        <Link to={`/t/${categoryKey}`}>
          <h3 className={classes.title}>{title}</h3>
        </Link>
      } else {
        titleComponent = <h3 className={classes.title}>{title}</h3>
      }
    }

    const servicePaperComponent = (
      services.map(s =>
        <div key={s.id} className={classes.serviceWrap}>
          <ServicePaper
            title={title}
            onSelect={onSelect}
            linkFunction={linkFunction}
            hoverText={hoverText}
            showPrice={showPrice}
            classNames={paperClasses}
            service={s}
            gaEvent={{...gaEvent, label: s.key}}
          />
        </div>
      )
    )

    return (
      <div>
        <div className={classes.titleWrap}>
          {titleComponent}
        </div>
        {wrap ?
          <div className={[classes.rootWrap, className].join(' ')}>
            {servicePaperComponent}
            {[...Array(4)].map((_, i) => (
              <div key={i} className={classes.dummyWrap}><div className={classes.dummyService} /></div>
            ))}
          </div>
        :
          <div>
            <Hidden implementation='css' smUp>
              <div className={[classes.rootSmall, className].join(' ')}>
                {servicePaperComponent}
              </div>
            </Hidden>
            {!isAMP &&
              <Hidden implementation='css' xsDown>
                <div className={[classes.root, className].join(' ')}>
                  <Slider {...sliderSetting}>
                    {servicePaperComponent}
                  </Slider>
                </div>
              </Hidden>
            }
          </div>
        }
      </div>
    )
  }
}

const Arrow = withTheme(withStyles(theme => ({
  base: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    padding: 5,
    marginTop: -25,
  },
  left: {
    left: -35,
  },
  right: {
    right: -45,
  },
  icon: {
    width: 40,
    height: 40,
    color: theme.palette.common.black,
  },
}))(props => {
  const { align, currentSlide, slideCount, onClick, classes, theme } = props
  const { grey, common } = theme.palette

  return align === 'left' ?
    <IconButton disabled={currentSlide === 0} className={[classes.base, classes.left].join(' ')} onClick={onClick}>
      <NavigationChevronLeft className={classes.icon} style={{color: currentSlide === 0 ? grey[300] : common.black}} />
    </IconButton>
  :
    <IconButton disabled={currentSlide + 2 >= slideCount} className={[classes.base, classes.right].join(' ')} onClick={onClick}>
      <NavigationChevronRight className={classes.icon} style={{color: currentSlide + 2 > slideCount ? grey[300] : common.black}} />
    </IconButton>
}))
