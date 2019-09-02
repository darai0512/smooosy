import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { grey, amber } from '@material-ui/core/colors'
import ToggleStar from '@material-ui/icons/Star'

import withStylesWithProps from 'components/withStylesWithProps'

const calcStars = (rating) => {
  let r = rating ? rating : 0
  if (r < 0) r = 0
  if (r > 5) r = 5

  const starCount = Math.floor(r)
  const halfCount = r - starCount
  const width = 100 * (halfCount ? halfCount * 0.7 + 0.15 : 0)

  return {
    starCount,
    width,
  }
}

@withStyles(() => ({
  root: {
    textAlign: 'center',
  },
  starBase: {
    width: '100%',
    padding: '10%',
    position: 'relative',
  },
  starWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
  },
  backgroundStar: {
    display: 'flex',
    alignItems: 'center',
    width: '20%',
    position: 'relative',
  },
  fullStar: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  star: {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    color: grey[500],
  },
  canChange: {
    cursor: 'pointer',
  },
  amber: {
    color: amber[700],
  },
  message: {
    fontSize: 14,
    marginBottom: 5,
    color: amber[900],
  },
}))
export default class RatingStar extends React.Component {
  static defaultProps = {
    rating: null,
    size: 24,
    defaultLabel: '評価を選択しましょう',
  }

  onClick = (starCount) => {
    if (!this.props.canChange) return

    this.props.onChange && this.props.onChange(starCount)
  }

  render() {
    const { rating, canChange, defaultLabel, classes } = this.props
    const { starCount, width } = calcStars(rating)

    const message = rating ? {
      1: 'とても悪い',
      2: '悪い',
      3: 'ふつう',
      4: '良い',
      5: 'とても良い',
    }[starCount] : defaultLabel

    const starClasses = [ classes.star ]
    if (canChange) starClasses.push(classes.canChange)
    classes.star = starClasses.join(' ')
    const stars = (
      <div className={classes.starBase}>
        <div className={classes.starWrap}>
          {[...Array(5).keys()].map(i => i === starCount ?
            <PartialStar key={i} parentClasses={classes} i={i} width={width} onClick={this.onClick} />
          :
            <Star key={i} parentClasses={classes} i={i} fill={i < starCount} onClick={this.onClick} />
          )}
        </div>
      </div>
    )

    if (canChange) {
      return (
        <div className={classes.root}>
          {stars}
          <div className={classes.message}>{message}</div>
        </div>
      )
    }
    return stars
  }
}

@withStylesWithProps((_, props) => ({
  partialStarWrap: {
    width: `${props.width}%`,
    height: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  partialStar: {
    width: `${10000/props.width}%`,
  },
}))
class PartialStar extends React.PureComponent {
  render() {
    const { i, parentClasses, onClick, classes } = this.props
    return (
      <div className={parentClasses.backgroundStar}>
        <ToggleStar onClick={() => onClick(i+1)} className={parentClasses.star} />
        <div className={[parentClasses.fullStar, classes.partialStarWrap].join(' ')}>
          <ToggleStar onClick={() => onClick(i+1)} className={[parentClasses.star, parentClasses.amber, classes.partialStar].join(' ')} />
        </div>
      </div>
    )
  }
}

class Star extends React.PureComponent {
  render() {
    const { i, parentClasses, onClick, fill } = this.props

    return (
      <div className={parentClasses.backgroundStar}>
        <ToggleStar onClick={() => onClick(i+1)} className={parentClasses.star} />
        {fill &&
          <div className={parentClasses.fullStar}>
            <ToggleStar onClick={() => onClick(i+1)} className={[parentClasses.star, parentClasses.amber].join(' ')} />
          </div>
        }
      </div>
    )
  }
}
