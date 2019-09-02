import React from 'react'
import Finger from 'components/Finger'
import { withStyles } from '@material-ui/core/styles'
import ConsumptionTaxDialog from 'components/pros/ConsumptionTaxDialog'

let ProStatusBox = ({meet, meetsCount, classes}) => (
  <div className={classes.root}>
    {meetsCount === 1 ?
      <div className={classes.onlyOne}>
        <div style={{flex: 1, paddingRight: 20}}>
          {meet.customer.lastname}様はあなた1人だけを指名しています
        </div>
        <Finger />
      </div>
    :
      <div>{meet.customer.lastname}様に指名されています</div>
    }
    <div className={classes.border} />
    {meet.proResponseStatus === 'autoAccept' ?
      <div>
        <span className={classes.paid}>
          ポイント利用済み
        </span>
        {meet.request.isMatchMoreCampaignTarget ? <div>キャンペーン適用で1ptになりました！</div> : <div>20%割引されました!</div>}
        <div className={classes.subtext}>
          仕事条件に合う依頼のため、自動ポイント利用されました。
        </div>
      </div>
    : meet.proResponseStatus === 'accept' ?
      <div>
        <span className={classes.paid}>
          ポイント利用済み
        </span>
        {meet.request.isMatchMoreCampaignTarget && <div>キャンペーン適用で1ptになりました！</div>}
        <div className={classes.subtext}>
          依頼に返信したため、ポイント利用されました。
        </div>
      </div>
    : meet.proResponseStatus === 'tbd' ?
      <div>
        <span className={classes.notPaid}>
          ポイント利用前
        </span>
        <div>返信するのに<span className={classes.point}>{meet.point}pt</span>必要です</div>
        <div className={classes.subtext}>
          この依頼は仕事条件に完全にマッチはしていないので、まだポイント利用されていません。
        </div>
      </div>
    : null}
    <ConsumptionTaxDialog>
      {({onOpen}) => <div style={{marginTop: 10, fontSize: 12}}><a onClick={onOpen}>10月1日（火）より、SMOOOSYポイントに新消費税率（10%）が適用されます</a></div>}
    </ConsumptionTaxDialog>
  </div>
)

ProStatusBox = withStyles(theme => ({
  root: {
    background: theme.palette.grey[100],
    color: theme.palette.grey[800],
    padding: 10,
  },
  onlyOne: {
    display: 'flex',
    alignItems: 'center',
  },
  border: {
    height: 1,
    background: theme.palette.grey[300],
    margin: '10px 0',
  },
  paid: {
    display: 'inline-block',
    color: theme.palette.primary.main,
    fontSize: 13,
    fontWight: 'bold',
    margin: '5px 0',
    padding: '2px 4px',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
  },
  notPaid: {
    display: 'inline-block',
    fontSize: 13,
    fontWight: 'bold',
    margin: '5px 0',
    padding: '2px 4px',
    border: `1px solid ${theme.palette.grey[800]}`,
    borderRadius: 4,
  },
  point: {
    fontSize: 20,
    padding: '0 5px',
  },
  subtext: {
    fontSize: 12,
    marginTop: 5,
    color: theme.palette.grey[500],
  },
}))(ProStatusBox)

export default ProStatusBox
