import React from 'react'
import Slider from 'react-slick'

export default class PagerPapers extends React.PureComponent {

  static defaultProps = {
    sliderStyle: '.slick-dots{bottom: -30px;} .slick-dots li button:before{font-size: 13px;}',
  }

  sliderSetting = {
    arrows: false,
    dots: true,
    infinite: false,
    variableWidth: true,
    centerMode: true,
    focusOnSelect: true,
    initialSlide: 0,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerPadding: 0,
  }

  rootRef = null

  state = {
    isChanging: false,
    sliderIndex: 0,
  }

  constructor(props) {
    super(props)
    if (props.sliderSetting) this.sliderSetting = props.sliderSetting
    this.sliderSetting.beforeChange = this.onSliderBeforeChange
    this.sliderSetting.afterChange = this.onSliderAfterChange
  }

  componentDidMount() {
    // see:
    // - https://github.com/akiran/react-slick/issues/1240
    // - https://github.com/akiran/react-slick/pull/1556
    if (this.rootRef && 'ontouchstart' in this.rootRef && 'ontouchmove' in this.rootRef) {
      this.rootRef.addEventListener('touchstart', this.touchStart)
      this.rootRef.addEventListener('touchmove', this.preventTouch, {passive: false})
    }
  }

  componentWillUnmount() {
    if (this.rootRef && 'ontouchstart' in this.rootRef && 'ontouchmove' in this.rootRef) {
      this.rootRef.removeEventListener('touchstart', this.touchStart)
      this.rootRef.removeEventListener('touchmove', this.preventTouch, {passive: false})
    }
  }

  touchStart(e) {
    this.firstClientX = e.touches[0].clientX
    this.firstClientY = e.touches[0].clientY
  }

  preventTouch(e) {
    if (!e.cancelable || !e.touches || e.touches.length === 0) {
      return
    }

    const threshold = 5
    this.clientX = e.touches[0].clientX - this.firstClientX
    this.clientY = e.touches[0].clientY - this.firstClientY

    // Vertical scrolling does not work when you start swiping horizontally.
    if (Math.abs(this.clientX) > threshold || Math.abs(this.clientX) > Math.abs(this.clientY)) {
      e.preventDefault()
      e.returnValue = false
      return false
    }
  }

  onSliderBeforeChange = () => {
    this.setState({
      isChanging: true,
    })
  }

  onSliderAfterChange = (index)  => {
    this.setState({
      isChanging: false,
      sliderIndex: index,
    })
  }

  render() {
    const { items, className, sliderStyle, Component, ...custom } = this.props
    const { isChanging, sliderIndex } = this.state

    return (
      <div ref={e => this.rootRef = e} >
        <style>{sliderStyle}</style>
        <Slider className={className} {...this.sliderSetting}>
          {items.map((item, i) => <Component key={i} item={item} onClick={() => !isChanging && sliderIndex === i && item.url && window.open(item.url, '_blank')} {...custom} />)}
        </Slider>
      </div>
    )
  }
}