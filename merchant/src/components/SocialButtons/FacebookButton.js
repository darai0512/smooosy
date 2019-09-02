import React from 'react'

export default class FacebookButton extends React.Component {
  static defaultProps = {
    url: window.location.href,
    layout: 'button_count', // standard, box_count, button_count, button
    action: 'like', // like or recommend
    size: 'small', // small or large
    showFaces: false,
    share: true, // append share button
  }

  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
    }
  }

  componentDidMount() {
    if (this.state.loaded) return

    if (typeof window.FB === 'undefined') {
      const button = this.ref
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/ja_JP/sdk.js#xfbml=1&version=v2.11&appId=1871580089750644'
      script.async = true
      script.id = 'facebook-jssdk'
      button.parentNode.appendChild(script)
    } else {
      window.FB.XFBML.parse()
    }

    this.setState({loaded: true})
  }

  render() {
    const { isAMP } = this.props
    return (
      <div>
        {isAMP ?
          <amp-social-share type='facebook'
            data-param-app_id='1871580089750644'
            data-param-href={this.props.url} />
          :
          <div
            className='fb-like'
            ref={e => this.ref = e}
            data-href={this.props.url}
            data-layout={this.props.layout}
            data-action={this.props.action}
            data-size={this.props.size}
            data-show-faces={this.props.showFaces}
            data-share={this.props.share}
          />
        }
      </div>
    )
  }
}
