import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { createMuiTheme } from '@material-ui/core/styles'
import { ThemeProvider, StylesProvider, createGenerateClassName } from '@material-ui/styles'

import { theme } from '../../main/theme'

const t: any = theme

export default function createDOMString(component, registry?: any) {
  // createGenerateClassNameはwindowがあるとclient判定してwarningを出すので、一旦消す
  /* eslint-disable */
  const tmp = window
  window = undefined
  const generateClassName = createGenerateClassName({productionPrefix: 'mm'})
  window = tmp
  /* eslint-enable */

  return ReactDOMServer.renderToString(
    <StylesProvider
      sheetsRegistry={registry}
      generateClassName={generateClassName}
    >
      <ThemeProvider theme={createMuiTheme(t)}>
        {component}
      </ThemeProvider>
    </StylesProvider>
  )
}