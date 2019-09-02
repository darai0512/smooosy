import React from 'react'
import levenshtein from 'fast-levenshtein'
import { frequentlyTypoDomain } from '@smooosy/config'

const typoCheck = (email, onFix) => {
  if (!email) return
  const domain = (email.match(/^.+@(.+)$/) || [])[1]
  if (domain && !frequentlyTypoDomain.includes(domain)) {
    let suggest
    for (let freq of frequentlyTypoDomain) {
      const distance = levenshtein.get(domain, freq)
      if (0 < distance && distance < 3) {
        suggest = email.replace(domain, freq)
        // 1文字typoを優先
        if (distance === 1) break
      }
    }
    if (suggest) return <span><span onClick={() => onFix(suggest)} style={{textDecoration: 'underline', cursor: 'pointer'}}>{suggest}</span> ではありませんか？</span>
  }
}

export default typoCheck
