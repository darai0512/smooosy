require('@babel/polyfill')
import { webOrigin } from '@smooosy/config'
import uuidv4 from 'uuid/v4'
import ttiPolyfill from 'tti-polyfill'

const bqKey = 'bqData'
const userType = { USER: 0, PRO: 1, NOT_LOGIN: 2 }

const storage = JSON.parse((localStorage || {}).smooosy || '{}')

function getStorage(key) {
  return storage[key]
}

function saveStorage(key, value) {
  storage[key] = value
  try {
    localStorage.setItem('smooosy', JSON.stringify(storage))
  } catch (e) {
    // empty
  }
}

function main() {
  performance()
  stickyBar()
  eventTracking()
  initLazyLoad()
  twitter()
  facebook()
  hatena()
}

function stickyBar() {
  const barInput = document.querySelector('#sticky_bar_input')
  if (!barInput) return
  let pageY, prevPageY
  document.addEventListener('scroll', () => {
    pageY = Math.max(
      window.pageYOffset,
      document.documentElement.scrollTop,
      document.body.scrollTop,
      (document.scrollingElement || {}).scrollTop // IE not support
    )
    const startPos = window.screen.height * 3

    // 下スクロール
    if (pageY > prevPageY && pageY > startPos && !barInput.checked) {
      barInput.checked = true
    // 上スクロール
    } else if (pageY < prevPageY && pageY < startPos && barInput.checked) {
      barInput.checked = false
    }

    prevPageY = pageY
  })
}

function performance() {
  ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
    window.gtag && window.gtag('event', 'time-to-interactive', {
      event_category: 'Performance',
      value: tti,
      event_label: window.location.pathname + window.location.search,
      non_interaction: true,
    })
  })
}

function eventTracking() {
  const user = JSON.parse(localStorage.user || '{}')
  const userData = getStorage(bqKey) || {}

  document.addEventListener('visibilitychange', () => {
    bq(userData, user, document.hidden ? 'hide' : 'show')
  })
  if (!document.referrer || !document.referrer.includes(webOrigin)) {
    bq(userData, user, 'visit')
  }

  bq(userData, user, 'page_view')
}

function bq(userData, user, event) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${webOrigin}/api/bq/insert`)
  xhr.setRequestHeader('Content-Type', 'application/json')
  const data = getHeader(userData, user)
  saveStorage(bqKey, data)
  const header = JSON.stringify(data)
  xhr.setRequestHeader('x-smooosy', header)
  xhr.send(JSON.stringify({event_type: event, table_name: 'web'}))
}

function twitter() {
  const button = document.querySelector('.twitter-share-button')
  if (button) {
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.id = 'twitter-wjs'
    button.parentNode.appendChild(script)
  }
}

function facebook() {
  const button = document.querySelector('.fb-like')
  if (button) {
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/ja_JP/sdk.js#xfbml=1&version=v2.11&appId=1871580089750644'
    script.async = true
    script.id = 'facebook-jssdk'
    button.parentNode.appendChild(script)
  }
}

function hatena() {
  const button = document.querySelector('.hatena-bookmark-button')
  if (button) {
    const script = document.createElement('script')
    script.src = 'https://b.st-hatena.com/js/bookmark_button.js'
    script.async = true
    button.parentNode.appendChild(script)
  }
}

// auth.jsのinitializeのmoment使わない版 (最小限)
function getHeader(userData, user) {
  // 初回訪問
  if (!userData.instance_id) {
    userData = {
      instance_id: uuidv4(),
    }
  }

  const url = window.location.pathname + window.location.search

  return {
    ...userData,
      // ユーザーID
    user_id: user.id,
      // ユーザータイプ
    user_type: user.id ? (user.pro ? userType.PRO : userType.USER) : userType.NOT_LOGIN,
      // リファラー
    reffer: document.referrer,
      // 現在ページ
    current_page: url,
      // ランディングページ
    landing_page: url,
  }
}

function initLazyLoad() {
  let lazyImages = [].slice.call(document.querySelectorAll('img.lazy'))
  let active = false

  const lazyLoad = function() {
    if (active === false) {
      active = true

      setTimeout(function() {
        lazyImages.forEach(function(lazyImage) {
          const offset = lazyImage.dataset.offset || 100
          if ((lazyImage.getBoundingClientRect().top - offset <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== 'none') {
            lazyImage.src = lazyImage.dataset.src
            if (lazyImage.dataset.srcset) {
              lazyImage.srcset = lazyImage.dataset.srcset
            }
            lazyImage.classList.remove('lazy')

            lazyImages = lazyImages.filter(function(image) {
              return image !== lazyImage
            })

            if (lazyImages.length === 0) {
              document.removeEventListener('scroll', lazyLoad)
              window.removeEventListener('resize', lazyLoad)
              window.removeEventListener('orientationchange', lazyLoad)
            }
          }
        })

        active = false
      }, 200)
    }
  }

  document.addEventListener('scroll', lazyLoad)
  window.addEventListener('resize', lazyLoad)
  window.addEventListener('orientationchange', lazyLoad)
  lazyLoad() // first check
}

main()
