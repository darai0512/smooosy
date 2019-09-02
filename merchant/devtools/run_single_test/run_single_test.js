// This script allows running a single ava test straight from an IDE.
// As long your cursor is anywhere inside the test, this script will find the test name and pass it to `ava --match`
// It's meant to be used with VS Code.
// For the build task, see tasks.json in this same directory

const fs = require('fs')
const { spawn } = require('child_process')

const filePath = process.argv[2]
const lineNumber = parseInt(process.argv[3])

// reverse lines since we're iterating in reverse order
const reversedLines = fs
  .readFileSync(filePath, 'utf8')
  .split('\n')
  .reverse()

// if we have a file that's 5 lines and we're starting at line 4,
// in the reversed array, that's line 2 (index 1)
// [5, 4, 3, 2, 1]
const lines = reversedLines.slice(reversedLines.length - lineNumber)

let testName

// go up the file until we find a matching test declaration
for (const line of lines) {
  const match = line.match('test.*\\(\'(.*)\'')

  if (match) {
    testName = match[1]
    break
  }
}

spawn(
  'yarn',
  ['ava', filePath, '--match', testName],
  { stdio: 'inherit' }
)
