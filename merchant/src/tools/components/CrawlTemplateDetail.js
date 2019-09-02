import React from 'react'
import { connect } from 'react-redux'
import { Dialog, AppBar, Toolbar, Typography, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import { showCrawlTemplate, updateCrawlTemplate } from 'tools/modules/crawl'
import CrawlBuilder from 'tools/components/CrawlBuilder'

@connect(
  state => ({
    template: state.crawl.template,
  }),
  { showCrawlTemplate, updateCrawlTemplate }
)
export default class CrawlTemplateDetail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.showCrawlTemplate(this.props.match.params.id).then(() => {
      this.setState({loaded: true})
    })
  }

  closeDialog = () => {
    this.props.history.push('/crawls')
  }

  render() {
    const { template, updateCrawlTemplate } = this.props

    if (!template || !this.state.loaded) return null

    return (
      <Dialog fullScreen open>
        <AppBar style={{position: 'relative'}}>
          <Toolbar>
            <Typography variant='h6' color='inherit' style={{flex: 1}}>
              クロールの雛形の編集
            </Typography>
            <IconButton color='inherit' onClick={this.closeDialog}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <CrawlBuilder
          initialValues={template}
          update={updateCrawlTemplate}
          closeDialog={this.closeDialog}
        />
      </Dialog>
    )
  }
}
