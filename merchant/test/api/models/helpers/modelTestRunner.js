const runTestCases = require('./runTestCases')

class ModelTestRunner {
  constructor(test, Model, testCases, isEqual) {
    this.test = test
    this.Model = Model
    this.testCases = testCases
    this.isEqual = isEqual
  }

  async runTestCases() {
    await runTestCases(this.test, this.testCases, this.runTestCase.bind(this))
  }

  deepEqual(t, instance, fixture) {
    delete instance.createdAt
    delete instance.updatedAt
    delete instance._id
    delete instance.id
    t.deepEqual(instance, fixture)
  }

  async runTestCase(t, tc) {
    let input = tc.input()

    if (tc.modifiers) {
      tc.modifiers(input)
    }

    if (tc.expectedError) {
      await this.Model.create(input).catch(err => {
        t.true(err.message.includes(tc.expectedError))
      })

      return
    }

    const instance = await this.Model.create(input)

    if (tc.isEqual) {
      tc.isEqual(t, instance.toJSON(), input)
    } else {
      this.deepEqual(t, instance.toJSON(), input)
    }

    if (tc.assertions) {
      tc.assertions(t, instance)
    }
  }
}

module.exports = ModelTestRunner