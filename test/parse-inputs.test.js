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

test('getSpecsToSplit spec pattern with wildcards', (t) => {
  const specs = getSpecsToSplit({
    SPEC: 'cypress/e2e/spec-*.cy.js',
  })
  // finds all specs matching the glob pattern
  const relativeSpecs = toRelative(specs)
  t.deepEqual(relativeSpecs, [
    'cypress/e2e/spec-a.cy.js',
    'cypress/e2e/spec-b.cy.js',
    'cypress/e2e/spec-c.cy.js',
    'cypress/e2e/spec-d.cy.js',
    'cypress/e2e/spec-e.cy.js',
  ])
})

test('getSpecsToSplit spec pattern with subfolder wildcards', (t) => {
  const specs = getSpecsToSplit({
    SPEC: 'cypress/**/spec-*.cy.js',
  })
  // finds all specs matching the glob pattern
  const relativeSpecs = toRelative(specs)
  t.deepEqual(relativeSpecs, [
    'cypress/e2e/spec-a.cy.js',
    'cypress/e2e/spec-b.cy.js',
    'cypress/e2e/spec-c.cy.js',
    'cypress/e2e/spec-d.cy.js',
    'cypress/e2e/spec-e.cy.js',
  ])
})
