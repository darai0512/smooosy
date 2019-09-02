import React from 'react'
import { Helmet } from 'react-helmet'
import 'components/company/markdown.css'
import withWidth from '@material-ui/core/withWidth'
import client from 'axios'
import { wpOrigin } from '@smooosy/config'

@withWidth()
export default class TermsPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    client.get(`${wpOrigin}/wp-json/wp/v2/pages/14966`)
      .then(res => res.data)
      .then(post => this.setState({title: post.title.rendered, body: post.content.rendered}))
      .catch(() => this.props.history.push('/'))
  }

  render() {
    const { title, body } = this.state
    const { width } = this.props

    if (!title || !body) return null

    const styles = {
      root: {
        maxWidth: 960,
        padding: width === 'xs' ? 24 : 32,
        margin: '32px auto',
        background: '#fff',
        border: '2px solid #ddd',
      },
    }

    return (
      <div className='markdown' style={styles.root}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <div dangerouslySetInnerHTML={{__html: body}} />
        <h2>補遺 特定商取引法に基づく表記</h2>
        特定商取引法に基づく表記は<a href='/policies/law' target='_blank'>こちら</a>よりご確認ください。
      </div>
    )
  }
}
