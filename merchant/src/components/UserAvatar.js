import React from 'react'
import { Avatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { red } from '@material-ui/core/colors'
import { avatarColors } from '@smooosy/config'
import WarningIcon from '@material-ui/icons//Warning'

const UserAvatar = ({size, className, user, classes, imgProps, suspend, large, me, ...rest}) => {
  user = user || {}
  user._id = user._id || user.id || '0'
  user.image = user.image || 'https://smooosy.com/img/users/anonymous.png?'
  size = size || 80
  className = className || ''
  me = me || user
  me._id = me._id || me.id

  const rootClass = [ classes.root, className ]
  const src = `${user.image}&w=${size}&h=${size}`
  if (!user.imageUpdatedAt) {
    const num = parseInt(user._id.slice(-3), 16) % avatarColors.length
    rootClass.push(classes[`color${num}`])
    rootClass.push(classes.padding)
  }
  imgProps = { width: size, height: size, ...imgProps }
  if (!suspend || suspend === '一時休止' || me._id === user._id) {
    return <Avatar src={src} classes={{root: rootClass.join(' '), img: classes.img}} imgProps={imgProps} {...rest} />
  }
  if (large) {
    return <div style={{position: 'relative', width: 75, height: 75}}><WarningIcon style={{position: 'absolute', color: red[500], fontSize: 30, top: -5, left: 40, zIndex: 10}} /><Avatar src={src} classes={{root: rootClass.join(' '), img: classes.img}} imgProps={imgProps} {...rest} /></div>
  }
  return <div style={{position: 'relative', width: 50, height: 50}}><WarningIcon style={{position: 'absolute', color: red[500], fontSize: 20, top: -5, left: 25, zIndex: 10}} /><Avatar src={src} classes={{root: rootClass.join(' '), img: classes.img}} imgProps={imgProps} {...rest} /></div>
}

const styles = {
  root: {
    borderRadius: '20%',
  },
  img: {
    borderRadius: '17%',
  },
  padding: {
    padding: 3,
  },
}

for (let key in avatarColors) {
  styles[`color${key}`] = {
    backgroundColor: avatarColors[key],
  }
}

export default withStyles(styles)(UserAvatar)
