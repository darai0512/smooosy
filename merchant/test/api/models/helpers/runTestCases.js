function runTestCases(test, testCases, runner) {
  const onlyRunTcs = testCases.filter(tc => tc.onlyRun)
  const nonSerialTcs = testCases.filter(tc => tc.nonSerial)
  testCases = testCases.filter(tc => !tc.nonSerial)

  const tcsToRun = onlyRunTcs.length > 0 ? onlyRunTcs : testCases

  tcsToRun.forEach(tc => {
    test.serial(tc.name, async t => {
      await runner(t, tc)
    })
  })
  nonSerialTcs.forEach(tc => {
    test(tc.name, async t => {
      await runner(t, tc)
    })
  })
}

module.exports = runTestCases