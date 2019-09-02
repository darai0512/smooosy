import React from 'react'
import { withStyles } from '@material-ui/core'
import japaneseNumber from 'lib/japaneseNumber'

@withStyles((theme) => ({
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 24,
  },
  highlight: {
    color: theme.palette.red[500],
  },
  breakdown: {
    display: 'flex',
    justifyContent: 'space-between',
    color: theme.palette.grey[700],
    minWidth: 200,
    fontSize: 13,
  },
  price: {
    marginLeft: 20,
  },
}))
export default class PriceBreakdown extends React.Component {

  shouldComponentUpdate = () => false

  render () {
    const { price, highlightTotal, classes } = this.props

    const totalClass = [classes.total]
    if (highlightTotal) totalClass.push(classes.highlight)

    return (
      <>
        <div className={totalClass.join(' ')}>
          <label>{price.estimatePriceType === 'fixed' ? '合計' : '概算'}</label>
          <div className={classes.price}>
            {japaneseNumber(price.total).format()}円{price.estimatePriceType === 'minimum' ? '〜' : ''}
          </div>
        </div>
        {price.components.map(c =>
          <div key={c.label} className={classes.breakdown}>
            <label>{c.question ? `${c.question} - ` : ''}{c.label}{c.calculatedValue < 0 && `（${c.value}%割引）`}</label>
            <div className={classes.price}>
              {c.isNumber ?
                `${japaneseNumber(c.value).format()}円${c.type === 'base' && price.estimatePriceType === 'minimum' ? '〜' : ''} ${c.answers[0].number ? `x ${c.answers[0].number}${c.answers[0].unit}` : ''} `
              :
                `${japaneseNumber(c.calculatedValue).format()}円${c.type === 'base' && price.estimatePriceType === 'minimum' ? '〜' : ''}`
              }
            </div>
          </div>
        )}
      </>
    )
  }
}
