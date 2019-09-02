import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import moment from 'moment'
import { Button, Table, TableBody, TableCell, TableRow, withWidth, withStyles } from '@material-ui/core'
import { indigo, orange } from '@material-ui/core/colors'

import { withApiClient } from 'contexts/apiClient'
import CountDown from 'components/CountDown'
import PassDialog from 'components/pros/PassDialog'
// import Balloon from 'components/Balloon'
import CustomChip from 'components/CustomChip'
import ExactMatchChip from 'components/pros/ExactMatchChip'
import { FlowTypes } from '@smooosy/config'

// const steps = [{
//   disableBeacon: true,
//   title: '依頼を見てみましょう',
//   target: '#see-request',
//   placement: 'bottom',
// }]

@withApiClient
@withRouter
@withWidth({withTheme: true})
@withStyles(theme => ({
  floater: {
    fontSize: 16,
    width: '100%',
    position: 'relative',
    display: 'inline-block',
    padding: '7px 10px',
    background: theme.palette.common.white,
    border: `solid 2px ${theme.palette.grey[500]}`,
    boxSizing: 'border-box',
    borderRadius: 5,
    margin: '10px 0 0 5px',
    '&:before': {
      left: '50%',
      marginLeft: 0,
      content: '\'\'',
      position: 'absolute',
      top: -22,
      border: '6px solid transparent',
      borderBottom: `16px solid ${theme.palette.common.white}`,
      zIndex: 2,
    },
    '&:after': {
      content: '\'\'',
      position: 'absolute',
      left: '50%',
      top: -28,
      marginLeft: -2,
      border: '8px solid transparent',
      borderBottom: `19px solid ${theme.palette.grey[500]}`,
      zIndex: 1,
    },
    [theme.breakpoints.down('xs')]: {
      '&:before': {
        left: '100%',
        marginLeft: -32,
      },
      '&::after': {
        left: '100%',
        marginLeft: -34,
      },
    },
    '& p': {
      margin: 0,
      padding: 0,
      whiteSpace: 'pre-wrap',
    },
  },
  chip: {
    background: indigo[500],
    color: theme.palette.common.white,
    marginRight: 5,
    verticalAlign: 'bottom',
  },
  exactMatchChip: {
    marginLeft: 10,
    marginBottom: 10,
  },
  distanceChip: {
    color: theme.palette.common.white,
    background: orange[600],
    marginLeft: 10,
    marginBottom: 10,
  },
}))
@connect(
  state => ({
    hurry_up_alert: state.experiment.experiments.hurry_up_alert || 'control',
  })
)
export default class RequestCard extends React.Component {

  constructor(props) {
    super(props)
    // const { mode, profileId } = qs.parse(location.search, {ignoreQueryPrefix: true})
    this.state = {
      passModal: false,
      // balloon: mode === 'setup' || (mode === 'signup' && !!profileId),
    }
  }

  omitString = (str, limit) => str.length > limit ? str.substring(0, limit) + '...' : str

  showPassModal = () => {
    this.setState({passModal: true})
  }

  onDetail = (e) => {
    const { profile, openSetupDialog } = this.props
    // profileの自己紹介文がない場合、画面遷移せずsetupダイアログを開く
    if (openSetupDialog && profile && !profile.description) {
      e.preventDefault()
      openSetupDialog(profile)
    }
  }

  onPass = () => {
    this.setState({passModal: false})
    if (this.props.onPass) {
      this.props.onPass()
    }
  }

