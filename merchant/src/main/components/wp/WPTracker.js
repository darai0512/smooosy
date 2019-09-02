import React from 'react'
import { withAMP } from 'contexts/amp'

@withAMP
export default class WPTracker extends React.Component {

  componentDidMount () {
    const { articleId, isAMP } = this.props

    if (!isAMP && articleId) {
      const img = document.createElement('img')
      img.src = `${this.createViewTrackerURL(articleId)}&rand=${Math.random()}`
      img.width = 1
      img.height = 1
      img.className = 'track-img'
      document.body.appendChild(img)
    }
  }

  createViewTrackerURL = (articleId) => {
    // WP jetpackプラグインのview数計測トラッカーを埋め込む
    const domain = process.env.NODE_ENV === 'production' ? 'smooosy.com' : 'dev.smooosy.com'
    const blogId = process.env.NODE_ENV === 'production' ? '132978504' : '153079762'
    return `https://pixel.wp.com/g.gif?v=ext&j=1%3A5.8&blog=${blogId}&post=${articleId}&tz=9&srv=${domain}&host=${domain}&ref=`
  }

  render () {
    const { articleId, isAMP } = this.props
    if (isAMP && articleId) {
      return <amp-pixel src={`${this.createViewTrackerURL(articleId)}&rand=RANDOM`} layout='nodisplay' width={1} height={1} />
    }
    return null
  }
}
