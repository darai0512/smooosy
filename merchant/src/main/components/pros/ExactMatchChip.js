import React from 'react'
import Chip from '@material-ui/core/Chip'
import { withStyles } from '@material-ui/core/styles'

export default withStyles(theme => ({
  root: {
    display: 'inline-block',
    height: 24,
    background: '#74B000',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 2,
    color: theme.palette.common.white,
  },
}))(
  props => <Chip label='仕事条件にマッチ' {...props} />
)
