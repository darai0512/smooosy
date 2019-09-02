import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, formValueSelector, Field } from 'redux-form'
import { withStyles, withWidth } from '@material-ui/core'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  List,
  ListItem,
  Radio,
  IconButton,
  DialogTitle,
} from '@material-ui/core'
import LeftIcon from '@material-ui/icons/ChevronLeft'
import RightIcon from '@material-ui/icons/ChevronRight'
import TrendingUpIcon from '@material-ui/icons/TrendingUp'
import LocationOnIcon from '@material-ui/icons/LocationOn'
import DescriptionIcon from '@material-ui/icons/Description'
import WorkIcon from '@material-ui/icons/Work'
import LocalOfferIcon from '@material-ui/icons/LocalOffer'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'
import CloseIcon from '@material-ui/icons/Close'
import { red, indigo } from '@material-ui/core/colors'

import ConfirmDialog from 'components/ConfirmDialog'
import renderRadioGroup from 'components/form/renderRadioGroup'
import CustomChip from 'components/CustomChip'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import { update as updateProService } from 'modules/proService'
import { update as updateProfile } from 'modules/profile'
import { open as openSnack } from 'modules/snack'
import { isMatchMoreCampaignService } from 'lib/instant'

@withWidth()
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
  chipWrap: {
    padding: 10,
    textAlign: 'center',
  },
  chip: {
    background: indigo[500],
    color: theme.palette.common.white,
  },
  help: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
    color: theme.palette.grey[700],
  },
  subheader: {
    marginBottom: 20,
  },
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
  sub: {
    fontSize: 12,
    color: theme.palette.grey[500],
    marginLeft: 30,
    marginRight: 10,
  },
  select: {
    marginTop: 20,
  },
  promotion: {
    marginLeft: 10,
  },
  promoOffButton: {
    width: 120,
    minWidth: 60,
    color: indigo[500],
    '&:hover': {
      color: indigo[700],
    },
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
    },
  },
  promoButton: {
    width: 120,
    minWidth: 60,
    background: indigo[500],
    color: theme.palette.common.white,
    padding: 8,
    '&:hover': {
      background: indigo[700],
    },
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
    },
  },
  description: {
    maxWidth: '100%',
    [theme.breakpoints.down('xs')]: {
      maxWidth: '80%',
    },
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
  },
  progress: {
    color: red[500],
  },
  finished: {
    color: theme.palette.grey[700],
  },
  arrow: {
    display: 'inherit',
    minWidth: 24,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  deleteButton: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 20,
  },
}))
@connect(
  state => ({
    defaultCard: state.point.defaultCard,
    proService: state.proService.proService,
    user: state.auth.user,
  }),
  { updateProService, updateProfile, openSnack }
)
export default class ProServiceSettingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      optOutDialog: false,
    }
    const {
      classes,
      proService: { setupDescriptions, setupJobRequirements, setupLocation, setupPriceValues, setupBudget, service, priceValuesEnabled },
      match: { params: { id } },
    } = props

    const possibleSettingPages = {
      description: {icon: <DescriptionIcon className={classes.icon} />, link: `/account/services/${id}/descriptions`, title: 'サービス別自己紹介', subtitle: '依頼者にアピールしましょう', finished: setupDescriptions},
      jobRequirements: {icon: <WorkIcon className={classes.icon} />, link: `/account/services/${id}/job-requirements`, title: '仕事条件', subtitle: 'どのような仕事を担当したいですか？', finished: setupJobRequirements},
      location: {icon: <LocationOnIcon className={classes.icon} />, link: `/account/services/${id}/locations`, title: '仕事エリア', subtitle: 'どこで働いていますか？', finished: setupLocation},
      prices: {icon: <LocalOfferIcon className={classes.icon} />, link: `/account/services/${id}/prices`, title: '価格設定', subtitle: '顧客に提示する価格はいくらですか？', finished: setupPriceValues},
      budget: {icon: <MonetizationOnIcon className={classes.icon} />, link: `/account/services/${id}/budgets`, title: '予算', subtitle: '一週間のマッチングに使える限度額はいくらまでですか？', finished: setupBudget},
    }
    const settingPages = new Set([
      possibleSettingPages.description,
    ])

    settingPages.add(possibleSettingPages.location)
    if (service.matchMoreEditable) {
      settingPages.add(possibleSettingPages.jobRequirements)
      settingPages.add(possibleSettingPages.prices)
      settingPages.add(possibleSettingPages.budget)
    }

    if (service.showJobRequirements) {
      settingPages.add(possibleSettingPages.jobRequirements)
    }

    if (priceValuesEnabled) {
      settingPages.add(possibleSettingPages.prices)
    }
    this.settingPages = Array.from(settingPages)
  }

  togglePromo = () => {
    const { proService: { isPromoted }, updateProService, match: { params: { id } } } = this.props
    if (isPromoted) {
      return this.setState({optOutDialog: true})
    }

    updateProService(id, {isPromoted: true})
  }

  submitOptOutReason = values => {
    return this.props.updateProService(this.props.match.params.id, {isPromoted: false, optOutReason: values})
      .then(() => this.setState({optOutDialog: false}))
  }

  moveToStep = () => {
    const serviceId = this.props.match.params.id
    this.props.history.push(`/setup-services/${serviceId}/introduction`)
  }

  moveToBudget = () => {
    const serviceId = this.props.match.params.id
    this.props.history.push(`/setup-services/${serviceId}/budgets`)
  }

  onDelete = () => {
    const { proService } = this.props
    const profile = proService.profile
    const body = {
      services: profile.services.filter(s => s !== proService.service.id),
    }
    const id = profile.id
    return this.props.updateProfile(id, body).then(() => {
      this.props.openSnack('削除しました')
      this.props.history.push('/account/services')
    })
  }

  render () {
    const { proService, classes, defaultCard, width, user } = this.props

    const service = proService.service

    const needSetting = !user.setupBusinessHour ||
      !proService.setupLocation ||
      !proService.setupJobRequirements ||
      !proService.priceValues ||
      !proService.setupBudget

    const isCarMatchMore = isMatchMoreCampaignService(service)
    return (
      <>
        <AutohideHeaderContainer
          className={classes.root}
          header={
            <div className={classes.header}>
              <div style={{flex: 1}}>
                <Button style={{minWidth: 40}} component={Link} to='/account/services'><LeftIcon /></Button>
              </div>
              <div>{service.name}</div>
              <div style={{flex: 1}} />
            </div>
          }
        >
          <div className={classes.container}>
            {service.matchMoreEditable &&
              <>
                <div className={classes.chipWrap}>
                  <CustomChip className={classes.chip} label='ご指名' />
                </div>
                <div className={classes.help}>
                  ご指名方式に関するご不明点は
                  {/* https://help.smooosy.com/ご指名方式について */}
                  <a href='https://help.smooosy.com/%E3%81%94%E6%8C%87%E5%90%8D%E6%96%B9%E5%BC%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6' target='_blank' rel='nofollow noopener noreferrer'>こちら</a>
                  をご覧ください
                </div>
              </>
            }
            <List className={classes.list}>
              {service.matchMoreEditable &&
                <ListItem className={classes.listItem}>
                  <div className={classes.item}>
                    <div>
                      <h4 className={classes.main}>
                        <TrendingUpIcon className={classes.icon} />
                        <div className={classes.title}>
                          ラクラクお得モード
                          {(needSetting || !defaultCard) ? '' : proService.isPromoted ? 'ON' : 'OFF'}
                        </div>
                      </h4>
                      <div className={classes.sub}>
                        {needSetting ?
                          '設定が完了していません' :
                          !defaultCard ?
                          'クレジットカードの登録がありません' :
                          proService.isPromoted ?
                          `検索結果で上位に表示され、ご指名での依頼が条件にマッチした場合に自動的にポイントを利用します。また利用するポイントが20%割引になります。${isCarMatchMore ? '「依頼どれでも1ptキャンペーン」期間中は20%割引対象外です' : ''}` :
                          'ご指名で依頼があった場合、依頼を見て受けるかを選び、ポイントを利用します。ポイントの割引はありません。'
                        }
                      </div>
                    </div>
                    <div className={classes.promotion}>
                      <Button className={(defaultCard && !needSetting && proService.isPromoted) ? classes.promoOffButton : classes.promoButton} color='primary' onClick={needSetting ? this.moveToStep : !defaultCard ? this.moveToBudget : this.togglePromo}>
                        {(needSetting || !defaultCard) ? '設定を再開する' : proService.isPromoted ? (width === 'xs' ? 'OFF' : 'OFFにする') : (width === 'xs' ? 'ON' : 'ONにする')}
                      </Button>
                    </div>
                  </div>
                </ListItem>
              }
              {this.settingPages.map(i =>
                <ListItem
                  button
                  key={i.link}
                  className={classes.listItem}
                  component={Link}
                  to={i.link}
                >
                  <div className={classes.item}>
                    <div className={classes.description}>
                      <h4 className={classes.main}>{i.icon}<span className={classes.title}>{i.title}</span></h4>
                      <div className={classes.sub}>{i.subtitle}</div>
                    </div>
                    <div className={classes.nav}>
                      <div className={i.finished ? classes.finished : classes.progress}>
                        {i.finished ? '編集' : '未設定'}
                      </div>
                      <RightIcon className={classes.arrow} />
                    </div>
                  </div>
                </ListItem>
              )}
            </List>
            {/* プロフィール最後のサービスの場合は消せない */}
            {proService.profile.services.length > 1 &&
              <div className={classes.deleteButton}>
                <Button onClick={() => this.setState({deleteDialog: true})}>このサービスの提供を停止する</Button>
              </div>
            }
          </div>
        </AutohideHeaderContainer>
        <ConfirmDialog
          open={!!this.state.deleteDialog}
          title='本当に停止しますか'
          label='はい'
          cancelLabel='いいえ'
          onSubmit={this.onDelete}
          onClose={() => this.setState({deleteDialog: false})}
        />
        <OptOutDialog
          open={this.state.optOutDialog}
          onClose={() => this.setState({optOutDialog: false})}
          onSubmit={this.submitOptOutReason}
          proService={proService}
        />
      </>
    )
  }
}

