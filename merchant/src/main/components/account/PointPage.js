import React from 'react'
import { Helmet } from 'react-helmet'
import moment from 'moment'
import qs from 'qs'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { load as loadUser } from 'modules/auth'
import { load as loadPoint, paymentInfo } from 'modules/point'
import { Button, Table, TableBody } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import ActionInfoOutlined from '@material-ui/icons/InfoOutlined'

import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import ConveniInfo from 'components/ConveniInfo'
import PointModal from 'components/PointModal'
import CreditCardInfo from 'components/CreditCardInfo'
import CustomRow from 'components/CustomRow'
import PointTable from 'components/PointTable'
import ConfirmDialog from 'components/ConfirmDialog'
import PointCampaignDialog from 'components/PointCampaignDialog'
import InquiryLink from 'components/InquiryLink'
import NetbankRedirectDialog from 'components/NetbankRedirectDialog'
import Notice from 'components/Notice'
import CampaignBanner from 'components/pros/CampaignBanner'
import { StarterProgramBannerMini, StarterProgramDialog } from 'components/pros/StarterProgramBanner'
import ConsumptionTaxDialog from 'components/pros/ConsumptionTaxDialog'

@withWidth({withTheme: true})
@connect(
  state => ({
    user: state.auth.user,
    point: state.point.point,
    conveniInfo: state.point.conveniInfo,
  }),
  { loadUser, loadPoint, paymentInfo }
)
export default class PointPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.reload()
    const { campaign } = this.props.location.state || {}
    this.setState({campaign})

    // 決済戻りパラメータ
    const query = qs.parse(this.props.location.search.slice(1))
    if (query.redirect) {
      this.setState({
        redirectStatus: query.redirect,
      })
      this.props.history.replace(this.props.location.pathname)
    }
  }

  reload = () => {
    this.setState({modal: false})
    this.props.loadUser()
    this.props.loadPoint()
    this.props.paymentInfo()
  }

  render() {
    const { redirectStatus } = this.state
    const { user, point, conveniInfo, width, theme } = this.props
    const { common, grey, blue, red } = theme.palette

    if (!point) return null

    const styles = {
      root: {
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        padding: '20px 0',
        width: width === 'xs' ? '100%' : '70vw',
        maxWidth: width === 'xs' ? 'initial' : 500,
        margin: '0 auto',
      },
      block: {
        marginBottom: 40,
      },
      subheader: {
        fontWeight: 'bold',
        margin: 10,
      },
      point: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0' : 1,
      },
      submitButton: {
        margin: '16px 0',
        height: 50,
      },
      table: {
        background: common.white,
        borderStyle: 'solid',
        borderColor: grey[300],
        borderWidth: width === 'xs' ? '1px 0 0' : '1px 1px 0',
        borderCollapse: 'initial',
      },
      notificationTitle: {
        fontWeight: 'bold',
        flexWrap: 'wrap',
        margin: 'auto 10px',
        fontSize: width === 'xs' ? 12 : 16,
      },
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              {width === 'xs' &&
                <Link to='/account'>
                  <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
                </Link>
              }
            </div>
            <div>SMOOOSYポイント</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>SMOOOSYポイント</title>
        </Helmet>
        <div style={styles.main}>
          <div>
            <CampaignBanner />
            <ConsumptionTaxDialog>
            {({onOpen}) => (
              <Notice type='info' style={{margin: width === 'xs' ? '0 10px 10px' : '0 0 10px 0', cursor: 'pointer'}} onClick={onOpen}>
                <span style={{fontSize: 14}}>10月1日（火）より、SMOOOSYポイントに新消費税率（10%）が適用されます</span>
              </Notice>
            )}
            </ConsumptionTaxDialog>
            <div style={{display: 'flex', flexDirection: 'row-reverse'}}>
              <a style={{display: 'flex', alignItems: 'center', fontSize: 13}} onClick={() => this.props.history.push('/pro-center/point')}>
                <ActionInfoOutlined style={{width: 20, height: 20, color: blue.A200}} />
                SMOOOSYポイントとは？
              </a>
            </div>
            {conveniInfo &&
              <div style={styles.block}>
                <div style={styles.subheader}>
                  <p style={{color: red[500]}}>お支払い待ち</p>
                </div>
                <div style={styles.point}>
                  <ConveniInfo conveni={conveniInfo} />
                  <div style={{padding: 10, fontSize: 12}}>
                    ※通常、お支払いから1-4時間程度でポイントが付与されます。
                    4時間経過してもポイントが付与されない場合は
                    <InquiryLink />ください。
                  </div>
                </div>
              </div>
            }
            <div style={styles.block}>
              <StarterProgramBannerMini style={{marginTop: 8}} />
              <div style={styles.subheader}>保有ポイント</div>
              <div style={styles.point}>
                <div style={{padding: '50px 10px', textAlign: 'center'}}>
                  <span style={{fontSize: 50}}>{(point.sum.bought + point.sum.limited).toLocaleString()}</span>
                  <span style={{fontSize: 20}}> pt</span>
                  {point.pointBought && typeof point.pointBought.starterPoint === 'number' && (!point.pointBought.starterPointRunOutAt || moment().isBefore(moment(point.pointBought.starterPointRunOutAt).add(1, 'month'))) && !point.pointBought.starterPointRefunded &&
                    <div style={{display: 'flex', justifyContent: 'center', marginTop: 20}}>
                      <div>
                        「まずは10回キャンペーン」残り<span style={{fontSize: 20}}>{point.pointBought.starterPoint.toLocaleString()}</span> pt
                        <a style={{marginLeft: 10}} onClick={() => this.setState({starterPack: true})}>詳細</a>
                      </div>
                    </div>
                  }
                </div>
                <div style={{display: 'flex', fontSize: 14, borderTop: `1px solid ${grey[300]}`}}>
                  <div style={{flex: 1, padding: 10}}>
                    <div style={{display: 'flex'}}>
                      <div>購入分</div>
                      <div style={{flex: 1}} />
                      <a onClick={() => this.setState({deleteModal: true})}>詳細</a>
                    </div>
                    <div style={{margin: '10px 0', textAlign: 'center'}}><span style={{fontSize: 20}}>{point.sum.bought.toLocaleString()}</span> pt</div>
                    <div style={{marginTop: 10, textAlign: 'center'}}>
                      <Button variant='contained' color='primary' style={{minWidth: 100}} onClick={() => this.setState({modal: true})}>ポイント購入</Button>
                    </div>
                  </div>
                  <div style={{flex: 1, padding: 10, borderLeft: `1px solid ${grey[400]}`}}>
                    <div style={{display: 'flex'}}>
                      <div>獲得分</div>
                      <div style={{flex: 1}} />
                      <a onClick={() => this.setState({expireModal: true})}>内訳</a>
                    </div>
                    <div style={{margin: '10px 0', textAlign: 'center'}}><span style={{fontSize: 20}}>{point.sum.limited.toLocaleString()}</span> pt</div>
                    <div style={{marginTop: 10, textAlign: 'center'}}>
                      <Button variant='contained' style={{fontSize: width === 'xs' ? 13 : 14}} color='secondary' onClick={() => this.setState({campaign: true})}>無料ポイント獲得</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.block}>
              <div style={styles.subheader}>お支払い情報</div>
              <div style={styles.point}>
                <CreditCardInfo showRemoveButton />
              </div>
            </div>
            <div style={styles.block}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <div style={styles.subheader}>最近のポイント履歴</div>
                <div style={{flex: 1}} />
                <Button color='primary' component={Link} to='/account/points/history'>詳細・領収書</Button>
              </div>
              <PointTable transactions={point.transactions} style={styles.table} />
            </div>
          </div>
        </div>
        <PointModal open={this.state.modal} payjpId={user.payjpId} onClose={() => this.setState({modal: false})} onPaid={this.reload} />
        <StarterProgramDialog open={!!this.state.starterPack} onClose={() => this.setState({starterPack: false})} onPaid={this.reload} />
        <PointCampaignDialog open={!!this.state.campaign} onClose={() => this.setState({campaign: false})}/>
        <ConfirmDialog
          open={!!this.state.deleteModal}
          title='購入ポイントの期限'
          alert={true}
          onSubmit={() => this.setState({deleteModal: false})}
          onClose={() => this.setState({deleteModal: false})}
        >
          <Table style={styles.table}>
            <TableBody>
              {point.pointBought ?
                <CustomRow title={`${point.pointBought.point}pt`}>
                  {moment(point.pointBought.lastUpdatedAt).add(2, 'years').format('YYYY年MM月末まで')}
                </CustomRow>
              : <CustomRow>なし</CustomRow>
              }
            </TableBody>
          </Table>
          <div>※ 購入ポイントは最後にポイント購入もしくは利用した日から2年間経過すると失効します。</div>
        </ConfirmDialog>
        <ConfirmDialog
          open={!!this.state.expireModal}
          title='獲得ポイント一覧'
          alert={true}
          onSubmit={() => this.setState({expireModal: false})}
          onClose={() => this.setState({expireModal: false})}
        >
          <Table style={styles.table}>
            <TableBody>
              {point.pointBalances.length > 0 ? point.pointBalances.map(p =>
                <CustomRow key={p.id} title={`${p.point}pt`}>
                  {moment(p.expiredAt).format('YYYY年MM月末まで')}
                </CustomRow>
              )
              :
                <CustomRow>なし</CustomRow>
              }
            </TableBody>
          </Table>
        </ConfirmDialog>
        <NetbankRedirectDialog
          status={redirectStatus}
          conveniInfo={conveniInfo}
          onSubmit={() => this.setState({redirectStatus: false})}
        />
      </AutohideHeaderContainer>
    )
  }
}
