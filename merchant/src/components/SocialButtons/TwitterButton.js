import React from 'react'

export default class TwitterButton extends React.Component {
  static defaultProps = {
    url: window.location.href,
    hashtags: 'smooosy', // comma-separated, no '#'
    text: '',
    via: 'smooosy',
    size: '', // large or blank
  }

  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
    }
  }

  componentDidMount() {
    if (this.state.loaded) return

    if (typeof window.twttr === 'undefined') {
      const button = this.ref
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.id = 'twitter-wjs'
      button.parentNode.appendChild(script)
    } else {
      window.twttr.widgets.load()
    }

    this.setState({loaded: true})
  }

  render() {
    const { isAMP } = this.props
    return (
      <div>
      {
        isAMP ?
          <amp-social-share type='twitter'
            data-param-url={this.props.url}
            data-param-text={this.props.text} />
        :
        <a
          className='twitter-share-button'
          ref={e => this.ref = e}
          href='https://twitter.com/share'
          data-url={this.props.url}
          data-hashtags={this.props.hashtags}
          data-text={this.props.text}
          data-via={this.props.via}
          data-size={this.props.size}
        >
          Tweet
        </a>
      }

      </div>
    )
  }
}
