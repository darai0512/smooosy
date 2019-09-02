export {}
const actionTypes = require('@smooosy/config').scrapingActionTypes

const itownActions = {
  start: (url) => [
    { type: actionTypes.NEW_PAGE, tab: 'main' },
    { type: actionTypes.GOTO, url, option: { waitUntil: 'networkidle0' }, tab: 'main' },
  ],

  second: idx => [
    { type: actionTypes.ATTR, xpath: `//div[@class="normalResultsBox"][${idx}]/article/section/p[4]/a[contains(@class,'homePageLink')]`, attr: 'href', name: 'url' },
    { type: actionTypes.TEXT, xpath: `//div[@class="normalResultsBox"][${idx}]/article/section/p[2]/text()`, name: 'zipcode', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}/)
      if (match) return match[0]
      return null
    },
    },
    { type: actionTypes.TEXT, xpath: `//div[@class="normalResultsBox"][${idx}]/article/section/p[2]/text()`, name: 'address', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}(.+)/)
      if (match) return match[1].trim()
      return null
    },
    },
    { type: actionTypes.NEW_PAGE, tab: 'sub' },
    { type: actionTypes.LINK, xpath: `//div[@class="normalResultsBox"][${idx}]/article/section/h4/a`, wait: Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000, from: 'main', to: 'sub' },
    { type: actionTypes.LOCATION, tab: 'sub' },
  ],
  pattern1: () => [
    { type: actionTypes.TEXT, xpath: '//*[@id="titleText"]/div[2]/p/span', name: 'phone', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//*[@id="basicInnerLeft"]/table/tbody/tr[3]/td[2]', name: 'fax', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//*[@id="basicInnerLeft"]/table/tbody/tr[10]/td/h3', name: 'industry', tab: 'sub', fix: text => text.split('、').join(',') },
    { type: actionTypes.TEXT, xpath: '//*[@id="basicInnerLeft"]/table/tbody/tr/td/p[@class="email"]', name: 'email', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//h1/text()', name: 'name', tab: 'sub' },
    { type: actionTypes.CLOSE_PAGE, tab: 'sub' },
  ],
  pattern2: () => [
    { type: actionTypes.TEXT, xpath: '//*[@id="popupWrapper"]/div[1]/table/tbody/tr[1]/td', name: 'zipcode', tab: 'sub', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}/)
      if (match) return match[0]
      return ''
    },
    },
    { type: actionTypes.TEXT, xpath: '//*[@id="popupWrapper"]/div[1]/table/tbody/tr[1]/td', name: 'address', tab: 'sub', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}）?(.+)/)
      if (match) return match[1].trim()
      return ''
    },
    },
    { type: actionTypes.TEXT, xpath: '//table[@class="table"]/tbody/tr[2]/td/text()', name: 'phone', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//table[@class="table"]/tbody/tr[2]/td/a/text()', name: 'fax', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//table[@class="table"]/tbody/tr[3]/td', name: 'industry', tab: 'sub', fix: text => text.split('、').join(',') },
    { type: actionTypes.TEXT, xpath: '//table[@class="table"]/tbody/tr[4]/td', name: 'url', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//table[@class="table"]/tbody/tr[5]/td', name: 'email', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//h1/text()', name: 'name', tab: 'sub' },
    { type: actionTypes.CLOSE_PAGE, tab: 'sub' },
  ],
  pattern3: () => [
    { type: actionTypes.CLICK, xpath: '//li[@class="nav-shop"]/a', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[1]/dd', name: 'name', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[3]/dd/p[@class="tell"]', name: 'phone', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[4]/dd', name: 'fax', tab: 'sub', fix: text => text === '－' ? '' : text },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[5]/dd', name: 'zipcode', tab: 'sub', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}/)
      if (match) return match[0]
      return ''
    },
    },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[5]/dd', name: 'address', tab: 'sub', fix: text => {
      const match = text.match(/[0-9]{3}-?[0-9]{4}）?(.+)/)
      if (match) return match[1].trim()
      return ''
    },
    },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[11]/dd', name: 'industry', tab: 'sub', fix: text => text.split('、').join(',') },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[9]/dd/div/p[2]/a', name: 'url', tab: 'sub' },
    { type: actionTypes.TEXT, xpath: '//section[@class="item-body basic"]/dl[10]/dd/div/p[2]/a', name: 'email', tab: 'sub' },
    { type: actionTypes.CLOSE_PAGE, tab: 'sub' },
  ],
  isLastPage: () => [
    { type: actionTypes.TEXT, xpath: '//div[@class="bottomNav"]/ul/li[last()]/a', name: 'last', tab: 'main' },
  ],
  nextPage: () => [
    { type: actionTypes.CLICK, xpath: '//div[@class="bottomNav"]/ul/li[last()]', tab: 'main', wait: 3000 },
  ],
}

module.exports = { itownActions }
