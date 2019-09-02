export {}
const PDFDocument = require('pdfkit')
const moment = require('moment')

const width = 595.28
const height = 841.89
const sp = 20
const grey = '#9e9e9e'
const green = '#8fc320'


const firstPageRect = {x: sp * 2, y: sp * 14, w: width - sp * 4, h: height - sp * 20}
const newPageRect = {x: sp * 2, y: sp * 3.5, w: width - sp * 4, h: height - sp * 9.5}

class ReceiptPDF {
  name: string
  transactions: any[]
  doc: any
  sum: number

  constructor({name, transactions}) {
    this.name = name
    this.transactions = transactions
    this.doc = new PDFDocument({size: 'A4'})
    this.sum = transactions.reduce((sum, t) => sum + t.price, 0)
    return this.main()
  }

  init() {
    this.doc
    .font(`${__dirname}/../assets/ipamp.ttf`)

    .rect(sp * 2, sp * 2, width - sp * 4, 4)
    .lineWidth(4)
    .stroke(green)

    .fontSize(10)
    .text(`発行日: ${moment().format('YYYY年MM月DD日')}`, sp * 2, sp * 3, { align: 'right', width: width - sp * 4})

    // タイトル
    .lineWidth(0.5)
    .moveTo(sp * 2, sp * 4)
    .lineTo(width - sp * 2, sp * 4)
    .stroke(grey)

    .fontSize(20)
    .text('領 収 書', sp * 2, sp * 4.5, {align: 'center', height: sp * 3})

    .moveTo(sp * 2, sp * 6)
    .lineTo(width - sp * 2, sp * 6)
    .stroke(grey)

    // 宛名と合計金額
    .fontSize(15)
      .text(`${this.name} 様`, sp * 2, sp * 7, {width: width / 2.3})

    .fontSize(14)
    .text('領収金額合計', sp * 2, sp * 10)
    .text(`¥${this.sum.toLocaleString()}円（税込）`, sp * 2, sp * 10, { align: 'right', width: width / 2.3 })

    .rect(sp * 2, sp * 11, width / 2.3, 2)
    .lineWidth(2)
    .stroke(green)

    .fontSize(10)
    .text('上記、正に領収いたしました。', sp * 2, sp * 11.5)
  }

  fromPart() {
    // 差出人
    this.doc
    .fontSize(12)
    .text('差出人', width / 1.6, sp * 7)
    .fontSize(15).moveDown()

    .fontSize(14)
    .text('株式会社SMOOOSY')
    .fontSize(10).moveDown()

    .fontSize(10)
    .text('〒107-0052')
    .text('東京都港区赤坂2-22-19')
    .text('南部坂アネックス601号室')

    .image(`${__dirname}/../assets/stamp.png`, width - sp * 7, sp * 7.5, {width: sp * 2.5})
  }

  pageEnd(i) {
    this.doc
    .moveTo(sp * 2, height - sp * 6)
    .lineTo(width - sp * 2, height - sp * 6)
    .lineWidth(1)
    .stroke(grey)

    // ページ番号
    .text(`${parseInt((i / 45 + 1).toString())} / ${parseInt((this.transactions.length / 45 + 1).toString())}`, width - sp * 5, height - sp * 4)

    this.footer()
  }

  newPage() {
    this.doc
    .addPage()
    .rect(newPageRect.x, newPageRect.y, newPageRect.w, newPageRect.h)
    .lineWidth(1)
    .stroke(grey)

    // table header
    const tableHeaderHeight = sp * 3.7
    this.doc
    .fontSize(10)
    .text('品名', sp * 3, tableHeaderHeight)
    .text('単価（税込）', sp * 16, tableHeaderHeight)
    .text('数量', sp * 20, tableHeaderHeight)
    .text('金額（税込）', sp * 23, tableHeaderHeight)

    const tableHeaderLineHeight = sp * 4.5
    this.doc
    .moveTo(sp * 2, tableHeaderLineHeight)
    .lineTo(width - sp * 2, tableHeaderLineHeight)
    .stroke(grey)
  }

  footer() {
    this.doc
    .rect(sp * 2, height - sp * 4.5, width - sp * 4, 1)
    .lineWidth(1)
    .stroke(green)

    .image(`${__dirname}/../assets/logo.png`, sp * 2, height - sp * 4, {width: sp * 6})

    .rect(sp * 2, height - sp * 2, width - sp * 4, 4)
    .lineWidth(4)
    .stroke(green)
  }

  addLine({point, price, createdAt, textHeight}) {
    this.doc
    .fontSize(8)
    .text(`${moment(createdAt).format('MM月DD日')} SMOOOSYポイント ${point}pt`, sp * 3, sp * textHeight)
    .text(`${price.toLocaleString()}円`, sp * 16, sp * textHeight)
    .text('1', sp * 20, sp * textHeight)
    .text(`${price.toLocaleString()}円`, sp * 23, sp * textHeight)
  }

  main() {
    this.init()
    this.fromPart()

    // 内訳表
    this.doc
    .fontSize(10)
    .rect(firstPageRect.x, firstPageRect.y, firstPageRect.w, firstPageRect.h)
    .lineWidth(1)
    .stroke(grey)

    // table header
    .text('品名', sp * 3, sp * 14.2)
    .text('単価', sp * 16, sp * 14.2)
    .text('数量', sp * 20, sp * 14.2)
    .text('金額', sp * 23, sp * 14.2)

    .moveTo(sp * 2, sp * 15)
    .lineTo(width - sp * 2, sp * 15)
    .stroke(grey)

    // table body
    for (let i = 0; i < this.transactions.length; i++) {
      const t = this.transactions[i]
      const textHeight = (i < 30 ? 15.2 : 4.7) + parseInt((i < 30 ? i : (i - 30) % 45).toString()) * 0.7
      const borderHeight = (i < 30 ? 15 : 4.5) + (parseInt((i < 30 ? i : (i - 30) % 45).toString()) + 1) * 0.7
      // const textHeight = 15.1 + parseInt(i) * 0.7
      // const borderHeight = 15 + (parseInt(i) + 1) * 0.7

      this.addLine({
        point: t.point,
        price: t.price,
        createdAt: t.createdAt,
        textHeight,
      })

      // 改ページ処理
      if (i % 45 === 29) {
        this.pageEnd(i)
        if (this.transactions.length - 1 - i !== 0) {
          this.newPage()
        }
      } else {
        this.doc.moveTo(sp * 2, sp * borderHeight)
        .lineTo(width - sp * 2, sp * borderHeight)
        .lineWidth(0.5)
        .stroke(grey)
      }
    }

    if ((this.transactions.length - 1) % 45 !== 29) {
      this.pageEnd(this.transactions.length - 1)
    }

    this.doc
    .text('合計', sp * 20, height - sp * 5.8)
    .text(`${this.sum.toLocaleString()}円`, sp * 23, height - sp * 5.8)
    .end()

    return this.doc
  }
}

module.exports = (values) => new ReceiptPDF(values)
