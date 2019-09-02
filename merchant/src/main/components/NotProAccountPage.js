import React from 'react'
import ChangeAccountLink from 'components/ChangeAccountLink'

const NotProAccountPage = () => (
  <div style={{margin: 40}}>
    <div style={{fontSize: 20}}>事業者アカウントではありません</div>
    <div style={{marginTop: 20}}>
      別のアカウントでログインしている場合は、再度<ChangeAccountLink>ログイン</ChangeAccountLink>してください。
    </div>
  </div>
)

export default NotProAccountPage
