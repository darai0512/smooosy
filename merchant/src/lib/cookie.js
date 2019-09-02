// https://developer.mozilla.org/ja/docs/Web/API/Document/cookie

export function getAllCookies() {
  const cookie = {}
  const keys = cookieKeys()
  keys.map(key => {
    cookie[key] = getCookieItem(key)
  })
  return cookie
}

export function getCookieItem(sKey) {
  if (!sKey || !hasCookieItem(sKey)) {
    return null
  }
  return unescape(document.cookie.replace(new RegExp('(?:^|.*;\\s*)' + escape(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*'), '$1'))
}

export function setCookieItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
  if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
    return
  }
  var sExpires = ''
  if (vEnd) {
    switch (vEnd.constructor) {
      case Number:
        sExpires = vEnd === Infinity ? '; expires=Tue, 19 Jan 2038 03:14:07 GMT' : '; max-age=' + vEnd
        break
      case String:
        sExpires = '; expires=' + vEnd
        break
      case Date:
        sExpires = '; expires=' + vEnd.toGMTString()
        break
    }
  }
  document.cookie = escape(sKey) + '=' + escape(sValue) + sExpires + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '') + (bSecure ? '; secure' : '')
}

export function removeCookieItem(sKey, sPath) {
  if (!sKey || !hasCookieItem(sKey)) {
    return
  }
  document.cookie = escape(sKey) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (sPath ? '; path=' + sPath : '')
}

export function hasCookieItem(sKey) {
  return (new RegExp('(?:^|;\\s*)' + escape(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(document.cookie)
}

export function cookieKeys() {
  var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/)
  for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
    aKeys[nIdx] = unescape(aKeys[nIdx])
  }
  return aKeys
}
