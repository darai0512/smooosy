import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, formValueSelector } from 'redux-form'
import { withStyles, Tabs, Tab } from '@material-ui/core'
import { red } from '@material-ui/core/colors'

import WarningIcon from '@material-ui/icons/Warning'

import ProServiceContainer from 'components/account/proservice/ProServiceContainer'
import ProServiceProgress from 'components/account/proservice//ProServiceProgress'
import ProServiceDescriptionSetting from 'components/ProServiceDescriptionSetting'
import Notice from 'components/Notice'
import ProfileBase from 'components/ProfileBase'
import { MeetOverview } from 'components/users/RequestPage'

import { update as updateProService } from 'modules/proService'
import { load as loadProfile } from 'modules/profile'
import { loadAll as loadLabels } from 'modules/proLabel'

const selector = formValueSelector('proServiceDescription',)

@connect(
  state => ({
    proService: state.proService.proService,
    user: state.auth.user,
    formValues: selector(state, 'catchphrase', 'labels', 'description', 'advantage', 'accomplishment'),
    labels: state.proLabel.labels,
    profile: state.profile.profile,
  }),
  { updateProService,  loadLabels, loadProfile }
)
@reduxForm({
  form: 'proServiceDescription',
})
@withStyles(theme => ({
  root: {
    height: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '20px 0',
    color: theme.palette.grey[800],
  },
  small: {
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  tabs: {
    marginBottom: 20,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  link: {
    textDecoration: 'underline',
  },
  hidden: {
    display: 'none',
  },
  warningIcon: {
    position: 'absolute',
    right: 5,
    color: red[500],
  },
}))
export default class ProServiceDescriptionPage extends React.Component {

  constructor(props) {
    super(props)
    const {
      location: { pathname },
      match: { params: { id } },
    } = props

    const isSetup = /setup\-services/.test(pathname)
    this.state = {
      prevPage: isSetup ? `/setup-services/${id}/business-hour` : `/account/services/${id}`,
      nextPage: isSetup ? `/setup-services/${id}/locations` : `/account/services/${id}`,
      submitLabel: isSetup ? '更新して次へ' : '更新する',
      tab: 0,
    }
    const labels = {}
    props.proService.labels.forEach(l => labels[l] = true)

    props.initialize({
      catchphrase: props.proService.catchphrase,
      description: props.proService.description,
      accomplishment: props.proService.accomplishment,
      advantage: props.proService.advantage,
      labels,
    })
  }

  componentDidMount() {
    this.props.loadProfile(this.props.proService.profile._id)
    this.props.loadLabels(this.props.proService.service._id)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.submitFailed && this.props.submitFailed) {
      this.setState({tab: 0})
    }
  }

  saveAndExit = values => {
    return this.submit(values).then(() => this.props.history.push('/account/services'))
  }

  onSubmit = values => {
    return this.submit(values).then(() => this.props.history.push(this.state.nextPage))
  }

  submit = ({catchphrase, description, accomplishment, advantage, labels}) => {
    const setupDescriptions = !!description

    return this.props.updateProService(
      this.props.match.params.id,
      {catchphrase, description, accomplishment, advantage, setupDescriptions, labels: Object.keys(labels).filter(l => labels[l])}
    )
  }

  onChangeTab = (event, tab) => {
    this.setState({tab})
  }

  render () {
    const { location: { pathname }, handleSubmit, submitting, proService, profile, classes, labels, user, formValues, invalid } = this.props
    const { submitLabel, prevPage, tab } = this.state
    if (!proService || !profile) return null

    const isSetup = /setup\-services/.test(pathname)
    const helpLink = 'https://help.smooosy.com/%E3%83%97%E3%83%AD%E3%81%A8%E3%81%97%E3%81%A6%E6%88%90%E5%8A%9F%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AE%E3%82%B3%E3%83%84/%E9%AD%85%E5%8A%9B%E7%9A%84%E3%81%AA%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E3%82%92%E4%BD%9C%E3%82%8B/%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E5%88%A5%E3%81%AE%E7%B4%B9%E4%BB%8B%E6%96%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6'
    const hideDetail = !proService.accomplishment && !proService.advantage

    const idList = proService.media.map(m => m.id)
    const media = [...proService.media, ...profile.media.filter(m => !idList.includes(m._id))]
    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={submitLabel}
          submitDisabled={submitting || invalid}
          prevPage={prevPage}
        >
          <div className={classes.title}>
            <h3>
              {proService.service.name}サービスの自己紹介を設定しましょう
            </h3>
            <Notice type='info'>
              <div className={classes.small}>
                サービスの魅力を伝えられ、<b>成約率がアップ</b>します。
                詳細は<a className={classes.link} href={helpLink} target='_blank' rel='noopener noreferrer'>こちら</a>。
              </div>
            </Notice>
          </div>
          <Tabs
            value={tab}
            onChange={this.onChangeTab}
            variant='fullWidth'
            className={classes.tabs}
            indicatorColor='primary'
            textColor='primary'
          >
            <Tab
              disableRipple
              label={<>編集{invalid && <WarningIcon className={classes.warningIcon} />}</>}
            />
            <Tab
              disableRipple
              label='プレビュー'
            />
          </Tabs>
          <ProServiceDescriptionSetting className={tab !== 0 && classes.hidden} labels={labels} proService={proService} hideDetail={hideDetail} />
          <Preview
            className={tab !== 1 && classes.hidden}
            meet={{
              pro: user,
              profile: {
                ...profile,
                description: formValues.description || profile.description,
                accomplishment: formValues.accomplishment || profile.accomplishment,
                advantage: formValues.advantage || profile.advantage,
                catchphrase: formValues.catchphrase || profile.catchphrase,
                media,
              },
              proService: {
                labels: labels.filter(l => (formValues.labels || {})[l._id]),
                catchphrase: formValues.catchphrase,
              },
              status: 'waiting',
              chats: [{user}],
              price: 10000,
            }}
            request={{
              customer: {
                id: user._id,
              },
            }}
          />
        </ProServiceContainer>
      </form>
    )
  }
}

const Preview = withStyles(theme => ({
  previewWrap: {
    width: '100%',
    maxWidth: 380,
    margin: '20px auto 10px',
  },
  preview: {
    border: `1px solid ${theme.palette.grey[400]}`,
    marginBottom: 20,
  },
  previewAnnotation: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.palette.grey[700],
  },
}))(({
  className,
  classes,
  meet,
  request,
}) => {
  return (
    <div className={[classes.previewWrap, className].join(' ')}>
      <div className={classes.previewAnnotation}>依頼者画面</div>
      <div className={classes.preview}>
        <MeetOverview
          meet={meet}
          request={request}
        />
      </div>
      <div className={classes.previewAnnotation}>チャット画面のプロフィール</div>
      <div className={classes.preview}>
        <ProfileBase
          profile={{...meet.profile, pro: meet.pro, proService: meet.proService}}
        />
      </div>
    </div>
  )
})


