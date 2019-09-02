export {}
const math = require('mathjs')

// A price object represents the price of a request in the system,
// as well as all the inputs and calculations that went into
// determining that price

class Price {
  adjustments: any[]
  currency: any
  constructor() {
    // The set of adjustments represent a potentially interdependent
    // set of adjustments.
    this.adjustments = []

    // Represents the currency that the adjustments are in. All
    // adjustments within a price are assumed to be in the same
    // currency. Currently, this can be JPY or MMP (smooosy Points)
    this.currency = null
  }

  // Adds an adjustment to the set of adjustments
  addAdjustment(adjustment) {
    this.adjustments.push(adjustment)
  }

  // An evaluation processes all the adjustments and returns a list of
  // symbol names and their values, which can then be used by a renderer
  // in order to create a user-facing data structure which contains prices.
  evaluate() {
    const symbolScope = {}

    // NOTE: this step assumes that the formulas are already topologically sorted.
    // Since we don't have too much stuff we're adding to adjustments right now,
    // we will place this responsibility on the caller.
    this.adjustments.forEach(a => {
      let value = math.eval(
        a.formula,
        Object.assign({}, symbolScope, a.variables,
        ))

      if (typeof(value) === 'object') {
        value = value.entries[0]
      }

      symbolScope[a.name] = value
    })

    return symbolScope
  }
}

module.exports = Price
