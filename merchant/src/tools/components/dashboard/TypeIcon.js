import React from 'react'
import { grey, blueGrey, orange, brown, green, blue, yellow } from '@material-ui/core/colors'
import LiveHelp from '@material-ui/icons/LiveHelp'

import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import TodayIcon from '@material-ui/icons/Today'
import MapIcon from '@material-ui/icons/Map'
import EditIcon from '@material-ui/icons/Edit'
import ImageIcon from '@material-ui/icons/Image'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'
import ExposurePlus1Icon from '@material-ui/icons/ExposurePlus1'

export const icons = {
  singular: RadioButtonCheckedIcon,
  multiple: CheckBoxIcon,
  calendar: TodayIcon,
  location: MapIcon,
  textarea: EditIcon,
  image: ImageIcon,
  price: MonetizationOnIcon,
  number: ExposurePlus1Icon,
}

export const TypeIcon = props => {
  const Icon = icons[props.type] || LiveHelp
  const color = {
    singular: grey[700],
    multiple: blueGrey[500],
    calendar: orange[500],
    location: green[500],
    textarea: brown[400],
    image: blue[300],
    price: yellow[800],
  }[props.type] || grey[700]

  return <Icon style={{color, ...(props.style || {})}} />
}
