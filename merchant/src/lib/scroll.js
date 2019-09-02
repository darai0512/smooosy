export function scrollToElement(element, adjustment) {
  if (!element) return
  if (element.offsetTop === undefined) return
  if (element.parentNode === undefined) return

  adjustment = typeof adjustment === 'number' ? adjustment : 0

  // walk into parent tree until scrollable
  let target = element
  while (target.scrollHeight === target.clientHeight) {
    target = target.parentNode
    if (target.tagName.toLowerCase() === 'body') break
  }

  const position = target.scrollTop
    + element.getBoundingClientRect().y - target.getBoundingClientRect().y
    + adjustment

  if (target.scrollTop - 10 <= position && position <= target.scrollTop + 10) return

  scrollAnimation(target, position)
}

export function scrollAnimation(element, to, speed = 1) {
  const start = element.scrollTop
  const change = to - start
  const duration = Math.abs(change / speed)
  const interval = 20

  let currentTime = 0

  animation()

  function animation() {
    currentTime += interval
    element.scrollTop = easeInOut(currentTime, start, change, duration)
    if (currentTime < duration) {
      setTimeout(animation, interval)
    }
  }

  function easeInOut(t, b, c, d) {
    t /= d / 2
    if (t < 1) return c / 2 * t * t + b

    t--
    return - c / 2 * (t * (t - 2) - 1) + b
  }
}
