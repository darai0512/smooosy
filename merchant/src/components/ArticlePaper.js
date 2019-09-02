import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { imageOrigin } from '@smooosy/config'

let ArticlePaper = ({ item, onClick, rootClass, descriptionClass, boxClass, classes }) => (
  <div className={[classes.root, rootClass].join(' ')}>
    <div className={classes.wrap} onClick={onClick}>
      <div className={classes.box}>
        <img className={classes.image} src={`${imageOrigin}${item.image}`} />
      </div>
      <div className={[classes.box, boxClass].join(' ')}>
        <div className={classes.info}>
          <div className={[classes.description, descriptionClass].join(' ')}>{item.description}</div>
          <div className={classes.name}>{item.name}</div>
          <div className={classes.address}>{item.address}</div>
        </div>
      </div>
    </div>
  </div>
)

ArticlePaper = withStyles((theme) => ({
  root: {
    padding: '0px 30px 30px',
    [theme.breakpoints.down('sm')]: {
      padding: '0px 20px 20px',
    },
    [theme.breakpoints.down('xs')]: {
      padding: '0px 10px 10px',
    },
  },
  wrap: {
    display: 'flex',
    boxShadow: `0px 3px 6px ${theme.palette.grey[300]}`,
    cursor: 'pointer',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  box: {
    display: 'flex',
    maxWidth: 400,
    width: 400,
    height: 400,
    [theme.breakpoints.down('sm')]: {
      maxWidth: 320,
      width: 320,
      height: 320,
    },
    [theme.breakpoints.down('xs')]: {
      maxWidth: 260,
      width: 260,
      height: 260,
    },
  },
  image: {
    objectFit: 'cover',
    width: '100%',
    pointerEvents: 'none',
  },
  info: {
    flex: 1,
    margin: 'auto',
    fontSize: 18,
    padding: 30,
    [theme.breakpoints.down('sm')]: {
      fontSize: 16,
      padding: 25,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
      padding: 15,
    },
  },
  description: {
    color: theme.palette.grey[700],
    textShadow: '0px 3px 6px #15151515',
    fontSize: 24,
    paddingBottom: 30,
    [theme.breakpoints.down('sm')]: {
      fontSize: 20,
      paddingBottom: 25,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
      paddingBottom: 15,
    },
  },
  name: {
    fontWeight: 'bold',
    padding: '5px 0',
  },
}))(ArticlePaper)

export default ArticlePaper
