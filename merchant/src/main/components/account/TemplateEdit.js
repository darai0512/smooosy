import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { load, update } from 'modules/profile'
import { Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import withWidth from '@material-ui/core/withWidth'

import AutohideHeaderContainer from 'components/AutohideHeaderContainer'
import TemplateForm from 'components/TemplateForm'

@withWidth()
@connect(
  state => ({
    profile: state.profile.profile,
  }),
  { load, update }
)
@withTheme
export default class TemplateEdit extends React.Component {
  componentDidMount() {
    this.props.load(this.props.match.params.id)
  }

  submitProfile = (values) => {
    if (values.priceType === 'needMoreInfo') values.price = 0

    const { profile } = this.props
    const { index } = this.props.match.params
    const templates = [...profile.templates]
    if (templates[index]) {
      templates[index] = values
    } else {
      templates.push(values)
    }
    return this.props.update(profile.id, {templates})
      .then(() => this.props.history.push(`/account/templates/${profile.id}`))
  }

  render() {
    const { profile, width, theme } = this.props
    const { index } = this.props.match.params
    const { common, grey } = theme.palette

    if (!profile) return null

    const styles = {
      root: {
        height: '100%',
        background: grey[100],
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: 50,
        padding: width === 'xs' ? '0 10px' : '0 20px',
        background: common.white,
        borderBottom: `1px solid ${grey[300]}`,
      },
    }

    if (!profile) return null

    const template = profile.templates[index] || {
      title: '',
      price: 0,
      priceType: 'fixed',
      chat: '{{name}}様こんにちは！',
    }

    return (
      <AutohideHeaderContainer
        style={styles.root}
        header={
          <div style={styles.header}>
            <div style={{flex: 1}}>
              <Link to={`/account/templates/${profile.id}`}>
                <Button style={{minWidth: 40}} ><NavigationChevronLeft /></Button>
              </Link>
            </div>
            <div>返信定型文を編集</div>
            <div style={{flex: 1}} />
          </div>
        }
      >
        <TemplateForm onSubmit={this.submitProfile} initialValues={template} />
      </AutohideHeaderContainer>
    )
  }
}
