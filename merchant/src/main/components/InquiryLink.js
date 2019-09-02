import React from 'react'

const InquiryLink = ({className}) => {
  if (window.Intercom) {
    return <a className={className} onClick={() => window.Intercom('showNewMessage')}>お問い合わせ</a>
  }
  return null
}

export default InquiryLink
