import React from 'react'
import ReactGA from 'react-ga'
import qs from 'qs'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import moment from 'moment'

import { withApiClient } from 'contexts/apiClient'
import { sendLog } from 'modules/auth'
import { load as loadService } from 'modules/service'
import { create as createRequest } from 'modules/request'
import QueryCardSelect from 'components/cards/QueryCardSelect'
import QueryCardHello from 'components/cards/QueryCardHello'
import QueryCardThanks from 'components/cards/QueryCardThanks'
import QueryCardCommon from 'components/cards/QueryCardCommon'
import QueryCardCalendar from 'components/cards/QueryCardCalendar'
import QueryCardLocation from 'components/cards/QueryCardLocation'
import QueryCardTextarea from 'components/cards/QueryCardTextarea'
import QueryCardEmail from 'components/cards/QueryCardEmail'
import QueryCardImage from 'components/cards/QueryCardImage'
import QueryCardNumber from 'components/cards/QueryCardNumber'
import QueryCardPrice from 'components/cards/QueryCardPrice'
import QueryExit from 'components/cards/QueryExit'
import uuidv4 from 'uuid/v4'
import { zenhan } from 'lib/string'
import storage from 'lib/storage'
import { FlowTypes, BQEventTypes } from '@smooosy/config'

@withApiClient
@withRouter
@connect(
  state => ({
    authFailed: state.auth.failed,
    user: state.auth.user,
    request: state.request.request,
  }),
  { loadService, createRequest, sendLog }
)
export default class QueryCard extends React.Component {
  constructor(props) {
    super(props)
    const { service, flowType, similarServices } = props

    const isMatchMore = flowType === FlowTypes.PPC
    this.logType = {
      open: isMatchMore ? BQEventTypes.web.MATCHMORE_DIALOG_OPEN : BQEventTypes.web.DIALOG_OPEN,
      dialog: isMatchMore ? BQEventTypes.web.MATCHMORE_DIALOG : BQEventTypes.web.DIALOG,
      exit: isMatchMore ? BQEventTypes.web.MATCHMORE_DIALOG_EXIT : BQEventTypes.web.DIALOG_EXIT,
    }

    this.state = {
      service,
      similarServices,
      dialogInfo: {
        ...props.dialogInfo,
        idx: 0,
      },
      queries: [
        {type: 'hello'},
      ],
      startTime: null,
      count: null,
      invalids: {},
      confirm: false,
      uuid: uuidv4(),
      checkedList: {},
      answeredSteps: {},
      // hide FindingPro if customer comes from InstantResults
      shouldShowFindingPro: flowType !== FlowTypes.PPC,
    }
  }

  // 質問回答完了までの時間計測開始
  timerStart = () => {
    this.setState({startTime: moment()})
  }

  // 質問回答完了までの時間計測終了
  timerStop = () => {
    const end = moment()
    return end.diff(this.state.startTime, 'seconds')
  }

  getQueryIds = (queries) => {
    return queries.map(q => ['hello', 'thanks', 'phone', 'email'].includes(q.type) ? q.type : q.id)
  }

