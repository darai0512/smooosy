export const PricesToPointsSchema = {
  mapping: [{
    price: Number,
    points: Number,
  }],
  // Formula contains the coefficients for the price to point conversion
  // formula: Point value = a * Math.log(price + b) + c
  formula: {
    a: Number,
    b: Number,
    c: Number,
  },
}