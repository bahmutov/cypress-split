const test = require('ava')
const path = require('path')
const { getSpecsToSplit } = require('../src/parse-inputs')

function toRelative(filenames) {
  const cwd = process.cwd()
  return filenames.map((filename) => path.relative(cwd, filename))
}

test('getSpecsToSplit spec pattern', (t) => {
  const specs = getSpecsToSplit({
    SPEC: 'cypress/spec-a.js,cypress/integration/spec-b.js',
  })
  const relativeSpecs = toRelative(specs)
  t.deepEqual(relativeSpecs, [
    'cypress/spec-a.js',
    'cypress/integration/spec-b.js',
  ])
})
