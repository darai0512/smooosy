import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Hidden } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import EditIcon from '@material-ui/icons/Edit'

const EditHeader = ({classes, profileUrl, onClickShare}) => (
  <div className={classes.editBar}>
    <Link className={classes.editLink} to={profileUrl}><EditIcon className={classes.editIcon} />プロフィールを編集</Link>
    <Hidden implementation='css' xsDown>
      <Button size='medium' variant='contained' color='primary' onClick={() => onClickShare()}>シェアする</Button>
    </Hidden>
  </div>
)

export default withStyles(theme => ({
  editBar: {
    background: theme.palette.grey[800],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    width: '100%',
  },
  requestButton: {
    width: '100%',
    fontSize: 16,
    height: 50,
  },
  editIcon: {
    color: theme.palette.common.white,
    width: 20,
    height: 20,
    marginRight: 5,
    marginBottom: -4,
    padding: 2,
    border: `1px solid ${theme.palette.common.white}`,
  },
  editLink: {
    color: theme.palette.common.white,
  },
}))(EditHeader)
