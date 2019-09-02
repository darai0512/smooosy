import { configure, addDecorator } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { muiTheme } from 'storybook-addon-material-ui'
import theme from '../src/main/theme'

function loadStories() {
  const req = require.context('../stories', true, /\.*\.js$/)
  req.keys().forEach(filename => req(filename))
}

addDecorator(muiTheme([theme]))
addDecorator(withKnobs)

configure(loadStories, module)