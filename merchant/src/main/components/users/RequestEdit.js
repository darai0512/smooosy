import React from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux'
import { RadioGroup, Radio, Button, CircularProgress, FormControlLabel } from '@material-ui/core'
import withWidth from '@material-ui/core/withWidth'
import { withTheme } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'

import { load as loadRequest, update as updateRequest } from 'modules/request'
import { update as updateMeet } from 'modules/meet'
import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import Loading from 'components/Loading'
import UserAvatar from 'components/UserAvatar'
import { suspendReason } from '@smooosy/config'

@withWidth()
@connect(
  state => ({
    request: state.request.request,
    meets: (state.request.request || {}).meets,
  }),
  { loadRequest, updateRequest, updateMeet }
)
@reduxForm({
  form: 'request',
})
@withTheme
export default class RequestEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.loadRequest(this.props.match.params.id)
      .then(() => this.setState({loaded: true}))
  }

  select = target => {
    this.setState({
      selected: target.id ? target.id : target,
    })
  }

  submit = () => {
    const selected = this.state.selected
    if (!selected) return

    if (/^[0-9a-fA-F]{24}$/.test(selected)) {
      return this.props.updateMeet(selected, {status: 'progress'})
        .then(() => {
          this.props.history.push(`/requests/${this.props.request.id}`)
        })
    }

    const reason = suspendReason[selected]
    return this.props.updateRequest(this.props.request.id, {status: 'suspend', suspendReason: reason.text, showReason: reason.show})
      .then(() => {
        this.props.history.push(`/requests/${this.props.request.id}`)
      })
  }

  render() {
    const { loaded, selected } = this.state
    const { request, meets, width, handleSubmit, submitting, theme } = this.props
    const { common, grey } = theme.palette

    if (!loaded) return <Loading />
    if (!request || !meets) return null
    if (request.status !== 'open') this.props.history.replace(`/requests/${request.id}`)

    const meetsToHire = meets.filter(m => m.status !== 'exclude' && !['inReview', 'tbd', 'decline'].includes(m.proResponseStatus))

    const styles = {
      root: {
        background: common.white,
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      columnHeader: {
        display: 'flex',
        alignItems: 'center',
        background: common.white,
        height: 57,
        padding: width === 'xs' ? 10 : 20,
        borderBottom: `1px solid ${grey[300]}`,
      },
      main: {
        width: '90%',
        maxWidth: 800,
        padding: '20px 0',
        margin: '0 auto',
      },
      form: {
        border: `1px solid ${grey[300]}`,
        borderRadius: 5,
      },
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.columnHeader}>
            <div style={{flex: 1}}>
              <Button style={{minWidth: 40}} onClick={() => this.props.history.push('/requests')}>
                <NavigationChevronLeft />
              </Button>
            </div>
            <span>依頼を編集</span>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <Helmet>
          <title>依頼を編集</title>
        </Helmet>
        <div style={styles.main}>
          <h3 style={{margin: '20px 0'}}>
            <p><Link to={`/requests/${request.id}`}>{request.service.name}の依頼</Link>について</p>
            <p>SMOOOSYで{request.service.providerName}を雇いましたか？</p>
          </h3>
          <form onSubmit={handleSubmit(this.submit)}>
            <div style={styles.form}>
              {meetsToHire.length > 0 &&
                <div style={{borderBottom: `1px solid ${grey[300]}`}}>
                  <div style={{fontWeight: 'bold', margin: 20}}>雇いました</div>
                  <RadioGroup name='request' value={selected} style={{margin: 20}}>
                    {meetsToHire.filter(m => m.status !== 'exclude').map(m =>
                      <FormControlLabel
                        key={m.id}
                        value={m.id}
                        control={<Radio color='primary' onClick={() => this.select(m)} />}
                        label={
                          <span style={{display: 'flex', alignItems: 'center'}}>
                            <UserAvatar component='span' user={m.pro} />
                            <span style={{marginLeft: 20}}>{m.profile.name}様</span>
                          </span>
                        }
                      />
                    )}
                  </RadioGroup>
                </div>
              }
              <div style={{fontWeight: 'bold', margin: 20}}>雇いませんでした</div>
              <RadioGroup name='request' style={{margin: 20}} value={selected}>
                {Object.keys(suspendReason).map(r =>
                  <FormControlLabel
                    key={r}
                    value={r}
                    control={<Radio color='primary' onClick={() => this.select(r)} />}
                    label={suspendReason[r].text}
                  />
                )}
              </RadioGroup>
            </div>
            <div style={{marginTop: 20, display: 'flex'}}>
              <Button
                variant='contained'
                type='submit'
                disabled={!selected}
                color='primary'
              >
                {submitting ?
                  <CircularProgress size={20} color='secondary' />
                : selected && !/^[0-9a-fA-F]{24}$/.test(selected) ?
                  '依頼をキャンセルする'
                :
                  '更新する'
                }
              </Button>
              <Button
                variant='contained'
                style={{marginLeft: 20}}
                onClick={() => this.props.history.push(`/requests/${request.id}`)}
              >
                まだ検討中です
              </Button>
            </div>
            {selected && !/^[0-9a-fA-F]{24}$/.test(selected) &&
              <div style={{margin: '10px 0'}}>※ 依頼をキャンセルすると応募したプロと連絡がとれなくなります</div>
            }
          </form>
        </div>
      </AutohideHeaderContainer>
    )
  }
}
