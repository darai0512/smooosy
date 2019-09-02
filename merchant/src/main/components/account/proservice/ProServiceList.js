import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Dialog, DialogTitle, DialogContent, CircularProgress, List, ListItem } from '@material-ui/core'
import { withStyles } from '@material-ui/core'

import LeftIcon from '@material-ui/icons/ChevronLeft'
import RightIcon from '@material-ui/icons/ChevronRight'
import InfoIcon from '@material-ui/icons/InfoOutlined'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import WarningIcon from '@material-ui/icons/Warning'
import DescriptionIcon from '@material-ui/icons/Description'
import LocationOnIcon from '@material-ui/icons/LocationOn'
import AddIcon from '@material-ui/icons/Add'
import WorkIcon from '@material-ui/icons/Work'
import LocalOfferIcon from '@material-ui/icons/LocalOffer'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'
import { indigo, red, orange } from '@material-ui/core/colors'

import { loadAll as loadProServices } from 'modules/proService'
import { loadAllForPro as loadSchedules } from 'modules/schedule'
import { update as updateUser, load as loadUser } from 'modules/auth'
import { paymentInfo } from 'modules/point'

import WeeklySchedule from 'components/WeeklySchedule'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import BusinessHourEdit from 'components/pros/BusinessHourEdit'
import CampaignBanner from 'components/pros/CampaignBanner'
import CustomChip from 'components/CustomChip'

import { isMatchMoreCampaignService } from 'lib/instant'

