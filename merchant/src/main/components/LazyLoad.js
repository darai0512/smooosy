import React from 'react'
import LazyLoad from 'react-lazyload'
import { withAMP } from 'contexts/amp'
import { imageSizes } from '@smooosy/config'

export const LazyLoadImage = withAMP(({isAMP, offset = 100, src, layout, className, ...props}) => {
  if (isAMP) return <img layout={layout} src={src} {...props} />
  const smallSrc = getSmallSrc(src)

  return (
    <LazyLoad offset={offset} height={props.height} placeholder={<img layout={layout} className={[className, 'lazy'].join(' ')} src={smallSrc} data-src={src} data-offset={offset} {...props} />}>
      <img layout={layout} className={className} src={src} {...props} />
    </LazyLoad>
  )
})

const optionRegExp = /&w=[0-9]+&h=[0-9]+(&t=r)?/
const getSmallSrc = (src) => {
  if (optionRegExp.test(src)) {
    return src.replace(optionRegExp, `${imageSizes.c80}$1`)
  }
  return src
}

// If there is no height, all of lazy-loading component, even if offscreen content, are rendered.
export const LazyLoadComponent = withAMP(({isAMP, offset = 200, style = {minHeight: 50}, children}) => {
  if (isAMP) return children

  return (
    <LazyLoad offset={offset} placeholder={<div style={style} />}>{children}</LazyLoad>
  )
})
