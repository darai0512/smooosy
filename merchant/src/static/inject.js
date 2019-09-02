let fixed = false
document.addEventListener('mouseover', (e) => {
  if (fixed) return

  const mode = parent.smooosyInjectMode
  // 一度綺麗にする
  const list = document.querySelectorAll('.smooosy-hover')
  for (let dom of list) {
    document.body.removeChild(dom)
  }

  // 繰り返し
  if (parent.smooosyInjectForeach) {
    let outside = true
    const doms = document.querySelectorAll(parent.smooosyInjectForeach)
    for (let dom of doms) {
      addDummy(dom, 'smooosy-hover smooosy-foreach')
      if (dom.contains(e.target)) outside = false
    }
    if (outside) return
  }

  // hoverの要素
  let className = 'smooosy-hover'
  if (mode) className += ' smooosy-hover-green'
  addDummy(e.target, className)

  // hoverと同階層の要素
  let selector = getSelector(e.target)
  const doms = document.querySelectorAll(selector)
  for (let dom of doms) {
    if (e.target === dom) continue
    let className = 'smooosy-hover'
    if (mode !== 'foreach') className += ' smooosy-hover-dashed'
    addDummy(dom, className)
  }

  // 親に通知
  selector = getSelector(e.target, mode !== 'foreach', parent.smooosyInjectForeach)
  const link = e.target.getAttribute('href')
  parent.hoverDOM({selector, link, count: doms.length, html: e.target.outerHTML})

  function addDummy(el, className) {
    const r = el.getBoundingClientRect()
    const style = 'left:'+r.left+'px;top:'+(r.top+window.scrollY)+'px;width:'+r.width+'px;height:'+r.height+'px;'
    const highlight = document.createElement('div')
    highlight.setAttribute('class', className)
    highlight.setAttribute('style', style)
    document.body.appendChild(highlight)
  }
})

document.addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  const mode = parent.smooosyInjectMode
  if (fixed) {
    fixed = false
    return
  }
  if (!mode) {
    document.querySelector('.smooosy-hover').classList.add('smooosy-fix')
    fixed = true
    return
  }
  const selector = getSelector(e.target || e.srcElement, mode !== 'foreach', parent.smooosyInjectForeach)
  const link = mode === 'click' ? e.target.getAttribute('href') : null
  parent.clickDOM({selector, link})
  return false
})

function getSelector(el, exact, parent) {
  if (!(el instanceof Element)) return ''

  let names = []
  while (el.nodeType === Node.ELEMENT_NODE) {
    const tag = el.nodeName.toLowerCase()
    if (el.id) {
      // idはページ内で一意となるためこれ以上の検索は不要
      names.unshift(tag + '#' + el.id)
      break
    }

    let className = ''
    if (el.className) {
      // 数字を含まず一番長いclassを選ぶ
      const classes = el.className.split(/\s+/).filter(s => s)
        .sort((a, b) => /\d/.test(a) || a.length < b.length ? 1 : -1)
      if (classes.length) className = '.' + classes[0]
    }

    // 同じ階層に同名要素が複数ある場合は識別のためインデックスを付与する
    // 複数要素の先頭(index = 1)の場合は省略可能
    const index = getSiblingElemetsIndex(el, tag)
    let nth = ''
    if (exact && 1 < index) nth = ':nth-of-type(' + index + ')'

    names.unshift(tag + className + nth)
    el = el.parentNode
  }

  if (parent) {
    names = names.slice(parent.split('>').length)
  }
  return names.join('>')
}

function getSiblingElemetsIndex(el, name) {
  let index = 1, sib = el
  while ((sib = sib.previousElementSibling)) {
    if (sib.nodeName.toLowerCase() === name) ++index
  }
  return index
}
