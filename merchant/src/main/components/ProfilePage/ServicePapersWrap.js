import React from 'react'
import { withStyles } from '@material-ui/core/styles'

import ServicePapers from 'components/ServicePapers'

import { prefectures } from '@smooosy/config'

const ServicePapersWrap = ({classes, services, prefecture}) => (
  <div>
    <h2 className={classes.title}>対応サービス</h2>
    <ServicePapers
      classes={classes}
      className={classes.sliderRoot}
      services={services}
      linkFunction={s => `/services/${s.key}${prefectures[prefecture] ? `/${prefectures[prefecture]}` : ''}`}
    />
  </div>
)

export default withStyles(theme => ({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: '10px 0px',
  },
  sliderRoot: {
    width: '100%',
    '& .slick-track': {
      margin: 0,
    },
  },
  titleWrap: {
    padding: 0,
  },
  serviceWrap: {
    padding: 5,
    [theme.breakpoints.down('xs')]: {
      scrollSnapAlign: 'start',
      '&:last-child': {
        padding: '5px 0px 5px 5px',
      },
      '&:first-child': {
        padding: '5px 5px 5px 0px',
      },
    },
  },
  paperSizeInner: {
    width: 150,
    minWidth: 150,
    maxWidth: 150,
    height: 100,
    minHeight: 100,
    maxHeight: 100,
  },
  paperSizeInnerInline: {
    [theme.breakpoints.down('xs')]: {
      width: 150,
      minWidth: 150,
      maxWidth: 150,
      height: 100,
      minHeight: 100,
      maxHeight: 100,
    },
  },
  paperSize: {
    width: 150,
    minWidth: 150,
    maxWidth: 150,
    height: 150,
  },
}))(ServicePapersWrap)
