import React from 'react'

import WhiteBox from 'components/WhiteBox'
import ZipInput from 'components/ZipInput'

const ZipBox = ({
  title = 'どの地域でお探しですか？',
  currentPath,
  zipBoxClassName,
  zipBoxTitleClassName,
  gaEvent,
  label,
  onEnter,
  ...custom
}) => (
  <WhiteBox className={zipBoxClassName} titleClassName={zipBoxTitleClassName} title={title}>
    <ZipInput currentPath={currentPath} gaEvent={gaEvent} label={label} onEnter={onEnter} {...custom} />
  </WhiteBox>
)

export default ZipBox
