import React from 'react'

const INTERVAL = 50

export default class FallingAnimation extends React.Component {
  static defaultProps = {
    images: [/* { url: IMAGE_URL, num: 100, [size: 48] } */],
    maxResolution: 100000,
    windy: false,
    style: {},
  }

  componentDidMount() {
    if (!this.canvas) return

    this.items = []
    this.props.images.forEach((e, i) => {
      const image = new Image()
      image.src = e.url
      image.dataset.index = i
      image.addEventListener('load', this.handleLoad)
    })

    this.pixelRatio = 1
    this.handleResize()
    window.addEventListener('resize', this.handleResize)

    this.wx = 0
    this.wy = 0
    this.props.windy && document.addEventListener('mousemove', this.handleMouseMove)

    this.before = Date.now()
    this.renderFrame()
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rid)
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('mousemove', this.handleMouseMove)
  }

  handleLoad = (event) => {
    if (!this.canvas) return

    const image = event.currentTarget
    const data = this.props.images[image.dataset.index]

    const num = Math.round(data.num * this.canvas.width / 800)

    for (let i = 0; i < num; i++) {
      this.items.push({
        image,
        size: data.size || image.naturalWidth,
        x: Math.random() * this.canvas.width,
        y: (Math.random() - 1) * this.canvas.height,
        r: Math.random() * Math.PI * 2.0,
        s: Math.random() * Math.PI * 2.0,
        vx: Math.random() * 8.0 - 4.0,
        vy: Math.random() * 3.0 + 0.3,
        vr: Math.random() * 0.1 - 0.05,
        vs: Math.random() * 0.1 - 0.05,
        zoom: Math.random() * 0.8 + 0.2,
      })
    }
    this.items = this.items.sort((a, b) => a.zoom - b.zoom)
  }

  handleResize = () => {
    const width = this.canvas.offsetWidth
    const height = this.canvas.offsetHeight
    const resolution = width * height
    const { maxResolution } = this.props
    if (resolution > maxResolution) {
      this.pixelRatio = Math.sqrt(maxResolution / resolution)
      this.canvas.width = Math.floor(width * this.pixelRatio)
      this.canvas.height = Math.floor(height * this.pixelRatio)
    } else {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  handleMouseMove = (event) => {
    this.wx = 2.0 * (0.5 - event.clientX / innerWidth)
    this.wy = 1.0 * (1.0 - event.clientY / innerHeight)
  }

  renderFrame = () => {
    this.rid = requestAnimationFrame(this.renderFrame)

    // 描写を減らす
    const now = Date.now()
    const diff = now - this.before
    if (diff < INTERVAL) return
    this.before = now - (diff % INTERVAL)

    const context = this.canvas.getContext('2d')
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const size = item.size * item.zoom * this.pixelRatio

      context.setTransform(Math.cos(item.r), Math.sin(item.r), -Math.sin(item.r), Math.cos(item.r), item.x, item.y)
      context.scale(Math.sin(item.s), Math.cos(item.s))
      context.globalAlpha = Math.max(0, 1 - (item.y + size) / this.canvas.height)
      context.drawImage(item.image, 0, 0, item.image.naturalWidth, item.image.naturalHeight, - size / 2, - size / 2, size, size)

      item.x += (item.vx + this.wx) * item.zoom * this.pixelRatio
      item.y += (item.vy + this.wy) * item.zoom * this.pixelRatio
      item.r = (item.r + item.vr) % (Math.PI * 2)
      item.s = (item.s + item.vs) % (Math.PI * 2)

      if (item.y > this.canvas.height + size) {
        item.y = -size
        item.x = Math.random() * this.canvas.width
      } else if (item.x > this.canvas.width + size) {
        item.x = -size
      } else if (item.x < -size) {
        item.x = this.canvas.width + size
      }
    }
  }

  render() {
    return <canvas ref={e => this.canvas = e} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...this.props.style }} />
  }
}
