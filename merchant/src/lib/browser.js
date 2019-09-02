import browserslist from 'browserslist'
import { agents } from 'caniuse-lite/dist/unpacker/agents'
import platform from 'platform'

export const browserCheck = () => {
  const userBrowser = {
    name: platform.name ? platform.name.toLowerCase() : '',
    version: platform.version ? Number(platform.version.split('.')[0]) : null,
  }

  // アプリ内ブラウザだとandroid browserと判定されるが、最近だと中身はだいたいChromeなのでUserAgentから判断する
  if (userBrowser.name === 'android browser') {
    const chromeVersion = window.navigator.userAgent.match(/Chrome\/([0-9]+)/)
    if (chromeVersion) {
      userBrowser.name = 'chrome'
      userBrowser.version = parseInt(chromeVersion[1])
    }
  }

  //利用可能ブラウザを取得
  const supportedBrowsers = browserslist(['> 1%', 'last 2 major version', 'not ie <= 10', 'not ie_mob <= 10', 'not android > 1', 'not and_qq > 1', 'not baidu > 1', 'not bb > 1'])
  const minimumVersions = {}
  const regexp = /firefox|ie|edge|chrome|safari/
  supportedBrowsers.forEach(browser => {
    let name = agents[browser.split(' ')[0]].browser.toLowerCase()
    const version = Number(browser.split(' ')[1].split('.')[0])
    //主要5種はmobileとpcのバージョンが同一のため統一&一番古いバージョンを保存
    if (name.match(regexp) !== null) name = name.match(regexp)[0]
    minimumVersions[name] = minimumVersions[name] ? minimumVersions[name] > version ? version : minimumVersions[name] : version
  })

  let oldBrowser = false
  if (userBrowser.name.match(regexp) !== null) userBrowser.name = userBrowser.name.match(regexp)[0]
  if (userBrowser.name === 'samsungbrowser') userBrowser.name = 'samsung internet'
  // platform.jsの今(2017/10/27現在)あるプルリクが通ったら使える
  // if (userBrowser.name === 'ucbrowser') userBrowser.name = 'ucandroid'
  if (userBrowser.name === 'opera mini') {
    //opera miniはバージョンがall 次のifでの比較はNaNとの比較になりfalseにはなるけれど一応
    oldBrowser = false
  } else {
    oldBrowser = minimumVersions[userBrowser.name] ? minimumVersions[userBrowser.name] > userBrowser.version : true
  }
  return oldBrowser
}
