import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import {
  Button,
  DialogActions,
  DialogContent,
  withStyles,
} from '@material-ui/core'
import { indigo } from '@material-ui/core/colors'
import { Link } from 'react-router-dom'
import OpenIcon from '@material-ui/icons/OpenInNew'
import CheckIcon from '@material-ui/icons/CheckCircle'
import moment from 'moment'

import CreditCardInfo from 'components/CreditCardInfo'
import ResponsiveDialog from 'components/ResponsiveDialog'

import { rolloutDates } from '@smooosy/config'

const HELP_PAGE = 'https://help.smooosy.com/articles/3060839-'

@withRouter
@withStyles(theme => ({
  root: {
    padding: 20,
  },
  breakdown: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    border: `2px solid ${indigo[300]}`,
    borderRadius: 4,
    margin: '30px 10px',
  },
  breakdownItem: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  breakdownTitleWrap: {
    marginTop: -35,
    display: 'flex',
  },
  breakdownTitle: {
    background: theme.palette.common.white,
    padding: '0 10px',
    fontSize: 20,
  },
  flex: {
    display: 'flex',
  },
  pcFlex: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  link: {
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  linkWrap: {
    display: 'flex',
  },
  actions: {
    padding: 5,
    display: 'flex',
  },
  matchmoreButton: {
    height: 50,
    flex: 1,
    background: indigo[500],
    '&:hover': {
      background: indigo[700],
    },
  },
  button: {
    height: 50,
    flex: 1,
  },
  round: {
    background: theme.palette.grey[200],
    margin: 10,
    borderRadius: 4,
    padding: 10,
  },
  checkIcon: {
    color: indigo[500],
    marginLeft: 5,
  },
  icon: {
    fontSize: 16,
    color: theme.palette.grey[500],
    marginRight: 5,
  },
  annotation: {
    color: theme.palette.grey[800],
    fontSize: 14,
  },
  serviceList: {
    marginLeft: 10,
  },
  delete: {
    textDecoration: 'line-through',
    fontWeight: 'normal',
    fontSize: 12,
  },
}))
@connect(state => ({
  user: state.auth.user,
}))
export default class MatchMoreCampaignDialog extends React.Component {
  render() {
    const { open, onClose, proServices, serviceKeys, user, classes, location: { pathname }, onUpdateOnePtCampaign } = this.props

    return (
      <ResponsiveDialog open={open} onClose={onClose} title={<><span style={{fontWeight: 'bold', fontSize: 22}}>依頼どれでも1ptキャンペーン</span>とは</>}>
        <DialogContent>
          <div style={{fontSize: 18}}>一定の条件を満たすと、対象の依頼がどれでも<span style={{fontWeight: 'bold'}}>1pt（ポイント）</span><sup>*1</sup>になるキャンペーンです！</div>
          <div className={classes.breakdown}>
            <div className={classes.breakdownTitleWrap}><div className={classes.breakdownTitle}>対象条件</div></div>
            <div className={classes.breakdownItem}>・ご指名方式の設定を完了している（サービスごとの設定が必要です）</div>
            <div className={[classes.breakdownItem, classes.flex].join(' ')}>・クレジットカードを登録する{user.hasActiveCard &&
            <CheckIcon className={classes.checkIcon} />}</div>
            <div className={classes.round}>
              <CreditCardInfo onCreated={onUpdateOnePtCampaign} />
            </div>
          </div>
          <div className={classes.breakdown}>
          <div className={classes.breakdownTitleWrap}><div className={classes.breakdownTitle}>対象依頼</div></div>
            <div className={classes.breakdownItem}>・条件を満たしている対象サービス<sup>*2</sup>の依頼全て<sup>*3</sup></div>
          </div>
          <div className={classes.breakdown}>
            <div className={classes.breakdownTitleWrap}><div className={classes.breakdownTitle}>対象期間</div></div>
            <div className={classes.breakdownItem}>
              <div className={classes.pcFlex}>
                <span>・2019年6月20日0時0分〜</span>
                <div style={{fontSize: 22}}>{moment(rolloutDates.disableMatchMoreCampaign).format('YYYY年M月D日H時m分')}</div>
                <div style={{marginLeft: 5}}>
                  <div className={classes.delete}>2019年8月31日23時59分</div>
                  <div className={classes.delete}>2019年7月31日23時59分</div>
                </div>
              </div>
              <div style={{color: indigo[500]}}>ご好評につき更に期間延長！</div>
            </div>
          </div>
          <div className={classes.annotation}><sup>*1</sup>0ptの無料依頼は除きます</div>
          <div className={classes.annotation}><sup>*2</sup>お客様の現在の対象サービスは次の通りです</div>
          <div className={classes.annotation}>{serviceKeys.map(k => <div key={k} className={classes.serviceList}>・{proServices[k].service.name}</div>)}</div>
          <div className={classes.annotation}><sup>*3</sup>ご指名依頼も通常依頼もどちらも対象となります。</div>
          <div className={classes.linkWrap}>
            <a className={classes.link} component='a' color='primary' href={HELP_PAGE} target='_blank' rel='noopener noreferrer'>
              <OpenIcon className={classes.icon} />{'詳しくはこちら(説明ページが開きます)'}
            </a>
          </div>
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button className={classes.button} onClick={onClose}>閉じる</Button>
          {pathname !== '/pros/matchmore' &&
            <>
              <div style={{width: 5}} />
              <Button className={classes.matchmoreButton} variant='contained' color='primary' component={Link} to='/pros/matchmore'>ご指名設定をする</Button>
            </>
          }
        </DialogActions>
      </ResponsiveDialog>
    )
  }
}
