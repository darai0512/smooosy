import React from 'react'

export default class CoverImages extends React.Component {
  static defaultProps = {
    firstImage: null,
    services: [],
    alpha: false,
  }

  nextSlide() {
    setTimeout(() => {
      this.slider && this.slider.slickNext()
      this.nextSlide()
    }, 10000)
  }

  componentDidMount() {
    this.nextSlide()
  }

  render() {
    const { style, height, firstImage, alpha, children, paddingTop } = this.props
    const styles = {
      root: {
        ...style,
      },
      hero: {
        position: 'relative',
        width: '100%',
        height,
      },
      cover: {
        position: 'absolute',
        width: '100%',
        height: '100%',
      },
      mask: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        paddingTop: paddingTop ? 40 : 0,
        background: alpha === false ? 'transparent' : `rgba(0, 0, 0, ${alpha})`,
      },
      coverImage: {
        width: '100%',
        height,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      },
    }

    return (
      <div style={styles.root}>
        <div style={styles.hero}>
          <div style={styles.cover}>
            {firstImage && <div style={{...styles.coverImage, backgroundImage: `url(${firstImage})`}} />}
          </div>
          <div style={styles.mask}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}


