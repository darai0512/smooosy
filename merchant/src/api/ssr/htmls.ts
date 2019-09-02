import * as fs from 'fs'
import * as config from 'config'
const { safeTraverse } = require('../lib/util')

export const googleTagManager = {
  id: '',
  script: ``,
}

export const commonMetaTags = `
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="robots" content="noarchive">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1">
<meta name="theme-color" content="#8fc320">
<link rel="shortcut icon" href="/images/icon.png" />
<link rel="icon" href="/images/icon.png" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon57.png" sizes="57x57" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon60.png" sizes="60x60" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon72.png" sizes="72x72" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon76.png" sizes="76x76" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon114.png" sizes="114x114" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon120.png" sizes="120x120" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon144.png" sizes="144x144" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon152.png" sizes="152x152" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon167.png" sizes="167x167" />
<link rel="apple-touch-icon" href="/images/apple-touch-icon180.png" sizes="180x180" />
<link rel="apple-touch-startup-image" sizes="1125x2436" href="/images/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" sizes="1242x2208" href="/images/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" sizes="750x1334" href="/images/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" sizes="640x1136" href="/images/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="SMOOOSY" />
<meta name="apple-mobile-web-app-capable" content="yes" />
`

export function ampMetaTags({originalURL, initialData}) {
  let ampTags = `
<meta name="amp-google-client-id-api" content="googleanalytics">
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0.js" />
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-experiment-0.1.js" />
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-social-share-0.1.js" />
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-youtube-0.1.js" />
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-experiment" src="https://cdn.ampproject.org/v0/amp-experiment-0.1.js"></script>
<script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
<script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>
<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
<script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
<script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>
  `

  // 使っていないページで読み込むとAMPエラーになる
  if (/services\/.*\/(media|pickups)/.test(originalURL) || /t\/.*\/(media|pickups)/.test(originalURL)) {
    ampTags += `
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-position-observer-0.1.js" />
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-animation-0.1.js" />
<script async custom-element="amp-position-observer" src="https://cdn.ampproject.org/v0/amp-position-observer-0.1.js"></script>
<script async custom-element="amp-animation" src="https://cdn.ampproject.org/v0/amp-animation-0.1.js"></script>
    `
  }

  const hasInstagram = (safeTraverse(initialData, ['article', 'wpInfo', 'doms']) || []).find(dom => dom.instagram)
  if (hasInstagram) {
    ampTags += `
<link rel="preload" as="script" href="https://cdn.ampproject.org/v0/amp-instagram-0.1.js" />
<script async custom-element="amp-instagram" src="https://cdn.ampproject.org/v0/amp-instagram-0.1.js"></script>
`
  }

  return ampTags
}

export const ampBoilerplate = `
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
`

export const performanceScript = `
<script>
  if("PerformanceObserver"in window){new PerformanceObserver(function(e){const n=e.getEntries();for(let e=0;e<n.length;e++){const t=n[e],o=t.name,r=Math.round(t.startTime+t.duration);window.gtag && window.gtag("event",o,{event_category:"Performance",event_label:window.location.pathname+window.location.search,value:r,non_interaction:!0})}}).observe({entryTypes:["paint"]})}
</script>
`

export const dnsPrefetch = `
<meta http-equiv="x-dns-prefetch-control" content="on">
<link rel="dns-prefetch" href="//www.facebook.com" />
<link rel="dns-prefetch" href="//connect.facebook.net" />
<link rel="dns-prefetch" href="//www.google.co.jp" />
<link rel="dns-prefetch" href="//www.google.com" />
<link rel="dns-prefetch" href="//www.googletagmanager.com" />
<link rel="dns-prefetch" href="//api.mixpanel.com" />
<link rel="dns-prefetch" href="//static.hotjar.com" />
<link rel="dns-prefetch" href="//in.hotjar.com" />
<link rel="dns-prefetch" href="//widget.intercom.io" />
<link rel="dns-prefetch" href="//js.intercomcdn.com" />
<link rel="dns-prefetch" href="//api-iam.intercom.io" />
<link rel="dns-prefetch" href="//nexus-websocket-a.intercom.io" />
<link rel="dns-prefetch" href="//nexus-websocket-b.intercom.io" />
`

export const serviceWorker = `
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register("/serviceWorker.js")
    })
  }
</script>
`

// add expermients style
const expBottomBanner = 'bottom_banner'
const expPopupNotice = 'sp_popup_notice2'
export const experimentStyles = `
body[amp-x-${expBottomBanner}="hide"] .ampStickyBar { display: none; }
body[amp-x-${expPopupNotice}="hide"] .ampPopupNotice { display: none; }
`

export const ampAnalytics = experiments => ``

function getEssentialTag() {
  const essentialPath: string = config.get('essentialPath')
  if (!/^\//.test(essentialPath)) {
    return '<script async src="/essential.js"></script>'
  }
  return fs.readFileSync(essentialPath, 'utf-8')
}

export function getScriptTagNoBundle() {
  const smooosy_essential = getEssentialTag()
  const analytics = `` // google analytics
  const tti_pollyfill = `
  <script>
  !function(){if('PerformanceLongTaskTiming' in window){var g=window.__tti={e:[]};
  g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});
  g.o.observe({entryTypes:['longtask']})}}();
  </script>
  `
  if (process.env.NODE_ENV !== 'production') return [analytics, tti_pollyfill, smooosy_essential].join('')

  const mixpanel = `
    <script>
    (function(e,a){if(!a.__SV){var b=window;try{var c,l,i,j=b.location,g=j.hash;c=function(a,b){return(l=a.match(RegExp(b+"=([^&]*)")))?l[1]:null};g&&c(g,"state")&&(i=JSON.parse(decodeURIComponent(c(g,"state"))),"mpeditor"===i.action&&(b.sessionStorage.setItem("_mpcehash",g),history.replaceState(i.desiredHash||"",e.title,j.pathname+j.search)))}catch(m){}var k,h;window.mixpanel=a;a._i=[];a.init=function(b,c,f){function e(b,a){var c=a.split(".");2==c.length&&(b=b[c[0]],a=c[1]);b[a]=function(){b.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var d=a;"undefined"!==typeof f?d=a[f]=[]:f="mixpanel";d.people=d.people||[];d.toString=function(b){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);b||(a+=" (stub)");return a};d.people.toString=function(){return d.toString(1)+".people (stub)"};k="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");for(h=0;h<k.length;h++)e(d,k[h]);a._i.push([b,c,f])};a.__SV=1.2;b=e.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";c=e.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c)}})(document,window.mixpanel||[]);window.mixpanel.init("7b0e66a8dc32c5c75fbd25c7a2af2d72")
    </script>
  `
  const facebook = ``

  return [analytics, tti_pollyfill, smooosy_essential, mixpanel, facebook].join('')
}
