import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import postLicence from 'lib/postLicence'

const LicenceLink = ({licence, hideInfo, hideName, classes, rootClass}) => {
  return (
    <a className={rootClass ? [classes.root, rootClass].join(' ') : classes.root} onClick={() => postLicence(licence)}>
      {hideName ? '' : licence.licence.name} {hideInfo ? '' : licence.info || ''}
    </a>
  )
}

export default withStyles(theme => ({
  root: {
    fontWeight: 'bold',
    color: theme.palette.common.black,
  },
}))(LicenceLink)
