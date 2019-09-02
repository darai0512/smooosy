import React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import Widget from 'components/pros/Widget'
import { webOrigin } from '@smooosy/config'

@withStyles(theme => ({
  bottom: {
    marginTop: 'auto',
  },
  marginTop: {
    marginTop: 20,
  },
  marginLeft: {
    marginLeft: 20,
  },
  marginRight: {
    marginRight: 20,
  },
  marginBottom: {
    marginBottom: 10,
  },
  flexSize: {
    flex: 1,
  },
  flex: {
    display: 'flex',
  },
  preview: {
    height: 250,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.grey[100],
    borderRadius: 5,
  },
  link: {
    display: 'inline-block',
    padding: '0 5px',
    borderRadius: 4,
    background: theme.palette.common.white,
    width: 250,
    whiteSpace: 'nowrap',
    overflowX: 'scroll',
    fontSize: 14,
    border: `1px solid ${theme.palette.grey[500]}`,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  proBadge: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    margin: '10px 20px',
  },
}), {withTheme: true})
export default class ProBadge extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      size: 250,
      color: 'normal',
    }
  }

  changeSize = e => {
    this.setState({
      size: parseInt(e.target.value, 10),
    })
  }

  changeColor = e => {
    this.setState({
      color: e.target.value,
    })
  }

  render () {
    const { size, color } = this.state
    const { classes, profile, onCopy } = this.props

    let badgeHTML = '生成中'
    const originUrl = `${webOrigin}/p/${profile.shortId}`
    if (this.props.profile) {
      const image = color === 'normal' ? `${webOrigin}/images/badge.png` : `${webOrigin}/images/badge_white.png`
      badgeHTML = `<a href="${originUrl}?from=badge&id=${profile.id}" target="_blank"><img alt="SMOOOSYバッジ" src="${image}" width="${size}px" height="${size}px" /><img src="${webOrigin}/api/inboundLink/show?profileId=${profile.id}" style="display:none" /></a>`
    }

    const widgetHTML = `<div id="smooosy-widget"></div><script async src="${webOrigin}/widgets/script.js?id=${profile.id}"></script>`

    return (
      <div>
        あなたのホームページやブログにプロバッジを設置しましょう。コードを貼り付けると表示できます
        <div className={classes.flex}>
          <div className={classes.proBadge}>
            <div className={classes.preview}>
              <a href={originUrl} target='_blank' rel='noopener noreferrer'><img alt='SMOOOSYバッジ' src={color === 'normal' ? '/images/badge.png' : '/images/badge_white.png' } style={{width: size, height: size}} /></a>
            </div>
            <div>
              <div className={classes.flex}>
                <div className={classes.flexSize}>
                  <p>サイズ</p>
                  <div>
                    <label className={classes.marginRight} ><input type='radio' name='size' value={250} checked={size === 250} onChange={this.changeSize} /> 大</label>
                    <label className={classes.marginRight} ><input type='radio' name='size' value={160} checked={size === 160} onChange={this.changeSize} /> 中</label>
                    <label className={classes.marginRight} ><input type='radio' name='size' value={100} checked={size === 100} onChange={this.changeSize} /> 小</label>
                  </div>
                </div>
                <div className={classes.flexSize}>
                  <p>色</p>
                  <div>
                    <label className={classes.marginRight} ><input type='radio' name='color' value='normal' checked={color === 'normal'} onChange={this.changeColor} /> 緑</label>
                    <label className={classes.marginRight} ><input type='radio' name='color' value='inverse' checked={color === 'inverse'} onChange={this.changeColor} /> 白</label>
                  </div>
                </div>
              </div>
              <div className={classes.bottom}>
                <p className={`${classes.marginTop} ${classes.marginBottom}`}>バッジをクリックするとあなたのプロフィールページが表示されます</p>
                <input className={`${classes.marginBottom} ${classes.link}`} value={badgeHTML} readOnly={true} />
                <CopyToClipboard
                  text={badgeHTML}
                  onCopy={() => onCopy()}>
                  <Button variant='contained' color='primary'>コードをコピー</Button>
                </CopyToClipboard>
              </div>
            </div>
          </div>
          <div className={classes.proBadge}>
            <div className={classes.preview}>
              <Widget id={profile.id} shortId={profile.shortId} name={profile.name} number={profile.reviews.length} rating={profile.averageRating}/>
            </div>
            <div className={classes.bottom}>
              <p className={classes.marginBottom}>獲得したクチコミの平均評価を表示でき、クリックするとあなたのプロフィールページが表示されます</p>
              <div>
                <input className={`${classes.marginBottom} ${classes.link}`} value={widgetHTML} readOnly={true} />
                <CopyToClipboard
                  text={widgetHTML}
                  onCopy={() => onCopy()}>
                  <Button variant='contained' color='primary'>コードをコピー</Button>
                </CopyToClipboard>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
