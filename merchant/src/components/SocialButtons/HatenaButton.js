import React from 'react'
import { withStyles } from '@material-ui/core/styles'

@withStyles({
  button: {
    border: 'none',
  },
})
export default class HatenaButton extends React.Component {
  static defaultProps = {
    size: 'small',
  }

  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
    }
  }

  componentDidMount() {
    if (this.props.isAMP && this.state.loaded) return

    if (typeof window.Hatena === 'undefined') {
      const button = this.ref
      const script = document.createElement('script')
      script.src = 'https://b.st-hatena.com/js/bookmark_button.js'
      script.async = true
      button.parentNode.appendChild(script)
    }
    this.setState({loaded: true})
  }

  render() {
    const { isAMP, size, classes } = this.props

    if (isAMP) return null

    const height = {
      large: 28,
      small: 20,
    }[size] || 20

    return (
      <a
        ref={e => this.ref = e}
        href='http://b.hatena.ne.jp/entry/'
        className='hatena-bookmark-button'
        data-hatena-bookmark-layout='basic-label'
        data-hatena-bookmark-lang='ja'
        data-hatena-bookmark-width={100}
        data-hatena-bookmark-height={height}
        title='このエントリーをはてなブックマークに追加'
      >
        <img
          src='https://b.st-hatena.com/images/entry-button/button-only@2x.png'
          alt='このエントリーをはてなブックマークに追加'
          width={20}
          height={20}
          className={classes.button}
        />
      </a>
    )
  }
}
