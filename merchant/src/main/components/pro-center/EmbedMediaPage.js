import React from 'react'
import axios from 'axios'
import Loading from 'components/Loading'
import { wpOrigin } from '@smooosy/config'

export default class EmbedMediaPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.loadPost(this.props.path)
  }

  componentDidUpdate(prevProps) {
    if (this.props.path !== prevProps.path) {
      this.setState({body: null})
      this.loadPost(this.props.path)
    }
  }

  loadPost = (path) => {
    if (!path) {
      this.setState({body: '<h4 style="margin:50px; text-align:center;">作成中です</h4>'})
      return
    }
    axios.get(`${wpOrigin}/wp-json/wp/v2${path}`)
      .then(res => res.data)
      .then(post => this.setState({body: post.content.rendered}))
      .catch(() => this.setState({body:  '<h4 style="margin:50px; text-align:center;">見つかりません</h4>'}))
  }

  render() {
    const { body } = this.state

    if (!body) {
      return <Loading style={{minHeight: 400}} />
    }

    return (
      <div style={{paddingBottom: 20}}>
        <div className='entry-content' style={{minHeight: '70vh'}} dangerouslySetInnerHTML={{__html: body}} />
      </div>
    )
  }
}
