import React from 'react'
import { Dialog, Avatar, CircularProgress } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles'
import NavigationChevronLeft from '@material-ui/icons/ChevronLeft'
import NavigationChevronRight from '@material-ui/icons/ChevronRight'
import ContentClear from '@material-ui/icons/Clear'
import withWidth from '@material-ui/core/withWidth'
import Slider from 'react-slick'
import { imageSizes } from '@smooosy/config'


@withWidth()
@withTheme
export default class MediaSlider extends React.PureComponent {
  static defaultProps = {
    media: [],
    slideNumber: null,
    onClose: () => {},
    willChange: () => {},
    content: null,
  }

  render() {
    const { media, slideNumber, willChange, content, theme } = this.props

    const { common } = theme.palette

    if (!media) return null

    const styles = {
      close: {
        position: 'absolute',
        color: common.white,
        width: 64,
        height: 64,
        padding: 8,
        top: 0,
        right: 0,
        cursor: 'pointer',
        zIndex: 1500,
      },
    }

    const sliderSetting = {
      dots: false,
      arrows: true,
      lazyLoad: true,
      initialSlide: slideNumber,
      prevArrow: <NextArrow icon={<NavigationChevronLeft />} align='left' />,
      nextArrow: <NextArrow icon={<NavigationChevronRight />} align='right' />,
      beforeChange: willChange,
    }

    return (
      <Dialog
        fullScreen
        open={slideNumber !== null}
        onClose={this.props.onClose}
      >
        <style>{`.slick-slider{background: ${common.black};}`}</style>
        <ContentClear style={styles.close} onClick={() => this.props.onClose()} />
        <Slider {...sliderSetting}>
          {
            media.map((media, i) => (
              <SlideContent key={i} content={content} media={media} i={i} />
            ))
          }
        </Slider>
      </Dialog>
    )
  }
}

@withTheme
class NextArrow extends React.PureComponent {
  render() {
    const { align, onClick, icon, theme } = this.props

    const { common } = theme.palette

    const styles = {
      wrap: {
        position: 'absolute',
        top: '30vh',
        bottom: '30vh',
        width: '20vw',
        left: align === 'left' ? 0 : 'initial',
        right: align === 'right' ? 0 : 'initial',
        cursor: 'pointer',
        zIndex: 10,
        ':hover': {}, // needed for trigger
      },
      arrow: {
        position: 'absolute',
        left: align === 'left' ? 10 : 'initial',
        right: align === 'right' ? 10 : 'initial',
        top: '50%',
        marginTop: -30,
        height: 60,
        minWidth: 60,
        color: common.white,
        background: 'rgba(0, 0, 0, .5)',
      },
    }

    return (
      <div key='wrap' style={styles.wrap} onClick={onClick}>
        <Avatar alt={align === 'left' ? '戻る' : '次へ'} style={styles.arrow}>{icon}</Avatar>
      </div>
    )
  }
}



const SlideContent = withWidth({withTheme: true})(({content, media, i, width, theme}) => {
  const { common } = theme.palette
  const styles = {
    wrap: {
      position: 'relative',
      width: '100vw',
      height: document.body.clientHeight,
    },
    media: {
      position: 'absolute',
      margin: 'auto',
      width: 'auto',
      height: 'auto',
      maxWidth: '100vw',
      maxHeight: document.body.clientHeight,
      background: common.black,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
    },
    video: {
      position: 'absolute',
      margin: 'auto',
      width: width === 'xs' ? 320 : 640,
      height: width === 'xs' ? 240 : 480,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
    },
    mediaText: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, .5)',
      color: common.white,
      textAlign: 'center',
      fontSize: 20,
      padding: 10,
      zIndex: 3,
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 60,
      height: 60,
      marginTop: -30,
      marginLeft: -30,
      zIndex: 1,
    },
  }

  return (
    <div style={styles.wrap}>
      <CircularProgress style={styles.loading} color='secondary' />
      {media.type === 'video' ?
        <iframe style={styles.video} src={`https://www.youtube.com/embed/${media.video.youtube}`} frameBorder={0} allowFullScreen />
      :
        <img alt={media.text} src={media.url + imageSizes.full} style={styles.media} onClick={e => e.stopPropagation()} />
      }
      {content ?
        <div style={styles.mediaText} onClick={e => e.stopPropagation()}>{content(media, i)}</div>
      : media.text ?
        <div style={styles.mediaText} onClick={e => e.stopPropagation()}>{media.text}</div>
      : null}
    </div>
  )
})
