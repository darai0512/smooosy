import React from 'react'
import { payment } from '@smooosy/config'

const CreditCard = ({info}) => {
  if (!info) {
    return <div>なし</div>
  }

  const brandImage = payment.cardBrandImages[info.brand.replace(' ', '').toLowerCase()]

  const showInfo = !!(info.last4 && info.exp_month && info.exp_year && info.name)

  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
       {brandImage && <img alt={info.brand} src={brandImage} style={{width: 40, height: 25}} />}
       {showInfo &&
         <div style={{marginLeft: 20, fontSize: 12}}>
           <div>下4桁 {info.last4}</div>
           <div>有効期限 {('0' + info.exp_month).slice(-2)}/{info.exp_year}</div>
           <div>{info.name}</div>
         </div>
       }
     </div>
  )
}

CreditCard.defaultProps = {
  info: null,
}

export default CreditCard
