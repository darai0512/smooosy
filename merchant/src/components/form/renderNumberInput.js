import React from 'react'
import RenderTextInput from 'components/form/renderTextInput'

export default function renderNumberInput(props) {
  const newProps = { ...props, type: 'number' }
  return <RenderTextInput {...newProps} />
}