@withStyles(theme => ({
  root: {
    height: '100%',
    background: theme.palette.grey[100],
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: 50,
    padding: '0 20px',
    background: theme.palette.common.white,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('xs')]: {
      padding: '0 10px',
    },
  },
  container: {
    margin: '20px auto',
    maxWidth: 600,
    width: '90%',
  },
  back: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inherit',
    },
  },
  headerItem: {
    flex: 1,
  },
  backButton: {
    minWidth: 40,
  },
  schedule: {
    flex: 3,
    background: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[300]}`,
    marginBottom: 20,
    padding: 16,
  },
  scheduleHeader: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  spacer: {
    flex: 1,
  },
  scheduleButtons: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  title: {
    padding: 10,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    },
  },
  editButton: {
    padding: '8px 16px',
    [theme.breakpoints.down('xs')]: {
      padding: '8px 4px',
    },
  },
  weeklySchedule: {
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
  },
  serviceHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  subheader: {
    marginTop: 50,
    marginBottom: 10,
  },
  list: {
    width: '100%',
    padding: 0,
  },
  listitem: {
    marginTop: 10,
    padding: 0,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: theme.palette.common.white,
  },
  pointer: {
    cursor: 'pointer',
  },
  itemContainer: {
    width: '100%',
  },
  item: {
    position: 'relative',
    padding: 20,
    width: '100%',
  },
  name: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      alignItems: 'flex-start',
      flexDirection: 'column-reverse',
    },
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profile: {
    fontSize: 14,
    marginTop: 5,
    color: theme.palette.grey[500],
  },
  budget: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  summary: {
    fontSize: 10,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    right: 20,
    marginTop: -12,
    minWidth: 24,
    alignSelf: 'center',
    marginRight: 5,
  },
  dialogTitle: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  dialogContent: {
    padding: 0,
  },
  noticeText: {
    padding: 20,
    background: indigo[500],
    color: theme.palette.common.white,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
  setupButton: {
    minWidth: 130,
    marginLeft: 10,
    background: theme.palette.common.white,
    '&:hover': {
      background: theme.palette.grey[100],
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 10,
      marginLeft: 0,
    },
  },
  next: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
  },
  promoChip: {
    background: indigo[500],
    color: theme.palette.common.white,
  },
  loading: {
    paddingTop: 50,
    display: 'flex',
    justifyContent: 'center',
  },
  setting: {
    paddingTop: 10,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.grey[800],
  },
  finishTitle: {
    color: theme.palette.secondary.main,
    fontWeight: 'bold',
    marginRight: 20,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  unfinishTitle: {
    color: red[500],
    fontWeight: 'bold',
    marginRight: 20,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  settingList: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  settingItem: {
    marginRight: 5,
    display: 'flex',
    alignItems: 'center',
  },
  addServiceButton: {
    marginTop: 20,
    width: '100%',
    background: 'white',
    border: `1px dotted ${theme.palette.grey[300]}`,
    height: 100,
    borderRadius: 0,
    fontSize: 18,
    fontWeight: 'bold',
  },
}))
@connect(
  state => ({
    proServices: state.proService.proServices,
    schedules: state.schedule.schedules,
    user: state.auth.user,
  }),
  { loadSchedules, loadProServices, paymentInfo, updateUser, loadUser }
)
export default class ProServiceList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {open: false, loaded: false}
  }

  componentDidMount() {
    Promise.all([
      this.props.updateUser({isMatchMore: true}),
      this.props.paymentInfo(),
      this.props.loadProServices(),
      this.props.loadSchedules(),
      this.props.loadUser(), // needed for hasActiveCard
    ])
    .finally(() =>  this.setState({loaded: true}))
  }

  moveToSettings = service => {
    const { pathname, search, hash } = this.props.location
    const url = `${pathname}/${service.id}${search}${hash}`
    this.props.history.push(url)
  }

  moveToFlow = (e, serviceId) => {
    e.stopPropagation()
    this.props.history.push(`/setup-services/${serviceId}/introduction`)
  }

  addService = () => {
    this.props.history.push('/account/services/add')
  }

  render() {
    const { proServices, schedules, user, classes } = this.props
    const { open, loaded } = this.state

    let hasMatchmoreService = false
    let hasConditionalMatchService = false
    const keys = Object.keys(proServices)
    const pss = []
    for (let key in proServices) {
      const ps = proServices[key]
      if (ps.service.matchMoreEditable) {
        hasMatchmoreService = true
        pss.unshift(ps)
      } else {
        pss.push(ps)
      }
      if (ps.service.showJobRequirements) hasConditionalMatchService = true
    }

    const settings = {
      descriptions: {
        key: 'descriptions',
        icon: <DescriptionIcon className={classes.icon} />,
        title: 'サービス別自己紹介',
      },
      locations: {
        key: 'locations',
        icon: <LocationOnIcon className={classes.icon} />,
        title: '仕事エリア',
      },
      jobRequirements: {
        key: 'job-requirements',
        icon: <WorkIcon className={classes.icon} />,
        title: '仕事条件',
      },
      prices: {
        key: 'prices',
        icon: <LocalOfferIcon className={classes.icon} />,
        title: '価格設定',
      },
      budgets: {
        key: 'budgets',
        icon: <MonetizationOnIcon className={classes.icon} />,
        title: '予算',
      },
    }

    const bulkSettings = []
    if (hasMatchmoreService || hasConditionalMatchService) {
      bulkSettings.push(settings.jobRequirements)
    }
    if (hasMatchmoreService) {
      bulkSettings.push(settings.prices)
    }
    bulkSettings.push(settings.descriptions)

    return (
      <AutohideHeaderContainer
        className={classes.root}
        header={
          <div className={classes.header}>
            <div className={classes.headerItem}>
              <Link to='/account' className={classes.back}>
                <Button className={classes.backButton} ><LeftIcon /></Button>
              </Link>
            </div>
            <div>サービス一覧</div>
            <div className={classes.headerItem} />
          </div>
        }
      >
        <div className={classes.container}>
          <div className={classes.schedule}>
            <div className={classes.scheduleHeader}>
              <h4 className={classes.title}>直近の予定</h4>
              <div className={classes.spacer} />
              <div className={classes.scheduleButtons}>
                <Button color='primary' className={classes.editButton} onClick={() => this.props.history.push('/pros/schedules', {from: '/account/services'})}>詳細を見る</Button>
                <Button color='primary' className={classes.editButton} onClick={() => this.setState({open: true})}>営業時間を編集</Button>
              </div>
            </div>
            <div className={classes.weeklySchedule}>
              <WeeklySchedule schedules={schedules} dayOff={user.schedule.dayOff} />
            </div>
          </div>
          {!loaded ?
            <div className={classes.loading}>
              <CircularProgress />
            </div>
           : keys.length > 0 ?
            <>
              {bulkSettings.length > 0 &&
                <>
                  <h3 className={classes.subheader}>一括設定</h3>
                  <BulkSettingList list={bulkSettings} />
                </>
              }
              <div style={{marginTop: 40}}>
                <CampaignBanner />
              </div>
              <div className={classes.serviceHeader}>
                <h3 className={classes.subheader}>サービス一覧</h3>
                <Button variant='contained' color='primary' onClick={this.addService}><AddIcon />サービスを追加</Button>
              </div>
              <div className={classes.list}>
                {pss.map(proService => {
                  const isMatchmoreService = proService.service.matchMoreEditable
                  const isConditionalMatchService = proService.service.showJobRequirements
                  const setupFlags = [
                    // user.setupBusinessHour, // あえて外す
                    // proService.setupDescriptions,
                    proService.setupLocation,
                    proService.setupJobRequirements,
                    proService.setupPriceValues,
                    proService.setupBudget,
                  ]
                  const finished = isMatchmoreService && setupFlags.every(sf => sf)
                  const moveToFlow = isMatchmoreService && setupFlags.every(sf => !sf)

                  const finishedSettings = []
                  const unfinishedSettings = []
                  if (proService.setupDescriptions) {
                    finishedSettings.push(settings.descriptions)
                  } else {
                    unfinishedSettings.push(settings.descriptions)
                  }
                  if (isMatchmoreService) {
                    if (proService.setupLocation) {
                      finishedSettings.push(settings.locations)
                    } else {
                      unfinishedSettings.push(settings.locations)
                    }
                  }
                  if (isMatchmoreService || isConditionalMatchService) {
                    if (proService.setupJobRequirements) {
                      finishedSettings.push(settings.jobRequirements)
                    } else {
                      unfinishedSettings.push(settings.jobRequirements)
                    }
                  }
                  if (proService.priceValuesEnabled) {
                    if (proService.setupPriceValues) {
                      finishedSettings.push(settings.prices)
                    } else {
                      unfinishedSettings.push(settings.prices)
                    }
                  }
                  if (isMatchmoreService) {
                    if (proService.setupBudget) {
                      finishedSettings.push(settings.budgets)
                    } else {
                      unfinishedSettings.push(settings.budgets)
                    }
                  }

                  return (
                    <div
                      key={proService._id}
                      className={[classes.listitem, classes.pointer].join(' ')}
                      onClick={(e) => moveToFlow ? this.moveToFlow(e, proService.service.id) : this.moveToSettings(proService.service)}
                    >
                      <div className={classes.itemContainer}>
                        <div className={classes.item}>
                          <WhatIsMissing proService={proService} />
                          <div className={classes.name}>
                            <div className={classes.serviceName}>{proService.service.name}</div>
                            <div className={classes.spacer} />
                            {finished && proService.isPromoted && <CustomChip className={classes.promoChip} label='ラクラクお得モードON' />}
                            {finished && !proService.isPromoted && <CustomChip label='ラクラクお得モードOFF' />}
                          </div>
                          <div className={classes.profile}>{proService.profile.name}</div>
                          <div className={classes.budget}>
                            {proService.service.matchMoreEditable ?
                              <>
                                <div className={classes.summary}>消費</div>
                                <div>{proService.spent}pt</div>
                              </>
                              : null
                            }
                          </div>
                          {finishedSettings.length > 0 &&
                            <div className={classes.setting}>
                              <div className={classes.finishTitle}>
                                <CheckCircleIcon />
                                設定済
                              </div>
                              <div className={classes.settingList}>
                                {finishedSettings.map(setting =>
                                  <div key={setting.key} className={classes.settingItem} title={setting.title}>
                                    {setting.icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          }
                          {unfinishedSettings.length > 0 &&
                            <div className={classes.setting}>
                              <div className={classes.unfinishTitle}>
                                <WarningIcon />
                                未設定
                              </div>
                              <div className={classes.settingList}>
                                {unfinishedSettings.map(setting =>
                                  <div key={setting.key} className={classes.settingItem} title={setting.title}>
                                    {setting.icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          }
                          <RightIcon className={classes.arrow} />
                        </div>
                        {!isMatchmoreService ?
                            null
                        : finished && !proService.isPromoted ?
                          <div className={classes.noticeText}>
                            <div>ラクラクお得モードをONにすることで、検索上位に表示されます（ポイント２０％割引）</div>
                            <Button className={classes.setupButton} onClick={() => this.moveToSettings(proService.service)}>設定する</Button>
                          </div>
                        : !finished ?
                          <div className={classes.noticeText}>
                            <div>設定を完了し、検索上位に表示されるようにしましょう</div>
                            <Button className={classes.setupButton} onClick={(e) => this.moveToFlow(e, proService.service.id)}>{moveToFlow ? '設定を始める' : '設定を再開する'}</Button>
                          </div>
                        : null}
                      </div>
                    </div>
                  )
                })}
                <Button className={classes.addServiceButton} color='primary' onClick={this.addService}><AddIcon />サービスを追加</Button>
              </div>
            </>
          : null
          }
        </div>
        <Dialog
          open={!!open}
          onClose={() => this.setState({open: false})}
        >
          <DialogTitle className={classes.dialogTitle}>営業時間の編集</DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <BusinessHourEdit schedules={schedules} onSubmit={() => this.setState({open: false})} />
          </DialogContent>
        </Dialog>
      </AutohideHeaderContainer>
    )
  }
}


let BulkSettingList = ({list, classes}) => (
  <List className={classes.list}>
    {list.map(i =>
      <ListItem
        button
        key={i.key}
        className={classes.listItem}
        component={Link}
        to={`/account/services/bulk/${i.key}`}
      >
        <div className={classes.item}>
          <h4 className={classes.main}>
            {i.icon}
            <span className={classes.title}>{i.title}</span>
          </h4>
          <RightIcon />
        </div>
      </ListItem>
    )}
  </List>
)

BulkSettingList = withStyles(theme => ({
  list: {
    width: '100%',
    background: theme.palette.common.white,
    padding: 0,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: '1px 1px 0',
  },
  listItem: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  main: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
  },
  title: {
    wordBreak: 'keep-all',
    width: 150,
    marginLeft: 10,
  },
}))(BulkSettingList)

const WhatIsMissing = withStyles({
  campaign: {
    paddingBottom: 10,
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: indigo[500],
  },
  noCampaign: {
    paddingBottom: 10,
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: orange[500],
  },
  campaignIcon: {
    fontSize: 16,
    marginRight: 3,
  },
})(connect(state => ({
  hasActiveCard: state.auth.user.hasActiveCard,
}))(({proService, classes, hasActiveCard}) => {
  const isTargetService = useMemo(() => isMatchMoreCampaignService(proService.service), [proService])
  if (!isTargetService) return null

  return (
    <div>
      {proService.isMatchMore && proService.setupPriceValues && hasActiveCard ?
        <div className={classes.campaign}><InfoIcon className={classes.campaignIcon} />1ptキャンペーン適用</div>
      : proService.isMatchMore && proService.setupPriceValues ?
        <div className={classes.noCampaign}><InfoIcon className={classes.campaignIcon} />1ptキャンペーン適用にはクレジットカード登録が必要です</div>
      :
        <div className={classes.noCampaign}><InfoIcon className={classes.campaignIcon} />1ptキャンペーン適用には追加設定{!hasActiveCard ? '・クレジットカード登録' : ''}が必要です</div>
      }
    </div>
  )
}))
