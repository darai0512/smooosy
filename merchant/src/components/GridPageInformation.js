import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import ZipBox from 'components/ZipBox'
import ServicePricePaper from 'components/ServicePricePaper'
import { LazyLoadImage } from 'components/LazyLoad'
import { imageSizes } from '@smooosy/config'

const GridPageInformation = (props) => {
  const { information, ZipBoxProps, priceProps, classes } = props
  return (
    <div className={classes.root}>
      {information.map((info, i) => {
        if (info.type === 'zipbox') {
          return (
            <div key={i} className={classes.zipbox}>
              <ZipBox {...ZipBoxProps} />
            </div>
          )
        }
        if (info.type === 'price' && priceProps && priceProps.price && priceProps.service) {
          return (
            <div key={i} className={classes.zipbox}>
              <ServicePricePaper {...priceProps} />
            </div>
          )
        }
        return (
          <div key={i} className={classes.col + ' ' + classes[`col${info.column}`]}>
            <div className={classes.content}>
              {info.title && <h4 className={classes.title + ' ' + classes[`title${info.column}`]}>{info.title}</h4>}
              {info.image &&
                <div className={classes.imageWrap}>
                  <LazyLoadImage offset={200} alt={info.alt} src={info.image + imageSizes.column(info.column, info.ratio)} width='2000' height='2000' className={classes.image} />
                  {info.user && info.user.lastname &&
                    <p className={classes.mediaCaption}>photo by {info.user.lastname}{info.user.firstname}</p>
                  }
                </div>
               }
              {info.text && <p className={classes.text} dangerouslySetInnerHTML={{__html: info.text}} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default withStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '10px auto 30px',
    [theme.breakpoints.down('xs')]: {
      width: '90%',
      margin: '0 auto 10px',
    },
  },
  zipbox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  col3: {
    width: '25%',
    [theme.breakpoints.down('xs')]: {
      width: '50%',
    },
  },
  col4: {
    width: '33.333333%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  col6: {
    width: '50%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  col8: {
    width: '66.666666%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  col12: {
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  col: {
    padding: 10,
    [theme.breakpoints.down('xs')]: {
      margin: '0 auto',
      padding: 4,
    },
  },
  title3: {
    fontSize: 20,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  title4: {
    fontSize: 20,
  },
  title6: {
    fontSize: 20,
  },
  title8: {
    fontSize: 20,
  },
  title12: {
    fontSize: 28,
  },
  title: {
    borderBottom: `2px solid ${theme.palette.grey[700]}`,
    padding: '5px 10px',
    margin: '10px 0',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    maxWidth: '100%',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  },
  mediaCaption: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    padding: '2px 4px',
    fontSize: 10,
    color: 'rgba(255, 255, 255, .8)',
    textShadow: '0 0 5px rgba(0, 0, 0, .8)',
    [theme.breakpoints.down('xs')]: {
      padding: '1px 2px',
      fontSize: 6,
    },
  },
  text: {
    whiteSpace: 'pre-wrap',
    padding: '0 5px 5px',
    fontSize: '.9rem',
    lineHeight: 1.8,
  },
}))(GridPageInformation)
