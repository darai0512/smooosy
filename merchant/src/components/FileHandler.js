import React from 'react'
import { getFileType } from 'lib/file'
import { isAcceptablFileMime } from '../lib/validate'

const LIMIT_MB = 10

export default class FileHandler extends React.Component {
  static defaultProps = {
    handleFile: () => {},
    onError: () => {},
    onCreateObjectURL: null,
    acceptance: ['*'],
  }

  fileMatch = type => {
    const { acceptance } = this.props
    if (!type.mime || !type.ext) {
      return 'unknown_file'
    } else if (!isAcceptablFileMime(acceptance, type.mime)) {
      return 'not_acceptable'
    }
    return 'valid'
  }

  handleFile = file => {
    if (file.size > LIMIT_MB  * 1024 * 1024) {
      this.props.onError(`${LIMIT_MB}MB以下のファイルのみ選択可能です`)
      return
    }

    const key = Date.now()

    getFileType(file)
      .then(type => {
        const { acceptance } = this.props
        let error
        if (!type.mime || !type.ext) {
          error = '許可されていないファイルの種類です'
        } else if (!isAcceptablFileMime(acceptance, type.mime)) {
          error = 'このファイルは選択できません'
        }

        if (error) {
          this.props.onError(error)
          return
        }

        this.createObjectURL(file, key)
        this.props.handleFile(file, type, key)
      })
      .catch(e => this.props.onError(e.message || ''))
  }

  onChange = e => {
    if (!e.target.files.length) {
      this.props.onError('ファイルを選択してください')
      return
    }
    for (let file of e.target.files) {
      this.handleFile(file)
    }
    e.target.value = null
  }

  createObjectURL = (file, key) => {
    if (!this.props.onCreateObjectURL) return

    const createObjectURL = (window.URL && window.URL.createObjectURL) ? window.URL.createObjectURL :
      (window.webkitURL && window.webkitURL.createObjectURL) ? window.webkitURL.createObjectURL : null

    if (createObjectURL) {
      const url = createObjectURL(file)
      this.props.onCreateObjectURL(url, key)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target.result
        this.props.onCreateObjectURL(url, key)
      }
      reader.readAsDataURL(file)
    }
  }

  render() {
    const { className } = this.props
    const childrenWithProps = React.Children.map(
      this.props.children,
      child => React.cloneElement(child, {onClick: () => this.upload && this.upload.click()})
    )

    return (
      <>
        {childrenWithProps}
        <input ref={(e) => this.upload = e} type='file' multiple={!!this.props.multiple} accept={this.props.acceptance.join(',')} className={className} style={{display: 'none'}} onChange={this.onChange} />
      </>
    )
  }
}
