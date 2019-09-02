import React from 'react'
import Chip from '@material-ui/core/Chip'
import { withStyles } from '@material-ui/core/styles'

export default withStyles({
  root: {
    display: 'inline-block',
    height: 24,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 2,
  },
})(
  props => <Chip {...props} />
)