  render() {
    const { requestForPro, profile, theme, width, withBalloon, classes, hurry_up_alert, showDistance } = this.props
    const { passModal } = this.state
    const { common, grey } = theme.palette

    const styles = {
      root: {
        width: '100%',
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
      },
      title: {
        fontWeight: 'bold',
        fontSize: width === 'xs' ? '14px' : '16px',
        display: 'flex',
        flexDirection: width === 'xs' ? 'column' : 'row',
      },
      info: {
        fontSize: width === 'xs' ? '12px' : '14px',
        display: 'flex',
        flexDirection: 'row',
      },
      customer: {
        margin: 5,
      },
      table: {
        borderTop: `1px solid ${grey[300]}`,
      },
      answer: {
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'pre-wrap',
      },
      answerChip: {
        height: '100%',
        margin: 2,
        backgroundColor: grey[300],
        wordWrap: 'break-word',
        fontSize: 12,
        lineHeight: '1.2em',
        borderRadius: 12,
        padding: '6px 12px',
      },
      header: {
        padding: '0 10px 10px',
        display: 'flex',
        alignItems: 'center',
      },
      cell: {
        position: 'relative',
        margin: '5px 0 15px',
        padding: width === 'xs' ? '10px' : '20px',
        border: `1px solid ${grey[300]}`,
        borderRadius: 8,
        background: common.white,
      },
    }

    const descriptions = {
      calendar: [],
      location: [],
      others: [],
    }
    for (const desc of requestForPro.description) {
      if (desc.answers.length == 0) {
        continue
      }
      switch (desc.type) {
        case 'calendar': {
          descriptions.calendar.push(desc)
          break
        }
        case 'location': {
          descriptions.location.push(desc)
          break
        }
        default: {
          const checkedAnswers = desc.answers.length == 1 ? desc.answers : desc.answers.filter(a => a.checked)
          const answerText = checkedAnswers.map(a => a.text).join(', ')
          if (answerText) {
            descriptions.others.push({
              label: desc.label || desc.summary,
              _id: desc._id,
              text: answerText,
            })
          }
        }
      }
    }

    const isMatchMore = requestForPro.flowType === FlowTypes.PPC && requestForPro.meetId

    const past = moment().diff(moment(requestForPro.createdAt), 'hours')
    let remainingColor = 'inherit'
    let meetsColor = 'inherit'
    if (hurry_up_alert === 'alert') {
      remainingColor = past >= 72 ? theme.palette.red[500] : past >= 48 ? orange[700] : 'inherit'
      meetsColor = requestForPro.meets.length === 4 ? theme.palette.red[500] : requestForPro.meets.length === 3 ? orange[700] : 'inherit'
    }
    return (
      <>
        <div style={styles.cell}>
          <div style={styles.header}>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', flexWrap: 'wrap' }}>
              <div style={styles.title}>
                <div style={{marginRight: width === 'xs' ? 0 : '15px'}}>
                  {isMatchMore && <CustomChip className={classes.chip} label='ご指名' />}
                  {requestForPro.service.name}
                </div>
                <div>{requestForPro.customer.lastname}様</div>
              </div>
              <div style={styles.info}>
                {!isMatchMore &&
                  <div>
                    残り<CountDown prefix='' style={{color: remainingColor, fontSize: 16}} start={new Date(requestForPro.createdAt)} />
                    、応募数 <span style={{color: meetsColor, fontSize: 16}}>{requestForPro.meets.length}</span>/5
                    {requestForPro.canWorkRemotely && <span>、<span style={{fontWeight: 'bold'}}>リモート可</span></span>}
                  </div>
                }
              </div>
            </div>
            {width !== 'xs' &&
            <div>
              {!isMatchMore &&
                <Button style={{marginLeft: 10, minWidth: width === 'xs' ? '60px' : '88px'}} onClick={this.showPassModal}>パス</Button>
              }
              <Button id={withBalloon ? 'see-request' : ''} variant='contained' color='primary' style={{marginLeft: 10}} component={Link} to={isMatchMore ? `/pros/contacts/${requestForPro.meetId}` : `/pros/requests/${requestForPro._id}`} onClick={this.onDetail}>詳細を見る</Button>
            </div>}
          </div>
          {showDistance && <CustomChip className={classes.distanceChip} label={`約${Math.round(requestForPro.distance / 1000)} km`} />}
          {requestForPro.isExactMatch && <ExactMatchChip className={classes.exactMatchChip} />}
          <Table style={styles.table}>
            <TableBody>
              {descriptions.location.map(desc =>
                <AnswerRow key={desc._id} title={desc.label || desc.summary}>
                  {desc.answers.map(a => <div key={a._id} style={styles.answer}>{a.text}</div>)}
                </AnswerRow>
              )}
              {descriptions.calendar.map(desc =>
                <AnswerRow key={desc._id} title={desc.label || desc.summary}>
                  {desc.answers.map(a => <div key={a._id} style={styles.answer}>{a.text}</div>)}
                </AnswerRow>
              )}
            </TableBody>
          </Table>
          <div style={{marginTop: 10, display: 'flex', flexWrap: 'wrap'}}>
          {descriptions.others.map(desc =>
            <div key={desc._id} style={styles.answerChip}>{this.omitString(`${desc.label || desc.summary}: ${desc.text}`, 100)}</div>
          )}
          </div>
          {width === 'xs' &&
          <div style={{display: 'flex', flexDirection: 'row', marginTop: '5px'}}>
            {!isMatchMore && <Button style={{flex: 1}} onClick={this.showPassModal}>パス</Button>}
            <Button id={withBalloon ? 'see-request' : ''} variant='contained' color='primary' style={{flex: 1}} component={Link} to={isMatchMore ? `/pros/contacts/${requestForPro.meetId}` : `/pros/requests/${requestForPro._id}`} onClick={this.onDetail}>詳細を見る</Button>
          </div>}
          <PassDialog requestForPro={requestForPro} profile={profile} open={!!passModal} onClose={this.onPass} />
        </div>
        {/* <Balloon
          disableOverlay
          steps={steps}
          open={this.state.balloon}
          floaterProps={{hideArrow: true}}
        >
          <div className={classes.floater} onClick={() => this.setState({balloon: false})}>
            <p>依頼を見てみましょう!</p>
          </div>
        </Balloon> */}
      </>
    )
  }
}

@withWidth()
class AnswerRow extends React.Component {
  render() {
    const { title, children, width } = this.props
    const styles = {
      root: {
        height: 'initial',
        display: 'flex',
        flexDirection: 'row',
      },
      title: {
        padding: 10,
        height: 'initial',
        overflow: 'initial',
        textOverflow: 'initial',
        whiteSpace: 'initial',
        width: '20%',
        minWidth: '120px',
        fontSize: width === 'xs' ? '12px' : '14px',
      },
      body: {
        padding: 10,
        flex: 1,
        height: 'initial',
        overflow: 'initial',
        textOverflow: 'initial',
        whiteSpace: 'initial',
        wordBreak: 'break-all',
        fontSize: width === 'xs' ? '12px' : '14px',
      },
    }

    return (
      <TableRow style={styles.root}>
        <TableCell padding='none' style={styles.title}>{title}</TableCell>
        <TableCell style={styles.body}>{children}</TableCell>
      </TableRow>
    )
  }
}