const tips = 'https://help.smooosy.com/%E3%83%97%E3%83%AD%E3%81%A8%E3%81%97%E3%81%A6%E6%88%90%E5%8A%9F%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AE%E3%82%B3%E3%83%84'
const aboutMatchMore = 'https://help.smooosy.com/%E3%81%94%E6%8C%87%E5%90%8D%E6%96%B9%E5%BC%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6'
const differencePromo = 'https://help.smooosy.com/%E3%81%94%E6%8C%87%E5%90%8D%E6%96%B9%E5%BC%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/%E3%83%A9%E3%82%AF%E3%83%A9%E3%82%AF%E3%81%8A%E5%BE%97%E3%83%A2%E3%83%BC%E3%83%89on%E3%81%A8off%E3%81%AE%E9%81%95%E3%81%84%E3%81%AF'
const createChoices = (ps) => [
  {
    label: '自分の仕事に合っていない依頼が来る',
    value: 'notRightJob',
    children: [
      {
        label: '条件の合わない依頼が来る',
        value: 'wrongJob',
        to: {
          title: '適切な仕事条件を設定しましょう！',
          description: '依頼の受け取り条件を見直して適切な仕事を受け取りましょう。',
          button: '条件を設定する',
          buttonTo: `/account/services/${ps.service._id}/job-requirements`,
        },
      },
      {
        label: '対応エリア外の依頼が届く',
        value: 'wrongLocation',
        to: {
          title: '適切な仕事条件を設定しましょう！',
          description: '依頼を受けるエリアを設定することができます。',
          button: '対応エリアを設定する',
          buttonTo: `/account/services/${ps.service._id}/locations`,
        },
      },
      {
        label: 'スケジュールの合わない依頼に課金された',
        value: 'wrongSchedule',
        to: {
          title: '営業時間の他に個別にスケジュールを設定できます',
          description: 'スケジュールが空いている場合に依頼は送られます。スケジュールを入力することで不必要な依頼が来ないようにしましょう。',
          button: 'スケジュールを設定する',
          buttonTo: '/pros/schedules',
        },
      },
    ],
  },
  {
    label: '計算される金額と実際に請求したい金額が合っていない',
    value: 'notAccurate',
    to: {
      title: '価格設定を見直してみましょう',
      description: '見積価格の金額設定を見直すことで正確な見積り金額に近づけることができます',
      button: '設定画面へ行く',
      buttonTo: `/account/services/${ps.service._id}/prices`,
    },
  },
  {
    label: '消費ポイントが大きすぎる',
    value: 'spendTooMuch',
    children: [
      {
        label: 'マッチ単価が高すぎる',
        value: 'expensivePerMatch',
        to: {
          title: '回答ありがとうございます',
          description: 'OFFにしても検索結果のページには掲載されます。来た依頼を受けるかどうかを選ぶことができますが、20%割引は適用されなくなります。',
          button: '課金の仕組みを確認する',
          buttonTo: differencePromo,
        },
      },
      {
        label: '毎週使いすぎ',
        value: 'expensivePerWeek',
        to: {
          title: '消費金額を調整できます',
          description: '毎週使う上限を設定することができます。上限に達するとそれ以上ポイントを消費することはありません。',
          button: '予算設定をする',
          buttonTo: '/account/services',
          learnMoreTo: aboutMatchMore,
        },
      },
      {
        label: 'マッチ価格をあらかじめ見たい',
        value: 'seePriceInAdvance',
        to: {
          title: '回答ありがとうございます',
          description: 'OFFにしても検索結果のページには掲載されます。来た依頼を受けるかどうかを選ぶことができますが、20%割引は適用されなくなります。',
          button: '課金の仕組みを確認する',
          buttonTo: differencePromo,
          learnMoreTo: aboutMatchMore,
        },
      },
    ],
  },
  {
    label: 'もう少しSMOOOSYを使ってからONにしたい',
    value: 'notSendEnough',
    to: {
      title: 'より多くのお客様と出会いましょう！',
      description: '多くの依頼を受け取るためのコツを知ることができます',
      button: 'コツを見る',
      buttonTo: tips,
    },
  },
  {
    label: 'その他',
    value: 'other',
    children: [
      {
        label: 'ご指名方式がいまいち分かっていない',
        value: 'notSureMatchMore',
        to: {
          title: '解説ページをご用意しております',
          description: 'ヘルプページでご質問にお答えします。',
          button: 'ヘルプページへ行く',
          buttonTo: aboutMatchMore,
        },
      },
      {
        label: '依頼が来ない',
        value: 'notContactMe',
        to: {
          title: '回答ありがとうございます',
          description: '依頼が来るようになるコツをご説明します',
          button: 'コツを見る',
          buttonTo: tips,
        },
      },
      {
        label: '依頼は来るけど成約しない',
        value: 'notContract',
        to: {
          title: '回答ありがとうございます',
          description: '成約のコツをご説明するページを用意しております',
          button: 'コツを見る',
          buttonTo: tips,
        },
      },
    ],
  },
]

