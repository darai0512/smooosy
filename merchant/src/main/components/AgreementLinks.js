import React from 'react'
import { Link } from 'react-router-dom'

const AgreementLinks = props => {
  const label = props.label || '送信する'

  return (
    <div style={{textAlign: 'center', fontSize: 10, ...props.style}} className={props.className}>
      「{label}」をクリックすることで、当社の
      {props.point ?
        <Link to='/pro-center/point-program' target='_blank'>ポイントプログラム</Link>
      :
        <span>
          <Link to='/policies/terms' target='_blank'>利用規約</Link>
          および
          <Link to='/policies/privacy' target='_blank'>プライバシーポリシー</Link>
        </span>
      }
      に同意したものとみなします。
    </div>
  )
}

export default AgreementLinks
