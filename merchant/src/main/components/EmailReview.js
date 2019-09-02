import React from 'react'
import { TextField, IconButton } from '@material-ui/core'
import { withStyles } from '@material-ui/core'
import { amber } from '@material-ui/core/colors'
import EditIcon from '@material-ui/icons/Edit'
import StarIcon from '@material-ui/icons/Star'

import UserAvatar from 'components/UserAvatar'
import { webOrigin } from '@smooosy/config'


@withStyles(theme => ({
  avatar: {
    margin: '0 auto',
    minWidth: 80,
    minHeight: 80,
    borderRadius: 40,
  },
  label: {
    width: 30,
    height: 30,
    float: 'right',
    color: theme.palette.grey[500],
    '&:hover ~ a': {
      color: amber[700],
    },
    '&:hover': {
      color: amber[700],
    },
  },
  text: {
    width: '100%',
    background: '#fff',
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    padding: 10,
    margin: 3,
    lineHeight: 1.2,
  },
  textInput: {
    width: '100%',
    background: '#fff',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 3,
    margin: 2,
  },
  editButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 20,
    height: 20,
  },
  icon: {
    width: 20,
    height: 20,
  },
}), {withTheme: true})
export default class EmailReview extends React.Component {
  state = {}

  render() {
    const { text, pro, profile, url, classes, forEmail, onChange, theme } = this.props
    const { edit } = this.state

    const link = url || `${forEmail ? webOrigin : ''}/r/${profile.shortId}`

    // Gmailはinline cssしか受け付けない
    const styles = forEmail ? {
      avatar: {
        margin: '0 auto',
        width: 80,
        height: 80,
        minWidth: 80,
        minHeight: 80,
        borderRadius: 40,
      },
      label: {
        width: 30,
        height: 30,
        float: 'right',
        color: theme.palette.grey[500],
        background: 'url(https://smooosy.com/images/star.png) center/cover',
      },
      text: {
        width: '100%',
        background: '#fff',
        whiteSpace: 'pre-wrap',
        fontSize: 14,
        padding: 10,
        margin: 3,
        lineHeight: 1.2,
      },
    } : {}

    return (
      <div>
        <div style={{textAlign: 'center', width: '100%', marginTop: 20}}>
          {pro.imageUpdatedAt &&
            <UserAvatar user={pro} className={classes.avatar} style={styles.avatar} imgProps={{style: styles.avatar}} />
          }
          <h4 style={{margin: '15px 0 0', fontSize: 20}}>{profile.name}</h4>
          <div style={{width: 150, height: 30, margin: '0 auto'}}>
            <a style={styles.label} className={classes.label} href={`${link}?rating=5`} target='_blank' rel='noopener noreferrer'><StarIcon style={{width: 30, height: 30}} /></a>
            <a style={styles.label} className={classes.label} href={`${link}?rating=4`} target='_blank' rel='noopener noreferrer'><StarIcon style={{width: 30, height: 30}} /></a>
            <a style={styles.label} className={classes.label} href={`${link}?rating=3`} target='_blank' rel='noopener noreferrer'><StarIcon style={{width: 30, height: 30}} /></a>
            <a style={styles.label} className={classes.label} href={`${link}?rating=2`} target='_blank' rel='noopener noreferrer'><StarIcon style={{width: 30, height: 30}} /></a>
            <a style={styles.label} className={classes.label} href={`${link}?rating=1`} target='_blank' rel='noopener noreferrer'><StarIcon style={{width: 30, height: 30}} /></a>
            <div style={{clear: 'both'}} />
          </div>
        </div>
        <div style={{position: 'relative', margin: 20}}>
          {edit ?
            <TextField
              multiline
              autoFocus
              value={text}
              onBlur={() => this.setState({edit: false})}
              onChange={e => onChange(e.target.value)}
              rowsMax={10}
              className={classes.textInput}
              InputProps={{disableUnderline: true, style: {padding: 10}}}
            />
          :
            <div style={styles.text} className={classes.text}>{text}</div>
          }
          {!forEmail && !edit &&
            <IconButton className={classes.editButton} onClick={() => this.setState({edit: !edit})}>
              <EditIcon className={classes.icon} />
            </IconButton>
          }
        </div>
      </div>
    )
  }
}
