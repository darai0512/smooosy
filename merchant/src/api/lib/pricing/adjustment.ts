export {}
// An adjustment represents a single discrete adjustment to a price,
// usually corresponding to some business process.
// Example adjustments: base price, sales tax, discount, etc.
class Adjustment {
  name: any
  formula: any
  variables: any
  constructor({ name, formula, variables }) {
    this.name = name
    this.formula = formula
    this.variables = variables
  }
}

module.exports = Adjustment