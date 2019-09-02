export {}
const platform = require('platform')

/**
 * ユーザデータ
 * @param req リクエストパラメータ
 * @returns ユーザ情報
 */
function getUserData(req) {
  if (!req.headers['x-smooosy']) return null

  let headers
  try {
    headers = JSON.parse(req.headers['x-smooosy'])
  } catch (e) {
    return null
  }

  return {
    instance_id: headers.instance_id,
    amp_id: headers.amp_id,
    user_id: headers.user_id,
    user_type: headers.user_type,
    browser_name: headers.browser_name,
    browser_version: headers.browser_version,
    user_agent: req.headers['user-agent'],
    reffer: headers.reffer,
    platform: platform.parse(req.headers['user-agent']),
    current_page: headers.current_page,
    landing_page: headers.landing_page,
    cookie: headers.cookie,
  }
}

module.exports = {
  getUserData,
}
