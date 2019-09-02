module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  testMatch: [ '**/__tests__/**/*.[jt]s?(x)' ],
  testPathIgnorePatterns: [ '/node_modules', '/__fixtures__' ],
}