  componentDidMount() {
    const { service, similarServices, initialZip } = this.props

    // LINEログインからの復帰
    const savedData = storage.get('request')
    if (savedData) {
      this.setState({
        queries: savedData.queries,
        dialogInfo: savedData.dialogInfo,
        profile: savedData.profile,
        startTime: savedData.startTime,
        uuid: savedData.uuid,
        // Don't show the finding pro card if user has saved state because
        // they have already seen it.
        shouldShowFindingPro: false,
      })
      this.props.history.stack = savedData.stack
      storage.save('request', undefined)
      return
    }


    const queryString = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})

    ReactGA.modalview(`/new-request/start/${service.key}`)
    this.props.sendLog(this.logType.open, {
      service_id: service.id,
      source: queryString.source,
      pos: queryString.pos,
      zip: initialZip,
    })
    window.hj && window.hj('trigger', this.logType.open)
    this.timerStart()

    if (!similarServices.length) this.initial()
  }

  selectService = (key) => {
    this.props.loadService(key).then(({serviceMapWithQueries}) => {
      const service = serviceMapWithQueries[key]
      if (service.matchMoreEnabled) {
        return this.props.history.push(`/instant-results?serviceId=${service.id}&zip=${this.props.initialZip || ''}`)
      }
      this.setState({service, similarServices: [], serviceSelected: true})
      this.initial()
    })
  }

  unselectService = () => {
    const { service } = this.props
    const similarServices = service.similarServices
    this.setState({service, similarServices})
  }

  initial = () => {
    const { specialSent, flowType } = this.props
    const { service, uuid } = this.state

    const queries = [ ...service.queries ]

    queries.unshift({type: 'hello'})
    if (this.props.authFailed || this.props.user.needSocialRename) {
      queries.push({type: 'email'})
    }

    queries.push({type: 'thanks'})

    if (specialSent) {
      this.setState({loading: true})
      this.props.apiClient.get(`/api/profiles/${specialSent}`)
        .then(res => res.data)
        .then(profile => {
          if (profile.services.filter(s => s.id === service.id).length === 0) profile = null
          this.setState({profile})
        }).finally(() => {
          this.setState({loading: false})
        })
    } else {
      this.setState({profile: null})
    }

    this.setState({queries})

    this.props.sendLog(this.logType.dialog, {
      action_type: 'open',
      id: uuid,
      service_id: service.id,
      index: 0,
      prev_id: null,
      next_id: 'hello',
      queries: this.getQueryIds(queries),
    })

    if (!this.props.initialZip) return
    if (flowType === FlowTypes.PPC) {
      return this.setState({count: 0})
    }
    // fetch near pro count if normal flow with initialZip
    const query = {
      zip: this.props.initialZip,
      service: service.id,
    }
    this.props.apiClient.get(`/api/profiles/near?${qs.stringify(query)}`)
      .then(res => res.data)
      .then(({count}) => this.setState({count}))
      .catch(() => this.setState({count: 0}))
  }

  componentWillUnmount() {
    const query = this.state.queries[this.state.dialogInfo.idx]
    const type = query.type
    if (type !== 'thanks' && this.props.service) {
      const key = `/new-request/exit/${this.props.service.key}/${type}`
      ReactGA.modalview(query.id ? `${key}/${query.id}` : key)
    }
  }

  handlePhone = (e, phone) => {
    const { dialogInfo } = this.state
    dialogInfo.phone = zenhan(phone)
    this.setState({dialogInfo})
  }

  submitRequest = () => {
    const { history: { stack }, flowType } = this.props
    const { service, profile, queries, dialogInfo } = this.state
    const firstLocationAnswer = Object.values(dialogInfo).find(i => i.location)
    const { loc, address, prefecture, city } = firstLocationAnswer ? firstLocationAnswer.location : {}
    const { phone } = dialogInfo
    let limitDate
    let canWorkRemotely = false
    const reqBody = {
      service: service.id,
      description: queries.filter(q => dialogInfo[q.id] && dialogInfo[q.id].isAnswered).map(q => {
        return {
          query: q.id,
          type: q.type,
          subType: q.subType,
          label: q.summary,
          usedForPro: q.usedForPro,
          answers: dialogInfo[q.id].map(answer => {
            if (q.type === 'calendar') {
              // 最初のanswer.dateをlimitDateに代入する
              if (!limitDate && answer.date) limitDate = answer.date
            } else if (answer.noteText) {
              answer.text = answer.text + `：${answer.noteText}`
            }

            if (answer.checked && answer.canWorkRemotely) {
              canWorkRemotely = true
            }

            answer.option = answer.id

            delete answer._id
            return answer
          }),
        }
      }),
      referrer: document ? document.referrer : null,
      stack,
      flowType,
    }

    reqBody.canWorkRemotely = canWorkRemotely

    if (limitDate) reqBody.limitDate = limitDate

    if (profile && (profile._id || profile.id)) {
      const profileId = profile._id || profile.id
      if (profileId) {
        reqBody.specialSent = [profileId]
      }
    }

    if (loc) {
      reqBody.loc = loc
      reqBody.address = address
      reqBody.prefecture = prefecture
      reqBody.city = city
    }
    reqBody.phone = phone

    reqBody.time = this.timerStop()

    return this.gaRequestStub()
      .then((gaParams) => {
        reqBody.gaParams = gaParams
        return this.props.createRequest(reqBody)
      })
      .then(() => {
        const { postRequestCreate, request } = this.props
        postRequestCreate && postRequestCreate(request)
      })
  }

  gaRequestStub = () => {
    return new Promise((resolve) => {
      if (!window.ga) return resolve(null)

      // https://github.com/react-ga/react-ga/blob/ba7945950ee2c0a98766835b6971e0066df6330e/src/core.js#L28
      const trackers = window.ga.getAll()
      if (!trackers || trackers.length === 0) return resolve(null)

      const tracker = trackers[0]
      const originalSendHitTask = tracker.get('sendHitTask')
      if (!originalSendHitTask || typeof originalSendHitTask !== 'function') return resolve(null)

      // stubに差し替える
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/tasks
      tracker.set('sendHitTask', (model) => {

        // GAパラメータ
        // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference?hl=ja
        let gaParams = null
        try {
          gaParams = qs.parse(model.get('hitPayload'))

          // undocumentedな謎パラメータ
          // jid
          // gjid
          // cd1
          // cd2
          // a
          // z
          // _v
          // _s
          // _gid
          // _u

        } finally {
          // 元に戻す
          tracker.set('sendHitTask', originalSendHitTask)
          resolve(gaParams)
        }
      })

      // 送信
      ReactGA.modalview(`/new-request/created/${this.props.service.key}`)
    })
  }

  next = ({event, queryId, answers, signup, skipQueryIds} = {}) => {
    event && event.preventDefault && event.preventDefault()
    const { service, dialogInfo, invalids, checkedList, queries, uuid, answeredSteps } = this.state

    if (queryId) {
      dialogInfo[queryId] = answers
      dialogInfo[queryId].skipQueryIds = skipQueryIds || []
      dialogInfo[queryId].isAnswered = true
    }

    let skips = []
    for (let queryId in dialogInfo) {
      if (!dialogInfo[queryId].skipQueryIds) continue
      skips = [...skips, ...dialogInfo[queryId].skipQueryIds]
    }

    const queryIds = this.getQueryIds(queries)
    let step = 0
    do {
      step++
    } while (skips.includes(queryIds[dialogInfo.idx + step]))

    dialogInfo.idx = dialogInfo.idx + step
    answeredSteps[dialogInfo.idx] = step
    if (!checkedList[dialogInfo.idx]) {
      this.props.sendLog(this.logType.dialog, {
        action_type: 'next',
        id: uuid,
        service_id: service.id,
        index: dialogInfo.idx,
        prev_id: queryIds[dialogInfo.idx - step] || null,
        next_id: queryIds[dialogInfo.idx] || null,
        queries: queryIds,
      })
      checkedList[dialogInfo.idx] = true
    }
    this.setState({
      dialogInfo,
      invalids,
      signup: this.state.signup || signup,
      answeredSteps,
    })
  }

  saveToStorage = () => {
    const { history: { stack } } = this.props
    const { queries, dialogInfo, profile, startTime, uuid } = this.state
    // LINEログインのために依頼情報とstackをlocalStorageに保存
    storage.save('request', { queries, dialogInfo, profile, startTime, uuid, stack })
  }

  prev = ({event, queryId, answers} = {}) => {
    event && event.preventDefault && event.preventDefault()
    const { dialogInfo, answeredSteps } = this.state
    if (queryId) {
      dialogInfo[queryId] = answers
      delete dialogInfo[queryId].skipQueryIds
      dialogInfo[queryId].isAnswered = false
    }
    const step = answeredSteps[dialogInfo.idx] || 1
    delete answeredSteps[dialogInfo.idx]
    dialogInfo.idx = dialogInfo.idx - step
    this.setState({ dialogInfo })
  }

  close = () => {
    this.setState({confirm: true})
  }

  render() {
    const { onClose, initialZip, flowType, onEnd } = this.props
    const { service, similarServices, serviceSelected, profile, queries, dialogInfo, count, signup, shouldShowFindingPro, uuid } = this.state
    const phone = dialogInfo.phone
    const query = queries[dialogInfo.idx]
    query.answers = dialogInfo[query.id]
    const progress = Math.floor(dialogInfo.idx / (queries.length - 1) * 100)
    const isFirstQuery = dialogInfo.idx === 0
    const isLastQuery = dialogInfo.idx === queries.length - 2

    let addPrice = 0
    let formulaReplacement = {}
    if (query.type === 'price') {
      queries.filter(q => dialogInfo[q.id] && dialogInfo[q.id].isAnswered).forEach(q => {
        addPrice += dialogInfo[q.id].reduce((sum, a) => sum + (a && a.checked ? a.price || 0 : 0), 0)
        switch (q.type) {
          case 'singular':
            formulaReplacement[q.id] = dialogInfo[q.id].find(a => a.checked).price || 0
            break
          case 'multiple':
            dialogInfo[q.id].forEach(a => {
              if (a && a.checked) formulaReplacement[a.id] = a.price || 0
            })
            break
          case 'number':
            dialogInfo[q.id].forEach(a => {
              if (a && a.number) formulaReplacement[a.id] = a.number || 0
            })
            break
        }
      })
    }

    const loading = this.state.loading || !service || (initialZip && count === null)

    return [
      similarServices.length ?
      <QueryCardSelect key='select' service={service} similarServices={similarServices} onClose={this.close} selectService={this.selectService} /> :
      query.type === 'hello' ?
      <QueryCardHello key='hello' flowType={flowType} loading={loading} service={service} onClose={this.close} next={this.next} profile={profile} count={count} prev={serviceSelected ? this.unselectService : null} /> :
      query.type === 'thanks' ?
      <QueryCardThanks key='thanks' service={service} submitRequest={this.submitRequest} signup={signup} flowType={flowType} dialogInfo={dialogInfo} profile={profile} onClose={onClose} onEnd={onEnd} /> :
      query.type === 'location' ?
      <QueryCardLocation key='location' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} prev={this.prev} next={this.next} initial={initialZip} /> :
      query.type === 'email' ?
      <QueryCardEmail key='email' uuid={uuid} shouldShowFindingPro={shouldShowFindingPro} service={service} isLastQuery={isLastQuery} requirePhone={!!service.interview} handlePhone={this.handlePhone} phone={phone} progress={progress} onClose={this.close} prev={() => this.setState({shouldShowFindingPro: false}) || this.prev()} next={this.next} saveToStorage={this.saveToStorage} /> :
      query.type === 'textarea' ?
      <QueryCardTextarea key='textarea' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} prev={this.prev} next={this.next} /> :
      query.type === 'calendar' ?
      <QueryCardCalendar key='calendar' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} next={this.next} prev={this.prev} /> :
      query.type === 'image' ?
      <QueryCardImage key='image' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} next={this.next} prev={this.prev} /> :
      query.type === 'number' ?
      <QueryCardNumber key='number' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} next={this.next} prev={this.prev} /> :
      query.type === 'price' ?
      <QueryCardPrice key='price' query={query} addPrice={addPrice} formulaReplacement={formulaReplacement} isLastQuery={isLastQuery} progress={progress} onClose={this.close} next={this.next} prev={this.prev} /> :
      <QueryCardCommon key='common' query={query} isFirstQuery={isFirstQuery} isLastQuery={isLastQuery} progress={progress} onClose={this.close} next={this.next} prev={this.prev} />,
      <QueryExit
        key='exit'
        open={this.state.confirm}
        onClose={() => this.setState({confirm: false})}
        onExit={() => {
          this.setState({confirm: false})
          this.props.sendLog(this.logType.exit, { service_id: service.id })
          onClose()
        }}
        progress={progress}
      />,
    ]
  }
}
