import React, { useState } from 'react'
import Linkify from 'react-linkify'
import { Table, TableBody, Button, Paper } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import CheckIcon from '@material-ui/icons/Check'
import CloseIcon from '@material-ui/icons/Close'
import { indigo } from '@material-ui/core/colors'

import GoogleMapStatic from 'components/GoogleMapStatic'
import UserAvatar from 'components/UserAvatar'
import CustomRow from 'components/CustomRow'
import CustomChip from 'components/CustomChip'
import CountDown from 'components/CountDown'
import MediaSlider from 'components/MediaSlider'
import TelLink from 'components/TelLink'
import ConfirmDialog from 'components/ConfirmDialog'
import ExactMatchChip from 'components/pros/ExactMatchChip'
import { relativeTime } from 'lib/date'
import { imageSizes, FlowTypes } from '@smooosy/config'

@withTheme
export default class RequestInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      slideNumber: null,
      media: [],
    }
  }

  selectMedia = (media, slideNumber) => {
    this.setState({media, slideNumber})
  }

  render() {
    const { request, customer, profile, noCountDown, pointComponent, customerSpace, middleSpace, showAll, theme, forLead, hideHeader, onDisplayPhone, hidePhone } = this.props
    const { media, slideNumber } = this.state

    const { common, grey, primary } = theme.palette

    const styles = {
      root: {
        position: 'relative',
        background: common.white,
      },
      map: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        minHeight: 90,
      },
      avatar: {
        zIndex: 2,
        margin: request.loc ? '-40px auto 0' : '10px auto 0',
        border: `4px solid ${common.white}`,
        width: 80,
        height: 80,
      },
      title: {
        padding: 10,
        background: grey[100],
        borderTop: `1px solid ${grey[300]}`,
        borderBottom: `1px solid ${grey[300]}`,
      },
      matchmore: {
        background: indigo[500],
        color: theme.palette.common.white,
        marginRight: 5,
        verticalAlign: 'bottom',
      },
    }

    let mapView
    if (request.loc) {
      const destination = {
        lat: request.loc.coordinates[1],
        lng: request.loc.coordinates[0],
        icon: 'red',
      }
      const markers = [destination]
      if (profile && profile.loc) {
        markers.unshift({
          lat: profile.loc.coordinates[1],
          lng: profile.loc.coordinates[0],
          icon: 'green',
        })
      } else if (this.props.admin) {
        markers.push(
          ...request.meets.map(m => ({
            lat: m.profile.loc.coordinates[1],
            lng: m.profile.loc.coordinates[0],
            icon: 'green',
          }))
        )
      }
      mapView = (
        <GoogleMapStatic
          style={{width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover'}}
          width={400}
          height={200}
          center={destination}
          zoom={markers.length > 1 ? null : 14}
          markers={markers}
        />
      )
    }

    return (
      <div style={styles.root}>
        {!hideHeader &&
          <>
            <div style={styles.map}>
              {mapView}
              <UserAvatar size={320} user={customer} style={styles.avatar} />
            </div>
            <div style={{textAlign: 'center'}}>
              {this.props.admin && request.flowType === FlowTypes.PPC && <CustomChip style={styles.matchmore} label='ご指名' />}
              <h4>{customer.lastname}様</h4>
              <div style={{fontSize: 13, color: grey[700]}}>{request.address}</div>
              {!hidePhone &&
                <div style={{fontSize: 13, color: grey[700]}}>
                  <span>電話番号: </span>
                  {onDisplayPhone && request.phone === 'hidden' ?
                    <ShowTelLink onSubmit={onDisplayPhone} />
                  : request.phone ?
                    <TelLink phone={request.phone} gaEvent={{action: 'RequestInfo_click', id: request.id}} />
                  : 'なし'}
                  {/* // TODO: SMS 通知期間（リリース翌日）がすぎたら削除して良い */}
                  {this.props.admin && request.smsAgree ? ' SMS OK' : '' }
                </div>
              }
              {request.isExactMatch && <ExactMatchChip />}
              <div style={{display: 'flex', justifyContent: 'center'}}>
                {customerSpace}
              </div>
              <div style={{height: 20}} />
              <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', paddingBottom: 10}}>
                <div style={{width: '33%'}}>
                  <p style={{fontSize: 13}}>{noCountDown ? '依頼日時' : '応募期限'}</p>
                  {noCountDown ?
                    <p style={{fontSize: 20}}>{relativeTime(new Date(request.createdAt))}</p>
                    :
                    <CountDown style={{fontSize: 18}} start={new Date(request.createdAt)} includeSecond={true} prefix='' lineBreak={true} />
                  }
                </div>
                <div style={{width: '33%'}}>
                  <p style={{fontSize: 13}}>プロ数</p>
                  <p style={{fontSize: 26}}>{Math.min(5, request.meets.length)}/5</p>
                </div>
                {profile &&
                  <div style={{width: '33%'}}>
                    {pointComponent}
                  </div>
                }
              </div>
            </div>
            {middleSpace}
            <h4 style={{...styles.title, display: 'flex', alignItems: 'center'}}>
              <span style={{flex: 1}}>依頼内容</span>
              {this.props.admin > 2 &&
                <Button variant='contained' color='secondary' onClick={() => this.props.edit()}>編集</Button>
              }
            </h4>
          </>
        }
        <div style={{position: 'relative'}}>
          {forLead && forLead}
          <Table style={{tableLayout: 'fixed'}}>
            <TableBody>
              <CustomRow title='サービス名'>
                {request.service.name}
                {request.canWorkRemotely && <CustomChip style={{marginLeft: 10}} label='リモート可' />}
              </CustomRow>
              {request.description.filter(d => showAll || d.answers.filter(a => (a.text || '').trim() || a.image).length).slice(0, forLead ? 4 : undefined).map((desc, i) => {
                const checked = desc.answers.filter(a => a.checked).length > 0
                return (
                  <CustomRow key={i} title={desc.label}>
                    {desc.answers.map((a, idx) => (
                      <div key={a._id} style={{display: 'flex', alignItems: 'center', whiteSpace: 'pre-wrap'}}>
                        {checked &&
                          (a.checked ?
                            <CheckIcon style={{marginRight: 10, color: primary.main}} />
                            :
                            <CloseIcon style={{marginRight: 10, color: grey[300]}} />
                          )
                        }
                        <Linkify properties={{target: '_blank', rel: 'nofollow'}}>{a.text}</Linkify>
                        {a.image && <Paper style={{width: 30, height: 30, margin: '1px 8px', cursor: 'pointer'}}><img alt={a.text} style={{width: '100%', height: '100%'}} src={a.image + imageSizes.c80} onClick={() => this.selectMedia(desc.answers.filter(a => a.image).map(a => ({url: a.image, text: a.text})), idx)} /></Paper>}
                      </div>
                    ))}
                  </CustomRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <MediaSlider media={media} slideNumber={slideNumber} onClose={() => this.setState({slideNumber: null})} />
      </div>
    )
  }
}

const ShowTelLink = ({onSubmit}) => {
  const [ open, openDialog ] = useState(false)

  return (
    <>
      <a onClick={() => openDialog(true)}>表示する</a>
      <ConfirmDialog
        open={open}
        title='電話番号を表示すると既読扱いになります'
        label='表示する'
        onSubmit={onSubmit}
        onClose={() => openDialog(false)}
      >
        表示することで、未読のポイント返還が無くなります
      </ConfirmDialog>
    </>
  )
}