const selector = formValueSelector('opt-out-dialog')
@reduxForm({
  form: 'opt-out-dialog',
})
@connect(state => {
  const choices = createChoices(state.proService.proService)
  const selected = choices.find(c => c.value === selector(state, 'answer')) || {}
  return {
    answer: selector(state, 'answer'),
    subAnswer: selector(state, 'sub-answer'),
    selected,
    subSelected: selected.children && selected.children.find(c => c.value === selector(state, 'sub-answer')) || {},
    choices,
  }
})
@withWidth()
@withStyles(theme => ({
  form: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    padding: '5px 0',
    display: 'flex',
    alignItems: 'center',
  },
  dialogTitle: {
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      padding: '10px 0',
    },
  },
  dialogTitleText: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 18,
    },
  },
  backButton: {
    margin: '10px 0',
    width: 36,
    height: 36,
  },
  nextButton: {
    margin: 10,
    height: 40,
  },
  disableButton: {
    color: theme.palette.grey[700],
  },
  actions: {
    padding: '5px 0',
  },
  content: {
    flex: 1,
    background: theme.palette.grey[100],
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignSelf: 'flex-start',
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  icon: {
    width: 24,
    height: 24,
  },
}))
class OptOutDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      prevStep: null,
      step: 0,
    }
  }

  onSubmit = values => {
    return this.props.onSubmit(values)
    .then(() => this.props.onClose())
    .then(() => {
      this.setState({step: 0})
      this.props.reset()
    })
  }

  onNext = (e) => {
    const { selected, subSelected } = this.props
    e.preventDefault()
    this.setState({
      step: (subSelected.to || selected.to) ? 2 : 1,
      prevStep: this.state.step,
    })
  }

  onBack = () => {
    const { prevStep } = this.state
    if (prevStep === 1) {
      this.props.change('sub-answer', '')
    }
    this.setState({
      step: prevStep,
      prevStep: prevStep === 1 ? 0 : null,
    })
  }

  render() {
    const { open, onClose, handleSubmit, answer, subAnswer, selected, subSelected, submitting, classes, width, choices } = this.props
    const { step } = this.state

    return (
      <Dialog open={open} onClose={onClose} fullScreen={width === 'xs'}>
        <div className={classes.title}>
          {[1, 2].includes(step) ?
            <IconButton className={classes.backButton} onClick={this.onBack}><LeftIcon className={classes.icon} /></IconButton>
          :
            <div className={classes.backButton} />
          }
          <DialogTitle className={classes.dialogTitle}>
            <span className={classes.dialogTitleText}>{step === 2 && (selected.to || subSelected.to) ? (selected.to || subSelected.to).title : 'サービス向上のため、理由をお教えください。'}</span>
          </DialogTitle>
          <IconButton className={classes.closeButton} onClick={onClose}><CloseIcon className={classes.icon} /></IconButton>
        </div>
        <form onSubmit={handleSubmit(this.onSubmit)} className={classes.form}>
          <DialogContent className={classes.content}>
            <div style={{display: step !== 0 ? 'none' : 'unset'}}>
              <Field component={renderRadioGroup} name='answer'>
                {choices.map(c =>
                  <FormControlLabel
                    key={c.value}
                    control={<Radio color='primary' />}
                    label={c.label}
                    value={c.value}
                  />
                )}
              </Field>
            </div>
            <div style={{display: step !== 1 ? 'none' : 'unset'}}>
              <Field component={renderRadioGroup} name='sub-answer'>
                {(selected.children || []).map(c =>
                  <FormControlLabel
                    key={c.value}
                    control={<Radio color='primary' />}
                    label={c.label}
                    value={c.value}
                    />
                    )}
              </Field>
            </div>
            <div style={{display: step !== 2 ? 'none' : 'unset'}}>
              <Tips to={selected.to || subSelected.to} />
            </div>
          </DialogContent>
          <DialogActions className={classes.actions}>
            {[0, 1].includes(step) ?
              <Button className={classes.nextButton} fullWidth disabled={(!step && !answer) || (step && !subAnswer)} onClick={this.onNext} color='primary' variant='contained'>次へ</Button>
            :
              <Button className={classes.disableButton} disabled={submitting || !answer} type='submit' variant='outlined'>ラクラクお得モードをOFFにする</Button>
            }
          </DialogActions>
        </form>
      </Dialog>
    )
  }
}

const Tips = withStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  description: {
    color: theme.palette.grey[800],
    fontSize: 16,
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      fontSize: 14,
    },
  },
  link: {
    marginLeft: 10,
  },
}))(({to, classes}) => {
  if (!to) return null
  const {buttonTo, button, learnMoreTo, description} = to
  return (
    <div className={classes.root}>
      <div className={classes.description}>
        {description}
        {learnMoreTo && <a target='_blank' rel='nofollow noopener noreferrer' className={classes.link} href={learnMoreTo}>さらに詳しく</a>}
      </div>
      <Button variant='contained' color='primary' component={Link} to={buttonTo}>{button}</Button>
    </div>
  )
})
