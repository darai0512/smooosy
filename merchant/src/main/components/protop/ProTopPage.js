import React from 'react'
import { Helmet } from 'react-helmet'
import qs from 'qs'
import withWidth from '@material-ui/core/withWidth'
import { withApiClient } from 'contexts/apiClient'
import { Introduction, IntroductionMobile } from 'components/protop/Introduction'
import Issue from 'components/protop/Issue'
import Appeal from 'components/protop/Appeal'

import Price from 'components/protop/Price'
import Question from 'components/protop/Question'
import Footer from 'components/Footer'

@withApiClient
@withWidth()
export default class ProTopPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      open: false,
      errorTop: null,
      errorSticky: null,
    }
  }

  search = (query) => {
    return this.props.apiClient
      .get('/api/search/services', { params: { query } })
      .then(res => res.data.data)
  }

  setLocation = (e) => {
    const location = e.target.value.trim()
    this.setState({location})
  }

  selectService = (service) => {
    this.setState({service})
  }

  onSuggest = (suggest, reverse) => {
    if (suggest.length) {
      this.setState({service: reverse ? suggest[suggest.length - 1] : suggest[0]})
    }
  }

  onClick = (errorTarget) => {
    const {service, location} = this.state
    if (!service) {
      const error = {}
      error[errorTarget] = 'サービスを選択してください'
      return this.setState(error)
    }
    const query = qs.stringify({selected: [service._id], initialLoc: location})
    this.props.history.push(`/signup-pro?${query}`)
  }

  showMask = () => {
    this.setState({showMask: true})
  }

  hideMask = () => {
    this.setState({showMask: false})
  }

  showSearchForm = () => {
    this.setState({open: true})
  }

  closeSearchForm = () => {
    this.setState({open: false})
  }

  onSelect = (selected) => {
    const {location} = this.state
    let query = qs.parse(this.props.location.search, {ignoreQueryPrefix: true})
    selected = selected.map(s => s.id)
    query = qs.stringify({...Object.assign(query, {selected}), initialLoc: location})
    this.props.history.push(`/signup-pro?${query}`)
  }

  render() {
    const { width } = this.props
    const { showMask, open, errorTop, errorSticky } = this.state

    return (
      <div style={{overflowX: 'hidden'}}>
        <Helmet>
          <title>事業者として登録する</title>
          <meta name='description' content='SMOOOSYに事業者登録しましょう。' />
          <meta name='keywords' content='SMOOOSY,事業者登録' />
        </Helmet>
        {width === 'xs' ?
          <IntroductionMobile search={this.search} onSelect={this.selectService} onSuggest={this.onSuggest} onClick={() => this.onClick('errorTop')} setLocation={this.setLocation} error={errorTop} /> :
          <Introduction search={this.search} onSelect={this.selectService} onSuggest={this.onSuggest} onClick={() => this.onClick('errorTop')} setLocation={this.setLocation} error={errorTop} />}
        <Issue />
        <Appeal />
        <Price />
        <Question />
        <Footer />
      </div>
    )
  }
}

