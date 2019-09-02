import React from 'react'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import UserAvatar from 'components/UserAvatar'

const PickupProAnswer = ({proQuestions, classes, className}) => (
  <div className={className.root}>
    {
      proQuestions.map(pq =>
        pq.answers.length === 0 ? null :
        <div key={pq.id} className={classes.questionContent}>
          <h3 className={classes.question}><HelpOutlineIcon className={classes.questionIcon} width={25} height={25} />{pq.text}</h3>
          {
            pq.answers.map(pa =>
              <div key={pa.id} className={classes.answer}>
                <UserAvatar size={80} user={pa.pro} alt={pa.profile.name} className={classes.proImage} />
                <div className={classes.proAnswer}>
                  <Link className={classes.proName} to={`/p/${pa.profile.shortId}`}>{pa.profile.name}</Link>
                  {' '}
                  <span className={classes.proAddress}>{pa.profile.prefecture}{pa.profile.city}</span>
                  <div className={classes.text}><p>{pa.text}</p></div>
                </div>
              </div>
            )
          }
        </div>
      )
    }
  </div>
)

export default withStyles(theme => ({
  questionContent: {
    padding: '20px 0',
  },
  question: {
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
  },
  questionIcon: {
    width: 25,
    height: 25,
  },
  answer: {
    display: 'flex',
    marginTop: 10,
  },
  proImage: {
    width: 80,
    height: 80,
    marginTop: 10,
    [theme.breakpoints.down('xs')]: {
      width: 50,
      height: 50,
    },
  },
  proName: {
    fontSize: 18,
  },
  proAddress: {
    fontSize: 14,
    color: theme.palette.grey[700],
  },
  proAnswer: {
    marginLeft: 20,
    width: '100%',
  },
  text: {
    fontSize: 14,
    width: '100%',
    position: 'relative',
    display: 'inline-block',
    padding: '7px 10px',
    wordBreak: 'break-all',
    background: theme.palette.common.white,
    border: `solid 1px ${theme.palette.grey[500]}`,
    boxSizing: 'border-box',
    minHeight: 62,
    borderRadius: 5,
    '&::before': {
      position: 'absolute',
      top: 20,
      left: -24,
      marginTop: -12,
      border: '12px solid transparent',
      borderRight: `14px solid ${theme.palette.common.white}`,
      zIndex: 2,
      content: '\'\'',
    },
    '&::after': {
      position: 'absolute',
      top: 20,
      left: -26,
      marginTop: -12,
      border: '12px solid transparent',
      borderRight: `14px solid ${theme.palette.grey[500]}`,
      zIndex: 1,
      content: '\'\'',
    },
    '& p': {
      margin: 0,
      padding: 0,
      whiteSpace: 'pre-wrap',
    },
  },
}))(PickupProAnswer)
