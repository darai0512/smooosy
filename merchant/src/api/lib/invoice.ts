export {}
const PDFDocument = require('pdfkit')
const moment = require('moment')

const width = 595.28
const height = 841.89
const sp = 20
const grey = '#9e9e9e'

class InvoicePDF {
  from: any
  name: string
  nameSuffix: string
  items: any[]
  doc: any
  sum: number
  constructor({from, name, nameSuffix, items}) {
    this.from = from
    this.name = name
    this.nameSuffix = nameSuffix
    this.items = items
    this.doc = new PDFDocument({size: 'A4'})
    this.sum = items.reduce((prev, curr) => prev + curr.price * curr.amount, 0)
    this.init()
    return this.main()
  }

  init() {
    this.doc
    .font(`${__dirname}/../assets/ipamp.ttf`)

    .fontSize(10)
    .text(`発行日: ${moment().format('YYYY年MM月DD日')}`, sp * 2, sp * 2.8, { align: 'right', width: width - sp * 4})
    if (this.from.invoiceNumber) {
      this.doc
      .text(`請求書番号: ${this.from.invoiceNumber}`, { align: 'right', width: width - sp * 4})
    }
    // タイトル
    this.doc
    .fontSize(10)
    .lineWidth(0.5)
    .moveTo(sp * 2, sp * 4)
    .lineTo(width - sp * 2, sp * 4)
    .stroke(grey)

    .fontSize(20)
    .text('請 求 書', sp * 2, sp * 4.5, {align: 'center', height: sp * 3})

    .moveTo(sp * 2, sp * 6)
    .lineTo(width - sp * 2, sp * 6)
    .stroke(grey)
  }

  pageEnd(i) {
    const start = i < 30 ? 0 : parseInt(((i - 30) / 45).toString()) * 45 + 30
    const end = i < 30 ? Math.min(i + 1, this.items.length) : Math.min(start + 45, this.items.length)
    const subtotal = this.items.slice(start, end).reduce((p, c) => p + (c.price * c.amount), 0)
    this.doc
    .moveTo(sp * 2, height - sp * 6)
    .lineTo(width - sp * 2, height - sp * 6)
    .lineWidth(1)
    .stroke(grey)

    .text('小計', sp * 20, height - sp * 5.6)
    .text(`${subtotal.toLocaleString()}円`, sp * 23, height - sp * 5.6)
    // ページ番号
    .text(`${parseInt((i / 45 + 1).toString())} / ${parseInt((this.items.length / 45 + 1).toString())}`, width - sp * 5, height - sp * 4)
  }

  newPage() {
    this.doc
    .addPage()
    .rect(sp * 2, sp * 3.5, width - sp * 4, height - sp * 8.5)
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

  fromPart() {
    this.doc
    // 差出人
    .fontSize(12)
    .text('差出人', width / 1.8, sp * 7)
    .fontSize(15).moveDown()

    .fontSize(14)
    .text(this.from.name)
    .fontSize(10).moveDown()

    .fontSize(10)
    if (this.from.zip) {
      this.doc
      .text('〒' + this.from.zip)
    }
    this.doc
    .text(this.from.address)
    .fontSize(10).moveDown()
    if (this.from.transfer) {
      const type = this.from.transfer.bankAccountType === 'current' ? '当座' : '普通'
      this.doc
      .fontSize(12)
      .text('振込先情報')
      .fontSize(4).moveDown()
      .fontSize(10)
      .text(this.from.transfer.bankName)
      .text(type + ' ' + this.from.transfer.bankAccount)
    }
  }

  toPart() {
    // 宛名と合計金額
    this.doc
    .fontSize(15)
    .text(`${this.name} ${this.nameSuffix}`, sp * 2, sp * 7, {width: width / 2.3})

    .fontSize(10)
    .text('下記の通りご請求申し上げます。', sp * 2, sp * 9)

    .fontSize(14)
    .text('ご請求金額', sp * 2, sp * 10)
    .text(`¥${this.sum.toLocaleString()}円（税込）`, sp * 2, sp * 10, { align: 'right', width: width / 2.3 })

    .rect(sp * 2, sp * 11, width / 2.3, 1)
    .lineWidth(1)
    .stroke(grey)
  }

  main() {
    this.toPart()
    this.fromPart()

    // 内訳表
    this.doc
    .fontSize(10)
    .rect(sp * 2, sp * 14, width - sp * 4, height - sp * 19)
    .lineWidth(1)
    .stroke(grey)

    // table header
    const tableHeaderHeight = sp * 14.2
    this.doc
    .text('品名', sp * 3, tableHeaderHeight)
    .text('単価（税込）', sp * 16, tableHeaderHeight)
    .text('数量', sp * 20, tableHeaderHeight)
    .text('金額（税込）', sp * 23, tableHeaderHeight)

    const tableHeaderLineHeight = sp * 15
    this.doc
    .moveTo(sp * 2, tableHeaderLineHeight)
    .lineTo(width - sp * 2, tableHeaderLineHeight)
    .stroke(grey)

    // table body
    for (let i = 0; i < this.items.length; i++) {
      const t = this.items[i]
      const textHeight = (i < 30 ? 15.2 : 4.7) + parseInt((i < 30 ? i : (i - 30) % 45).toString()) * 0.7
      const borderHeight = (i < 30 ? 15 : 4.5) + (parseInt((i < 30 ? i : (i - 30) % 45).toString()) + 1) * 0.7

      this.doc
      .fontSize(8)
      .text(t.name, sp * 3, sp * textHeight)
      .text(`${Number(t.price).toLocaleString()}円`, sp * 16, sp * textHeight)
      .text(Number(t.amount).toLocaleString(), sp * 20, sp * textHeight)
      .text(`${(t.price * t.amount).toLocaleString()}円`, sp * 23, sp * textHeight)
      if (i % 45 === 29) {
        this.pageEnd(i)
        this.newPage()
      } else {
        this.doc.moveTo(sp * 2, sp * borderHeight)
        .lineTo(width - sp * 2, sp * borderHeight)
        .lineWidth(0.5)
        .stroke(grey)
      }
    }

    if ((this.items.length - 1) % 45 !== 29) {
      this.pageEnd(this.items.length - 1)
    }
    //end
    this.doc
    .end()

    return this.doc
  }
}

module.exports = (values) => new InvoicePDF(values)