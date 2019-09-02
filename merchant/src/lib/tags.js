import moment from 'moment'
import { webOrigin } from '@smooosy/config'

export default {
  facebook,
  adwords,
  rollbar,
  mixpanel,
  intercomReboot,
  pageview,
  yahoo,
}


function facebook(user) {
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  const config = user ? {
    em: user.email,
    fn: user.firstname,
    ln: user.lastname,
  } : null
  window.fbq('init', '134597757213136', config)
  window.fbq('track', 'PageView')
}

/* eslint-disable */
function adwords() {
  const REQUEST_ID = 'AW-861403727'
  const PRO_ID = 'AW-774047919'
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', REQUEST_ID)
  gtag('config', PRO_ID)

  window.adwords_conversion = function({type, event_id, ...rest}) {
    const id = type === 'pro' ? PRO_ID : REQUEST_ID
    gtag('event', 'conversion', {
      'send_to': `${id}/${event_id}`,
      ...rest,
    })
  }

  const aw = document.createElement('script')
  aw.src = `//www.googletagmanager.com/gtag/js?id=${REQUEST_ID}`
  document.getElementsByTagName('head')[0].appendChild(aw)
}

function rollbar(user) {
  window._rollbarConfig = {
    accessToken: 'de743b2ca25646bb975ff685678ac11f',
    captureUncaught: true,
    hostWhiteList: ['smooosy.com', 'dev.smooosy.com'],
    checkIgnore: (isUncaught, args, payload) => {
      try {
        if (/(websocket|xhr\s(post|poll))\serror/.test(payload.body.trace.exception.message)) return true

        const ua = payload.client.javascript.browser
        const isAndroidBrowser = /Android/.test(ua) && /Linux; U;/.test(ua) && !/Chrome/.test(ua)
        return isAndroidBrowser
      } catch (e) {
        // empty
      }
      return false
    },
    payload: {
      environment: process.env.TARGET_ENV || 'development',
      client: {
        javascript: {
          source_map_enabled: true,
          code_version: process.env.GIT_REVISION,
          guess_uncaught_frames: true,
        }
      }
    }
  }
  if (user) {
    window._rollbarConfig.payload.person = {
      id: user.id,
      username: `${user.lastname} ${user.firstname}`,
      email: user.email,
    }
  }
  require('rollbar/dist/rollbar.snippet.js')
}

