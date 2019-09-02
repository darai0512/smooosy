export {}
const config = require('config')
const { slack, loadXml } = require('./util')

const sitemaps = new Set()
let isLoadSitemapError = false

function productionError(e) {
  if (process.env.NODE_ENV === 'production') console.error(e)
  slack({ message: e.message, room: 'ops'})
  isLoadSitemapError = true
  return e.message
}

async function loadSitemap() {
  const sitemap = await loadXml(`${config.get('sitemap.path')}/sitemap.xml`)
    .catch(e => productionError(e))
  if (!sitemap.sitemapindex || !sitemap.sitemapindex.sitemap) return
  for (const l of sitemap.sitemapindex.sitemap) {
    if (l.loc.length > 0) {
      const path = l.loc[0].split('/')
      const data = await loadXml(`${config.get('sitemap.path')}/${path[path.length - 1]}`)
        .catch(e => productionError(e))
      if (data.urlset && data.urlset.url) {
        data.urlset.url.map(l => sitemaps.add(l.loc[0]))
      }
    }
  }
}
loadSitemap()

module.exports = {
  sitemaps,
  isLoadSitemapError,
}