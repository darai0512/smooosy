import React from 'react'
import { Avatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { imageOrigin } from '@smooosy/config'

let Member = ({member, classes}) => (
  <div className={classes.root}>
    <Avatar className={classes.image} alt={member.name} src={`${imageOrigin}/${member.image}`} />
    <div className={classes.name}>{member.name}</div>
    <div className={classes.job}>{member.job}</div>
    <div className={classes.desc}>{member.desc}</div>
    <div className={classes.career}>{member.career}</div>
  </div>
)

Member = withStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    maxWidth: 250,
  },
  image: {
    width: 140,
    height: 140,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    height: 30,
  },
  job: {
    marginTop: 10,
  },
  desc: {
    width: '100%',
    marginTop: 20,
    textAlign: 'left',
  },
  career: {
    width: '100%',
    marginTop: 4,
    textAlign: 'left',
  },
}))(Member)

export default Member
