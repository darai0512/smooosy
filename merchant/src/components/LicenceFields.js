import React from 'react'
import { Field } from 'redux-form'
import qs from 'qs'
import { Avatar, Button, CircularProgress, IconButton, MenuItem } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import AlertWarning from '@material-ui/icons/Warning'
import ContentAdd from '@material-ui/icons/Add'
import ContentClean from '@material-ui/icons/Clear'
import ImageAddAPhoto from '@material-ui/icons/AddAPhoto'
import CloseIcon from '@material-ui/icons/Close'

import { withApiClient } from 'contexts/apiClient'

import renderTextInput from 'components/form/renderTextInput'
import renderSelect from 'components/form/renderSelect'
import FileUploader from 'components/FileUploader'
import LicenceLink from 'components/LicenceLink'

import { fileMime } from '@smooosy/config'

@withTheme
export default class LicenceFields extends React.Component {
  verifyMessage = (status) => {
    return {
      'valid': '✔︎ 確認済み',
      'invalid': '✘ 資格情報が確認できませんでした',
      'pending': '※ 事務局スタッフが確認中です。確認され次第プロフィールに表示されます。',
    }[status] || ''
  }

  render () {
    const { fields, meta, values, theme, licences, ...custom } = this.props
    if (!licences) return null
    const { grey } = theme.palette

    const styles = {
      root: {
        position: 'relative',
        background: grey[100],
        border: `1px solid ${grey[300]}`,
        padding: 10,
        margin: '10px 0px',
      },
      removeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 32,
        height: 32,
        zIndex: 1,
      },
    }

    const unselectedLicence = licences.filter(l => !values.map(v => v.licence).includes(l.id))
    return (
      <div {...custom}>
        {fields.map((f, idx, fields) => {
          const field = fields.get(idx)
          const licence = licences.find(l => l.id === field.licence) || {}
          const infoLabel = licence.infoLabel
          const search = licence.search
          return (
            <div key={`licence_${idx}`} style={styles.root}>
              <IconButton onClick={() => fields.remove(idx)} style={styles.removeButton}><ContentClean /></IconButton>
              {field._id ?
                <div>
                  <div style={{marginTop: 10, fontSize: 13, fontWeight: 'bold', color: '#666'}}>資格・免許の種類</div>
                  <div>{licence.name}</div>
                  <div style={{marginTop: 10, fontSize: 13, fontWeight: 'bold', color: '#666'}}>{infoLabel}</div>
                  <LicenceLink licence={field} hideName />
                  <div style={{marginTop: 10}}>{this.verifyMessage(field.status)}</div>
                </div>
              :
                <div>
                  <Field name={`${f}.licence`} label='資格・免許の種類を選んでください' component={renderSelect} fullWidth={true} style={{marginBottom: 16}}>
                    {unselectedLicence.map(l => <MenuItem button key={l.key} value={l.id} >{l.name}</MenuItem>)}
                  </Field>
                  {licence.needText && infoLabel &&
                    <div>
                      <Field name={`${f}.info`} label={infoLabel} component={renderTextInput} />
                      {search && <a href={search} target='_blank' rel='noopener noreferrer' style={{fontSize: 11, textDecoration: 'underline'}}>{infoLabel}を検索する</a>}
                    </div>
                  }
                  {licence.needImage && <Field name={`${f}.image`} component={renderImageField} handleFile={this.onChange}>アップロード</Field>}
                </div>
              }
            </div>
          )
        })}
        <div style={{marginBottom: 10}}>
          <Button variant='contained' style={{ backgroundColor: '#fff' }} onClick={() => fields.push({status: 'pending'})} >
            <ContentAdd style={{width: 16, height: 16}} />
            追加する
          </Button>
        </div>
      </div>
    )
  }
}

@withApiClient
@withTheme
class renderImageField extends React.Component {
  state = {}
  onCreateObjectURL = (url) => {
    this.setState({
      imageUrl: url,
      uploading: true,
    })
  }

  handleFile = ({data}) => {
    this.props.input.onChange(data.imageUrl)
    this.setState({
      uploading: false,
      uploaded: true,
    })
  }

  deleteIdImage = () => {
    const { uploaded, key } = this.state
    if (uploaded) {
      this.props.apiClient.delete(`/api/licences/image?${qs.stringify({key})}`)
        .then(() => this.setState({uploaded: false, key: null}))
    }
    this.setState({imageUrl: null})
    this.props.input.onChange(null)
  }

  render() {
    const { theme, meta: { touched, error } } = this.props
    const { imageUrl, uploading, uploaded } = this.state
    const { grey, red, common } = theme.palette
    const styles = {
      add: {
        position: 'absolute',
        width: 50,
        height: 50,
        top: '50%',
        left: '50%',
        background: grey[500],
        margin: '-25px 0 0 -25px',
      },
      alertIcon: {
        width: 18,
        height: 18,
        color: red[500],
        verticalAlign: 'bottom',
      },
      error: {
        minHeight: 10,
        fontSize: 12,
        color: red[500],
        padding: '0 5px',
      },
      upload: {
        position: 'relative',
        width: 280,
        height: 180,
        marginBottom: 10,
        padding: 20,
        background: grey[100],
        border: `2px dashed ${grey[500]}`,
        cursor: 'copy',
      },
      uploadImage: {
        position: 'relative',
        height: 180,
        width: 280,
        marginBottom: 10,
        background: `url(${imageUrl}) center/contain no-repeat`,
      },
    }

    return (
      <div>
        <FileUploader
          endPoint={({type}) => `/api/licences/getSignedUrl?${qs.stringify(type)}`}
          acceptance={[fileMime.types.image.all]}
          handleFile={this.handleFile}
          onError={this.handleFileError}
          onCreateObjectURL={this.onCreateObjectURL}
        >
        {uploading ?
            <CircularProgress style={{width: 40, height: 40}} />
          : !imageUrl ?
          <div>
            <div style={styles.upload}>
              <div style={{display: 'flex'}}>
                <img alt='匿名アイコン' src='/images/anonymous.png' style={{width: 80, height: 90, background: grey[300]}} />
                <div style={{margin: '0 20px', flex: 1}}>
                  <div style={{background: grey[300], height: 15, width: 120}} />
                  <div style={{background: grey[300], height: 10, width: 110, marginTop: 10}} />
                </div>
              </div>
              <div style={{background: grey[300], height: 10, width: 190, marginTop: 20}} />
              <div style={{background: grey[300], height: 10, width: 220, marginTop: 10}} />
              <Avatar alt='写真追加' style={styles.add} color={common.white}><ImageAddAPhoto /></Avatar>
            </div>
          </div>
          : null}
        </FileUploader>
        {uploaded &&
          <div>
            <div style={{display: 'flex'}}>
              <div style={styles.uploadImage} />
              <IconButton onClick={() => this.deleteIdImage()}><CloseIcon /></IconButton>
            </div>
          </div>
        }
        {touched && error && <p style={styles.error}><AlertWarning style={styles.alertIcon} />{error}</p>}
      </div>
    )
  }
}
