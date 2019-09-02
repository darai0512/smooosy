import React from 'react'
import ZipBox from 'components/ZipBox'
import { GAEvent } from '@smooosy/config'

const Conversion = ({
  service,
  onZipEnter = () => {},
  currentPath,
  matchMoreEnabled,
  defaultZip,
  title,
  zipBoxClassName,
  zipBoxTitleClassName,
  ga = {},
  position = '',
  ...custom
}) => (
  <ZipBox
    gaEvent={{
      category: GAEvent.category.dialogOpen,
      action: ga.pageType,
      label: service.key,
    }}
    service={service}
    currentPath={currentPath}
    onEnter={zip => onZipEnter(zip, position)}
    defaultZip={defaultZip}
    position={position}
    title={title}
    zipBoxClassName={zipBoxClassName}
    zipBoxTitleClassName={zipBoxTitleClassName}
    {...custom}
  />
)

export default Conversion
