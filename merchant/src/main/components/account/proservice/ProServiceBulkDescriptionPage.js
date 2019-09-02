import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { reduxForm, FormSection } from 'redux-form'
import { Button, Divider, withStyles } from '@material-ui/core'
import { red, indigo } from '@material-ui/core/colors'

import ProServiceContainer from './ProServiceContainer'
import ProServiceProgress from './ProServiceProgress'
import ProServiceDescriptionSetting from 'components/ProServiceDescriptionSetting'
import Notice from 'components/Notice'

import { updateMany } from 'modules/proService'

@connect(state => ({
  proServices: state.proService.proServices,
}), { updateMany })
@reduxForm({
  form: 'proServiceBulkDescription',
})
@withStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },
  title: {
    textAlign: 'center',
    paddingTop: 20,
    color: theme.palette.grey[800],
    fontSize: 28,
  },
  sectionWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    margin: '0 auto',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionRoot: {
    margin: '40px 0 10px',
  },
  taskBar: {
    cursor: 'pointer',
    display: 'flex',
    width: '100%',
    padding: '20px 0px',
    background: indigo[500],
    color: theme.palette.common.white,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    [theme.breakpoints.down('xs')]: {
      alignItems: 'flex-start',
      flexDirection: 'column',
      padding: 20,
    },
  },
  taskButton: {
    background: theme.palette.common.white,
    '&:hover': {
      background: theme.palette.grey[100],
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 10,
    },
  },
  helpLink: {
    color: red[500],
  },
}))
export default class ProServiceBulkDescriptionPage extends React.Component {
  constructor(props) {
    super(props)
    const { proServices } = props
    const initialValues = proServices
    props.initialize(initialValues)
    this.submitLabel = props.isSetup ? '更新して次へ' : '自己紹介を更新する'
  }

  saveAndExit = values => this.submit(values).then(() => this.props.history.push('/account/services'))

  onSubmit = values => this.submit(values).then(this.props.next)

  submit = values => {
    const data = {}
    console.log(values)
    for (const id in values) {
      data[id] = {
        description: values[id].description,
        setupDescriptions: !!values[id].description,
      }
    }

    return this.props.updateMany(data)
  }

  render () {
    const { proServices, handleSubmit, classes, submitting, location: { pathname } } = this.props

    if (!proServices) return null

    const helpLink = 'https://help.smooosy.com/%E3%83%97%E3%83%AD%E3%81%A8%E3%81%97%E3%81%A6%E6%88%90%E5%8A%9F%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AE%E3%82%B3%E3%83%84/%E9%AD%85%E5%8A%9B%E7%9A%84%E3%81%AA%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E3%82%92%E4%BD%9C%E3%82%8B/%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E5%88%A5%E3%81%AE%E7%B4%B9%E4%BB%8B%E6%96%87%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6'

    return (
      <form className={classes.root} onSubmit={handleSubmit(this.onSubmit)}>
        <ProServiceContainer
          stepper={this.props.isSetup ? <ProServiceProgress pathname={pathname} saveAndExit={handleSubmit(this.saveAndExit)} /> : null}
          submitLabel={this.submitLabel}
          submitDisabled={submitting}
          back={this.props.back}
        >
          <div className={classes.taskBar}>
            <div>設定を完了し、無料ポイントを獲得しましょう</div>
            <Button variant='contained' className={classes.taskButton} component={Link} to={'/account/tasks#proServiceDescription'}>獲得する</Button>
          </div>
          <h3 className={classes.title}>
            サービス別自己紹介の設定
          </h3>
          <Notice type='info'>
            <div>
              サービスの魅力を伝えられ、<b>成約率がアップ</b>します。
              詳細は<a className={classes.helpLink} href={helpLink} target='_blank' rel='noopener noreferrer'>こちら</a>。
            </div>
          </Notice>
          <div className={classes.sectionWrap}>
            {Object.keys(proServices).map((id, idx, arr) => {
              const proService = proServices[id]
              return (
                <React.Fragment key={id}>
                  <div className={classes.sectionRoot}>
                    <div className={classes.serviceName}>{proServices[id].service.name}</div>
                    <div>
                      <FormSection name={id}>
                        <ProServiceDescriptionSetting proService={proService} bulkMode />
                      </FormSection>
                    </div>
                  </div>
                  {idx !== arr.length - 1 && <Divider />}
                </React.Fragment>
              )
            })}
          </div>
        </ProServiceContainer>
      </form>
    )
  }
}