function mixpanel() {
  /* eslint-disable */
  (function(e,a){if(!a.__SV){var b=window;try{var c,l,i,j=b.location,g=j.hash;c=function(a,b){return(l=a.match(RegExp(b+"=([^&]*)")))?l[1]:null};g&&c(g,"state")&&(i=JSON.parse(decodeURIComponent(c(g,"state"))),"mpeditor"===i.action&&(b.sessionStorage.setItem("_mpcehash",g),history.replaceState(i.desiredHash||"",e.title,j.pathname+j.search)))}catch(m){}var k,h;window.mixpanel=a;a._i=[];a.init=function(b,c,f){function e(b,a){var c=a.split(".");2==c.length&&(b=b[c[0]],a=c[1]);b[a]=function(){b.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var d=a;"undefined"!==typeof f?d=a[f]=[]:f="mixpanel";d.people=d.people||[];d.toString=function(b){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);b||(a+=" (stub)");return a};d.people.toString=function(){return d.toString(1)+".people (stub)"};k="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");for(h=0;h<k.length;h++)e(d,k[h]);a._i.push([b,c,f])};a.__SV=1.2;b=e.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";c=e.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c)}})(document,window.mixpanel||[]);window.mixpanel.init("7b0e66a8dc32c5c75fbd25c7a2af2d72")
  /* eslint-enable */
}

const intercomId = process.env.TARGET_ENV === 'production' ? 'y7t9a0od' : 'eodbwzqp'
function intercom() {
  /* eslint-disable */
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;
  s.src='https://widget.intercom.io/widget/' + intercomId;
  var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
  /* eslint-enable */
}

function intercomReboot() {
  if (window.Intercom) {
    window.Intercom('shutdown')
    delete window.intercomSettings
  }
}

function setIntercomSettings({user, profile}) {
  window.intercomSettings = {
    ...window.intercomSettings,
    app_id: intercomId,
    hide_default_launcher: true,
    email: user.email,
    user_id: user.id,
    user_hash: user.intercomHash,
    name: user.lastname + (user.firstname ? ` ${user.firstname}` : ''),
    phone: user.phone ? '+81' + user.phone.slice(1) : null,
    signed_up_at: moment(user.createdAt).unix(),
    'has_creditcard': !!user.payjpId,
    'is_pro': !!user.pro,
    'line_connected': !!user.lineId,
  }
  if (profile) {
    window.intercomSettings = {
      ...window.intercomSettings,
      main_category: profile.category,
      tools_url: `${webOrigin}/tools/#/stats/pros/${profile.id}`,
      company_name: profile.name,
      review_count: profile.reviews.length,
      profile_text: (profile.description || '').length + (profile.advantage || '').length,
    }
  }
}

function pageview(page, user, profile) {
  // yahoo ydn retargeting
  window.yahoo_ydn_retargeting && window.yahoo_ydn_retargeting()
  // yahoo sponsored retargeting
  window.yahoo_retargeting && window.yahoo_retargeting()

  if (!user.id) return // only logged-in users continue

  const userConfig = {
    'email': user.email,
    'phone': user.phone,
    'created': new Date(user.createdAt),
    'last_login': new Date(),
    'last_name': user.lastname,
    'first_name': user.firstname,
    'name': user.lastname + (user.firstname ? ` ${user.firstname}` : ''),
    'pro': user.pro,
  }

  if (profile) {
    userConfig.category = profile.category
  }

  // heap
  if (window.heap) {
    window.heap.identify(user.id)
    window.heap.addUserProperties(userConfig)
  }

  // intercom

  // only enable Intercom for pro
  if (!user.pro) return

  if (!window.Intercom) {
    // init
    setIntercomSettings({user, profile})
    intercom()
  } else if (!window.intercomSettings) {
    setIntercomSettings({user, profile})
    window.Intercom('boot', window.intercomSettings)
  } else if (!window.intercomSettings.company_name && profile) {
    // update
    setIntercomSettings({user, profile})
    window.Intercom('update', window.intercomSettings)
  }
}

function yahoo() {
  // Sponsored conversion
  window.yahoo_conversion = window.yahoo_conversion || function({label, type}) {
    const PRO_CONVERSION_ID = 1001046609
    const REQUEST_CONVERSION_ID = 1001032688
    window.yahoo_conversion_id = type === 'pro' ? PRO_CONVERSION_ID : REQUEST_CONVERSION_ID
    window.yahoo_conversion_label = label
    window.yahoo_conversion_value = 0

    const s = document.createElement('script')
    s.src = 'https://s.yimg.jp/images/listing/tool/cv/conversion.js'
    s.async = true
    document.body.appendChild(s)
  }
  // Sponsored retargeting
  window.yahoo_retargeting = window.yahoo_retargeting || function() {
    window.yahoo_ss_retargeting_id = 1001032688
    window.yahoo_sstag_custom_params = window.yahoo_sstag_params
    window.yahoo_ss_retargeting = true

    const s = document.createElement('script')
    s.src = 'https://s.yimg.jp/images/listing/tool/cv/conversion.js'
    s.async = true
    document.body.appendChild(s)
  }

  // YDN conversion
  window.yahoo_ydn_conversion = window.yahoo_ydn_conversion || function(label) {
    window.yahoo_ydn_conv_io = 'ROBt4RAOLDX2VEYtZoqj'
    window.yahoo_ydn_conv_label = label
    window.yahoo_ydn_conv_transaction_id = ''
    window.yahoo_ydn_conv_value = '0'

    const s = document.createElement('script')
    s.src = 'https://b90.yahoo.co.jp/conv.js'
    s.async = true
    document.body.appendChild(s)
  }
  // ydn retargeting
  window.yahoo_ydn_retargeting = window.yahoo_ydn_retargeting || function() {
    window.yahoo_retargeting_id = 'N6VYFQE5OR'
    window.yahoo_retargeting_label = ''
    window.yahoo_retargeting_page_type = ''
    window.yahoo_retargeting_items = [{item_id: '', category_id: '', price: '', quantity: ''}]
    const s = document.createElement('script')
    s.src = 'https://b92.yahoo.co.jp/js/s_retargeting.js'
    s.async = true
    document.body.appendChild(s)
  }
}
