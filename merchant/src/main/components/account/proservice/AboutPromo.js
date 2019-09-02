import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { withStyles, Divider, Hidden } from '@material-ui/core'
import { indigo } from '@material-ui/core/colors'
import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'

import { isMatchMoreCampaignService } from 'lib/instant'

const matchMoreColor = indigo[500]

const AboutPromo = ({classes, back, next, pass, location: { pathname }, proServices}) => {
  const onSubmit = useCallback((e) => {
    e.preventDefault()
    next()
  }, [next])

  const campaignAnnotation = Object.keys(proServices).some(id => isMatchMoreCampaignService(proServices[id].service))
  return (
    <form className={classes.root} onSubmit={onSubmit}>
      <ProServiceContainer
        stepper={<ProServiceProgress pathname={pathname} />}
        submitLabel='ONにして次へ'
        passLabel='OFFで次へ'
        pass={pass}
        back={back}
      >
        <div className={classes.content}>
          <h3>ラクラクお得モードにしてぴったりな依頼に簡単に出会いましょう！</h3>
          <div className={classes.container}>
            <Hidden implementation='js' smUp>
              <AboutPromoMobile classes={classes} campaignAnnotation={campaignAnnotation} />
            </ Hidden>
            <Hidden implementation='js' xsDown>
              <AboutPromoPC classes={classes} campaignAnnotation={campaignAnnotation} />
            </ Hidden>
          </div>
          {campaignAnnotation && <div className={classes.helper}><sup>*1</sup>「依頼どれでも1ptキャンペーン」期間中は20%割引対象外です</div>}
          <div className={classes.helper}><sup>*{campaignAnnotation ? '2' : '1'}</sup>仕事条件に合致する場合のみ自動返信・自動課金されます。合致しない場合は返信するかどうか選択できます。</div>
        </div>
      </ProServiceContainer>
    </form>
  )
}

const AboutPromoPC = ({classes, campaignAnnotation}) => {
  return (
    <>
      <div className={classes.flex1}>
        <div className={classes.flex}>ラクラクお得モード<div className={[classes.contained, classes.onBackground, classes.marginLeft].join(' ')}>ON</div></div>
        <Divider className={classes.divider} />
        <div>プロ検索結果の<span className={classes.bold}>上位に表示</span></div>
        <Divider className={classes.divider} />
        <div>応募ポイントが<span className={classes.bold}>20%OFF</span>{campaignAnnotation && <sup>*1</sup>}</div>
        <Divider className={classes.divider} />
        <div>ご指名を受けると、<span className={classes.bold}>自動返信・自動課金</span><sup>*{campaignAnnotation ? '2' : '1'}</sup></div>
      </div>
      <div className={[classes.flex1, classes.offText].join(' ')}>
        <div className={classes.flex}>ラクラクお得モード<div className={[classes.contained, classes.offBackground, classes.marginLeft].join(' ')}>OFF</div></div>
        <Divider className={classes.divider} />
        <div>プロ検索結果に通常表示</div>
        <Divider className={classes.divider} />
        <div>応募ポイント割引なし</div>
        <Divider className={classes.divider} />
        <div>ご指名を受けても、手動で返信・都度課金</div>
      </div>
    </>
  )
}

const AboutPromoMobile = ({classes, campaignAnnotation}) => {
  return (
    <>
      <div className={[classes.bold, classes.rowText].join(' ')}>ラクラクお得モード</div>
      <Row prefix='プロ検索結果の' onText='上位に表示' offText='通常表示' classes={classes} />
      <Row prefix='応募ポイントは' onText={<div className={[classes.preWrap].join(' ')}>20%OFF{campaignAnnotation && <sup>*1</sup>}</div>} offText='割引なし' classes={classes} />
      <Row
        prefix='ご指名を受けると'
        onText={<div className={[classes.preWrap].join(' ')}>自動返信<sup>*{campaignAnnotation ? '2' : '1'}</sup>{'\n自動課金'}</div>}
        offText={<div className={[classes.preWrap].join(' ')}>{'手動返信\n都度課金'}</div>}
        classes={classes}
      />
    </>
  )
}

const Row = ({classes, prefix, onText, offText}) => {
  return (
    <div className={classes.rowRoot}>
      <div className={classes.flex}>
        <div className={[classes.bold, classes.prefix].join(' ')}>{prefix}</div>
      </div>
      <div className={[classes.flex, classes.rowWrap].join(' ')}>
        <div className={[classes.flex1, classes.column, classes.flex].join(' ')}>
          <div className={[classes.containedMini, classes.onBackground].join(' ')}>ON</div>
          <div className={[classes.bold, classes.flex1, classes.rowText, classes.onText].join(' ')}>{onText}</div>
        </div>
        <div style={{width: 5}} />
        <div className={[classes.flex1, classes.column, classes.flex].join(' ')}>
          <div className={[classes.containedMini, classes.offBackground].join(' ')}>OFF</div>
          <div className={[classes.flex1, classes.rowText, classes.offText].join(' ')}>{offText}</div>
        </div>
      </div>
    </div>
  )
}

export default withStyles(theme => ({
  root: {
    height: '100%',
  },
  content: {
    [theme.breakpoints.up('sm')]: {
      margin: '0 -50px',
    },
  },
  container: {
    display: 'flex',
    padding: '30px 35px',
    marginTop: 30,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      padding: 20,
    },
  },
  flex1: {
    flex: 1,
  },
  flex: {
    display: 'flex',
    alignItems: 'center',
  },
  divider: {
    margin: '15px 0',
  },
  contained: {
    color: theme.palette.common.white,
    textAlign: 'center',
    padding: '3px 0',
    width: 50,
    borderRadius: 4,
  },
  containedMini: {
    color: theme.palette.common.white,
    textAlign: 'center',
    width: 40,
    borderRadius: 4,
    fontSize: 12,
    padding: '3px 0',
    fontWeight: 'bold',
  },
  marginLeft: {
    marginLeft: 10,
  },
  offText: {
    color: theme.palette.grey[600],
  },
  onText: {
    color: matchMoreColor,
  },
  offBackground: {
    background: theme.palette.grey[500],
  },
  onBackground: {
    background: matchMoreColor,
  },
  bold: {
    fontWeight: 'bold',
  },
  column: {
    flexDirection: 'column',
  },
  helper: {
    fontSize: 14,
    margin: '10px 0 0 10px',
  },
  rowWrap: {
    padding: 10,
    borderRadius: 4,
  },
  rowRoot: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 4,
    padding: '10px 5px 5px',
    marginTop: 20,
  },
  rowText: {
    display: 'flex',
    justifyContent: 'center',
    fontSize: 18,
  },
  prefix: {
    marginTop: -25,
    background: theme.palette.common.white,
    padding: '0 5px',
  },
  preWrap: {
    whiteSpace: 'pre-wrap',
  },
}))(connect(state => ({
  proServices: state.proService.proServices,
}))(AboutPromo))