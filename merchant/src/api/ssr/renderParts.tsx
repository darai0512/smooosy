import * as React from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { SheetsRegistry } from 'jss'
import * as config from 'config'
import * as path from 'path'
import { ChunkExtractor } from '@loadable/server'

import createDOMString from './createDOMString'
import { webOrigin, imageSizes } from '@smooosy/config'

const loadableNodeStatsDir = path.resolve(config.get('loadableNodeStatsDir'))

export function renderWidget(initialData) {
  const nodeExtractor = new ChunkExtractor({
    statsFile: path.resolve(loadableNodeStatsDir, 'loadable-stats.json'),
    entrypoints: ['bundle'],
    outputPath: loadableNodeStatsDir,
  })
  const { reducer, Widget } = nodeExtractor.requireEntrypoint()

  const store = createStore(reducer)
  const sheetsRegistry = new SheetsRegistry()
  let html = createDOMString(
    <Provider store={store}>
      <Widget script {...initialData} />
    </Provider>,
    sheetsRegistry
  )
  html = '<div id="smooosy-widget">' + html + '<style type="text/css">' + sheetsRegistry.toString() + '</style>' + '</div>'
  return html
}

export function renderReviewRequest(initialData) {
  const nodeExtractor = new ChunkExtractor({
    statsFile: path.resolve(loadableNodeStatsDir, 'loadable-stats.json'),
    entrypoints: ['bundle'],
    outputPath: loadableNodeStatsDir,
  })
  const { reducer, EmailReview } = nodeExtractor.requireEntrypoint()

  const store = createStore(reducer)
  const sheetsRegistry = new SheetsRegistry()
  let html = createDOMString(
    <Provider store={store}>
      <EmailReview forEmail {...initialData} />
    </Provider>,
    sheetsRegistry
  )
  html = html + '<style type="text/css">' + sheetsRegistry.toString() + '</style>'
  return html
}

export function renderMediaWidget({profile, isAMP}) {
  let html = createDOMString(
    <div className='su-pro-align'>
      <div className='mm-img'>
        <img className='su-pro-img' src={profile.pro.image + imageSizes.c80} />
      </div>
      <div className='su-pro-rect'>
        <a className='mm-name su-pro-title' href={`${webOrigin}/p/${profile.shortId}?utm_source=media&utm_medium=profile`}>{profile.name} - {profile.address}</a>
        <div className='mm-desc su-pro-desc'>{profile.description}</div>
      </div>
    </div>
  )
  if (isAMP) {
    html = html.replace(/<img(("[\s\S]*?"|'[\s\S]*?'|[^'"])*?)>/g, (_, m1) => `<amp-img layout="fixed" width="60" height="60" ${m1.slice(0, -1)}></amp-img>`)
  }
  return html
}
