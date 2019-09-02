const imageSizes = {
  c80: '&w=80&h=80',
  c160: '&w=160&h=160',
  c320: '&w=320&h=320',
  r320: '&w=320&h=320&t=r',
  c640: '&w=640&h=640',
  service: '&w=240&h=240&t=r',
  cover: '&w=640&h=640&t=r',
  proIntroduction: '&w=320&h=240',
  full: '&w=1280&h=1280&t=r',
  ogp: '&w=1200&h=630&t=r',
  column: (n, ratio) => {
    const size = Math.max(160, 80 * n)
    let w = size
    let h = size
    if (ratio === 'horizontal') {
      w = h * 3 / 2
    } else if (ratio === 'portrait') {
      h = w * 3 / 2
    }
    return `&w=${w}&h=${h}`
  },
}

export default imageSizes
