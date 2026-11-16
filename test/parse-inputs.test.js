const test = require('ava')
const path = require('path')
const { getSpecsToSplit, parseSplitInputs } = require('../src/parse-inputs')

function toRelative(filenames) {
  const cwd = process.cwd()
  return filenames.map((filename) => path.relative(cwd, filename))
}

test('parseSplitInputs converts strings to numbers', (t) => {
  const inputs = parseSplitInputs({
    SPLIT: '1',
    SPLIT_INDEX: '2',
  })

  t.is(inputs.SPLIT, 1)
  t.is(inputs.SPLIT_INDEX, 2)
})

test('parseSplitInputs keeps splitIndex 0 from the Cypress config env', (t) => {
  // "--env split=4,splitIndex=0" is parsed by Cypress as numbers,
  // so configEnv.splitIndex is the number 0, not a string
  const inputs = parseSplitInputs({}, { split: 4, splitIndex: 0 })

  t.is(inputs.SPLIT, 4)
  t.is(inputs.SPLIT_INDEX, 0)
})

test('parseSplitInputs falls back when the env var is an empty string', (t) => {
  // an unset shell env var can come through as "" rather than undefined,
  // e.g. "SPLIT_INDEX= cypress run" - it should not win over the config value
  const inputs = parseSplitInputs(
    { SPLIT_INDEX: '' },
    { split: 4, splitIndex: 2 },
  )

  t.is(inputs.SPLIT, 4)
  t.is(inputs.SPLIT_INDEX, 2)
})

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

test('getSpecsToSplit with skip specs', (t) => {
  const specs = getSpecsToSplit({
    SPEC: 'cypress/e2e/spec-*.cy.js',
    SKIP_SPEC: 'cypress/e2e/spec-b.cy.js',
  })
  // finds all specs matching the glob pattern
  // but without "spec-b.cy.js"
  const relativeSpecs = toRelative(specs)
  t.deepEqual(relativeSpecs, [
    'cypress/e2e/spec-a.cy.js',
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

test('getSpecsToSplit with random seed shuffle', (t) => {
  const specs = getSpecsToSplit({
    SPEC: 'cypress/**/spec-*.cy.js',
    SPLIT_RANDOM_SEED: '11',
  })
  const relativeSpecs = toRelative(specs)
  t.deepEqual(relativeSpecs, [
    'cypress/e2e/spec-d.cy.js',
    'cypress/e2e/spec-e.cy.js',
    'cypress/e2e/spec-b.cy.js',
    'cypress/e2e/spec-c.cy.js',
    'cypress/e2e/spec-a.cy.js',
  ])
})
