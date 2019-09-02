module.exports = {
  total: Number,
  estimatePriceType: String,
  components: [{
    isNumber: Boolean,
    label: String,
    value: Number,
    calculatedValue: Number,
    answers: [{
      number: Number,
      unit: String,
    }],
  }],
}