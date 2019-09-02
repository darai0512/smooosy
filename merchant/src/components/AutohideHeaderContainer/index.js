import React from 'react'
import shallowequal from 'shallowequal'
import raf from 'raf'
import shouldUpdate from './shouldUpdate'

const noop = () => {}

export default class HeaderContainer extends React.Component {

  static defaultProps = {
    setRef: () => {},
    fixed: false,
    upTolerance: 5,
    downTolerance: 0,
    onPin: noop,
    onUnpin: noop,
    onUnfix: noop,
    wrapperStyle: {},
    pinStart: 0,
  }

  constructor(props) {
    super(props)
    // Class variables.
    this.currentScrollY = 0
    this.lastKnownScrollY = 0
    this.ticking = false
    this.state = {
      state: 'unfixed',
      translateY: 0,
    }
  }

  getDOM () {
    return this.container || document.body
  }

  componentDidMount () {
    this.setHeaderOffset()
    this.getDOM().addEventListener('scroll', this.handleScroll)
    ;['resize', 'pageshow', 'load'].forEach(event => {
      window.addEventListener(event, this.setHeaderOffset)
    })
  }

  shouldComponentUpdate (nextProps, nextState) {
    return (
      !shallowequal(this.props, nextProps) ||
      !shallowequal(this.state, nextState)
    )
  }

  componentDidUpdate (prevProps) {
    // If children have changed, remeasure height.
    if (prevProps.header !== this.props.header) {
      this.setHeaderOffset()
    }
  }

  componentWillUnmount () {
    this.getDOM().removeEventListener('scroll', this.handleScroll)
    ;['resize', 'pageshow', 'load'].forEach(event => {
      window.removeEventListener(event, this.setHeaderOffset)
    })
  }

  setHeaderOffset = () => {
    const pos = this.getDOM().getBoundingClientRect()
    const style = getComputedStyle(this.getDOM(), null)
    if (style.display === 'none') return
    this.setState({
      top: pos.top,
      left: pos.left,
      height: this.wrapper ? this.wrapper.offsetHeight : 0,
      width: this.wrapper ? this.wrapper.offsetWidth : 0,
    })
  }

  getScrollY = () => {
    if (this.getDOM().pageYOffset !== undefined) {
      return this.getDOM().pageYOffset
    } else if (this.getDOM().scrollTop !== undefined) {
      return this.getDOM().scrollTop
    }
    return (document.documentElement || document.body.parentNode || document.body).scrollTop

  }

  getViewportHeight = () => (
    window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight
  )

  getDocumentHeight = () => {
    const body = document.body
    const documentElement = document.documentElement

    return Math.max(
      body.scrollHeight, documentElement.scrollHeight,
      body.offsetHeight, documentElement.offsetHeight,
      body.clientHeight, documentElement.clientHeight
    )
  }

  getElementPhysicalHeight = elm => Math.max(
    elm.offsetHeight,
    elm.clientHeight
  )

  getElementHeight = elm => Math.max(
    elm.scrollHeight,
    elm.offsetHeight,
    elm.clientHeight,
  )

  getScrollerPosition = () => {
    const style = getComputedStyle(this.getDOM(), null)
    const pxToInt = (str) => {
      return parseInt(str, 10) || 0
    }

    return {
      top: this.state.top + pxToInt(style.borderTopWidth),
      left: this.state.left + pxToInt(style.borderLeftWidth),
      height: this.state.height - pxToInt(style.borderTopWidth) - pxToInt(style.borderBottomWidth),
      width: this.state.width - pxToInt(style.borderLeftWidth) - pxToInt(style.borderRightWidth),
    }
  }

  getScrollerPhysicalHeight = () => {
    const parent = this.getDOM()

    return (parent === window || parent === document.body)
      ? this.getViewportHeight()
      : this.getElementPhysicalHeight(parent)
  }

  getScrollerHeight = () => {
    const parent = this.getDOM()

    return (parent === window || parent === document.body)
      ? this.getDocumentHeight()
      : this.getElementHeight(parent)
  }

  isOutOfBound = (currentScrollY) => {
    const pastTop = currentScrollY < 0

    const scrollerPhysicalHeight = this.getScrollerPhysicalHeight()
    const scrollerHeight = this.getScrollerHeight()

    const pastBottom = currentScrollY + scrollerPhysicalHeight > scrollerHeight

    return pastTop || pastBottom
  }

  handleScroll = () => {
    if (!this.ticking) {
      this.ticking = true
      raf(this.update)
    }
  }

  unpin = () => {
    this.props.onUnpin()

    this.setState({
      translateY: '-100%',
      className: 'headroom headroom--unpinned',
    }, () => {
      setTimeout(() => {
        this.setState({ state: 'unpinned' })
      }, 0)
    })
  }

  pin = () => {
    this.props.onPin()

    this.setState({
      translateY: 0,
      className: 'headroom headroom--pinned',
      state: 'pinned',
    })
  }

  unfix = () => {
    this.props.onUnfix()

    this.setState({
      translateY: 0,
      className: 'headroom headroom--unfixed',
      state: 'unfixed',
    })
  }

  update = () => {
    this.currentScrollY = this.getScrollY()

    if (!this.isOutOfBound(this.currentScrollY)) {
      const { action } = shouldUpdate(
        this.lastKnownScrollY,
        this.currentScrollY,
        this.props,
        this.state
      )

      if (action === 'pin') {
        this.pin()
      } else if (action === 'unpin') {
        this.unpin()
      } else if (action === 'unfix') {
        this.unfix()
      }
    }

    this.lastKnownScrollY = this.currentScrollY
    this.ticking = false
  }

  render () {
    const { ...divProps } = this.props
    delete divProps.fixed
    delete divProps.onUnpin
    delete divProps.onPin
    delete divProps.onUnfix
    delete divProps.parent
    delete divProps.header
    delete divProps.children
    delete divProps.upTolerance
    delete divProps.downTolerance
    delete divProps.pinStart

    const { setRef, style, className: rootClassName, wrapperStyle, ...rest } = divProps

    let innerStyle = {
      position: 'relative',
      WebkitTransform: `translateY(${this.state.translateY})`,
      MsTransform: `translateY(${this.state.translateY})`,
      transform: `translateY(${this.state.translateY})`,
    }

    let className = this.state.className

    // Don't add css transitions until after we've done the initial
    // negative transform when transitioning from 'unfixed' to 'unpinned'.
    // If we don't do this, the header will flash into view temporarily
    // while it transitions from 0 — -100%.
    if (this.state.state !== 'unfixed') {
      const parentPos = this.getScrollerPosition()
      innerStyle = {
        ...innerStyle,
        ... parentPos,
        position: 'fixed',
        zIndex: 10,
        WebkitTransition: 'all .2s ease-in-out',
        MozTransition: 'all .2s ease-in-out',
        OTransition: 'all .2s ease-in-out',
        transition: 'all .2s ease-in-out',
      }
      className += ' headroom--scrolled'
    }

    const wrapperStyles = {
      ...wrapperStyle,
      height: this.state.height ? this.state.height : null,
    }

    return (
      <div ref={(e) => this.container = e && setRef(e)} style={style} className={rootClassName}>
        <div ref={(e) => this.wrapper = e} style={wrapperStyles} className='headroom-wrapper'>
          <div {...rest} style={innerStyle} className={className}>
            {this.props.header}
          </div>
        </div>
        {this.props.children}
      </div>
    )
  }
}
