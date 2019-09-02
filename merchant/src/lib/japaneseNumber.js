'use strict'

const zeroToNine = '0123456789０１２３４５６７８９零一二三四五六七八九'
const smallUnits = '十百千'
const bigUnits = '万億兆京垓𥝱穣'

function japaneseNumber(arg) {
  const instance = new JapaneseNumber()
  if (!arg) {
    instance.setNumber(0)
  } else if (typeof arg === 'string') {
    instance.setRaw(arg)
  } else if (typeof arg === 'number') {
    if (arg > Math.pow(2, 53)) {
      throw new Error('Number is too big.')
    }
    instance.setNumber(arg)
  }
  return instance
}

class JapaneseNumber {
  constructor() {
    this.raw = ''

    return this
  }

  setRaw(raw) {
    this.raw = raw
    delete this.number
    this.parse()
  }

  setNumber(number) {
    this.number = number
  }

  parse() {
    if (this.number !== undefined) return this.number

    let tmpNumber = 0
    let currentDidit = 1
    let bigDigit
    let digitUsed = true
    for (let char of this.raw.split('').reverse()) {
      // number
      let index = zeroToNine.indexOf(char)
      if (index > -1) {
        tmpNumber += currentDidit * (index % 10)
        digitUsed = true
        currentDidit *= 10
        continue
      }
      // small unit
      index = smallUnits.indexOf(char)
      if (index > -1) {
        if (bigDigit) {
          currentDidit = bigDigit * Math.pow(10, index + 1)
        } else {
          currentDidit = Math.pow(10, index + 1)
        }
        digitUsed = false
        continue
      }
      // big unit
      index = bigUnits.indexOf(char)
      if (index > -1) {
        currentDidit = Math.pow(10000, index + 1)
        bigDigit = Math.pow(10000, index + 1)
        digitUsed = false
        continue
      }
    }

    // "千" should be 1000
    if (!digitUsed) {
      tmpNumber += currentDidit
    }

    return this.number = tmpNumber
  }

  // TODO: change string format type with argument option
  format() {
    if (this.number === undefined) return '0'

    let tmpNumber = this.number
    let str = ''
    const units = bigUnits.split('').reverse()
    for (let index in units) {
      const unit = units[index]
      const digit = Math.pow(10000, units.length - index)
      if (this.number >= digit) {
        const num = Math.floor(tmpNumber / digit)
        if (num > 0) {
          str += Math.floor(tmpNumber / digit).toLocaleString() + unit
        }
        tmpNumber = tmpNumber % digit
      }
    }

    if (str === '' || tmpNumber > 0) {
      str += tmpNumber.toLocaleString()
    }

    return str
  }
}

export default japaneseNumber
