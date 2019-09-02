import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { SheetsRegistry } from 'jss'
import { StaticRouter } from 'react-router'
import * as config from 'config'
import * as path from 'path'
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server'

import createDOMString from './createDOMString'
import { globalStyle, wpStyle, ssrStyle } from '../style'
import {
  commonMetaTags, performanceScript, dnsPrefetch, serviceWorker,
  ampMetaTags, experimentStyles, ampBoilerplate, ampAnalytics, getScriptTagNoBundle,
} from './htmls'
import { webOrigin } from '@smooosy/config'

const loadableNodeStatsDir = path.resolve(config.get('loadableNodeStatsDir'))
const loadableWebStatsDir = path.resolve(config.get('loadableWebStatsDir'))

// WORKAROUND: muiがwindowがあるとclientと判定してuseLayoutEffectを使うのでSSRでは上書きする
Object.assign(React, {useLayoutEffect: React.useEffect})

export function renderApp(req, res, initialData: any = {}, hasAMP, onlySSR) {
  // make data same as client (e.g. _id)
  initialData = JSON.parse(JSON.stringify(initialData))
  const context: any = {}
  const sheetsRegistry = new SheetsRegistry()
  const isAMP = /^\/amp\//.test(req.path)
  onlySSR = onlySSR && !isAMP

  const nodeExtractor = new ChunkExtractor({
    statsFile: path.resolve(loadableNodeStatsDir, 'loadable-stats.json'),
    entrypoints: ['bundle'],
    outputPath: loadableNodeStatsDir,
  })
  const { default: App, reducer, AmpProvider, AmpReadMore, Helmet } = nodeExtractor.requireEntrypoint()
  const extractor = new ChunkExtractor({
    statsFile: path.resolve(loadableWebStatsDir, 'loadable-stats.json'),
    entrypoints: ['bundle'],
    outputPath: loadableWebStatsDir,
  })

  if (isAMP) {
    initialData.amp = {
      ReadMore: AmpReadMore,
    }
  }

  const store = createStore(reducer, initialData, applyMiddleware(thunk))
  const location = isAMP ? req.url.replace('/amp/', '/') : req.url
  const body = createDOMString(
    <ChunkExtractorManager extractor={extractor}>
      <AmpProvider value={isAMP}>
        <Provider store={store}>
          <StaticRouter location={location} context={context}>
            <App />
          </StaticRouter>
        </Provider>
      </AmpProvider>
    </ChunkExtractorManager>,
    sheetsRegistry
  )

  if (context.status) {
    res.status(context.status)
  }

  const html = isAMP ? AMPHTML({
    body,
    helmet: Helmet.renderStatic(),
    style: globalStyle + wpStyle + ssrStyle + sheetsRegistry.toString(),
    initialData,
    originalURL: webOrigin + req.path.replace(/^\/amp\//, '/'),
    experiments: req.experiments || {},
    extractor,
  }) : HTML({
    body,
    helmet: Helmet.renderStatic(),
    style: globalStyle + wpStyle + ssrStyle + sheetsRegistry.toString(),
    initialData,
    hasAMP,
    originalURL: webOrigin + req.path,
    ampURL: webOrigin + '/amp' + req.path,
    onlySSR,
    extractor,
  })

  res.send(html)
}

function HTML({body, helmet, style, initialData, hasAMP, originalURL, ampURL, onlySSR, extractor}) {
  return `
<!doctype html>
<html lang="ja">
  <head>
    ${onlySSR ? performanceScript : ''}
    ${commonMetaTags}
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
    ${hasAMP ? `<link rel="amphtml" href="${ampURL}" />` : ''}
    <link rel="canonical" href="${originalURL}" />
    ${dnsPrefetch}
    ${onlySSR ? '' : extractor.getLinkTags()}
    <style>${style}</style>
    ${serviceWorker}
  </head>
  <body>
    <div id="root">${body}</div>
    ${onlySSR ? `${getScriptTagNoBundle()}${extractor.getLinkTags()}` :
    `<script id="initial-data">window.__STATE__=${JSON.stringify(initialData).replace(/</g, '\\u003c')}</script>${extractor.getScriptTags()}`}
  </body>
</html>
  `
}

function AMPHTML({body, helmet, style, initialData, originalURL, experiments, extractor}) {
  body = body
    // imgタグを amp-imgタグに変換
    .replace(/<img layout=["']([\w\-]*)["'](("[\s\S]*?"|'[\s\S]*?'|[^'"])*?)>/g, (_, m1, m2) => `<amp-img layout="${m1}"${m2.replace(/\/$/, '')}></amp-img>`)
    .replace(/<img (("[\s\S]*?"|'[\s\S]*?'|[^'"])*?)>/g, (_, m1) => `<amp-img layout="responsive" ${m1.replace(/\/$/, '')}></amp-img>`)
    .replace(/focusable="false"/g, '')
    // aタグに data-amp-addparams と data-amp-replace を付与
    .replace(/<a (("[\s\S]*?"|'[\s\S]*?'|[^'"])*?)>/g, (_, m1) => `<a ${/data-amp-addparams=/.test(m1) ? m1 : `${m1} data-amp-addparams="ampId=CLIENT_ID(uid)" data-amp-replace="CLIENT_ID"`}>`)
    .replace(/ style="[^"]*"/g, '')
    // 不要なspellcheckを削除
    .replace(/ spellcheck=["'][^"']*["']/g, '')

  // preload JS
  const scriptPreload = extractor
    .getLinkTags({crossorigin: 'anonymous'})
    .replace(/href="/g, `href="${webOrigin}`)

  return `
<!doctype html>
<html lang="ja" amp>
  <head>
    ${commonMetaTags}
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
    <link rel="canonical" href="${originalURL}" />
    <link rel="preconnect dns-prefetch" href="//smooosy.com" crossorigin="use-credentials" />
    ${scriptPreload}
    ${ampMetaTags({originalURL, initialData})}
    <style amp-custom>${style}${experimentStyles}</style>
    ${ampBoilerplate}
  </head>
  <body>
    <div id="root">${body}</div>
    ${ampAnalytics(experiments)}
  </body>
</html>
  `
}
