export {}
const Mode = {
  PRIMARY: 'primary',
  SHADOW: 'shadow',
  SECONDARY: 'secondary',
}

function createSwitch(primary, secondary, mode, comparator, context = {}) {
  return async function(...args) {
    if (mode === Mode.PRIMARY) {
      return await primary(...args)
    } else if (mode === Mode.SECONDARY) {
      return await secondary(...args)
    } else if (mode === Mode.SHADOW) {
      const primaryRes = await primary(...args)
      const shadowRes = await secondary(...args)

      if (comparator) {
        comparator(primaryRes, shadowRes, context)
      }

      return primaryRes
    }
  }
}

module.exports = {
  createSwitch,
  Mode,
}
