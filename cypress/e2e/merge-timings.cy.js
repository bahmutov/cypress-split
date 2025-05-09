/// <reference types="cypress" />

const { mergeSplitTimings } = require('../../src/timings')

chai.config.truncateThreshold = 500

it('averages and rounds the durations', () => {
  const timings1 = {
    durations: [
      {
        spec: 'cypress/integration/A.ts',
        duration: 100,
      },
      {
        spec: 'cypress/integration/B.ts',
        duration: 80,
      },
    ],
  }
  const timings2 = {
    durations: [
      {
        spec: 'cypress/integration/A.ts',
        duration: 111,
      },
      {
        spec: 'cypress/integration/B.ts',
        duration: 100,
      },
    ],
  }
  const merged = mergeSplitTimings([timings1, timings2])
  // the results are average
  expect(merged).to.deep.equal({
    durations: [
      {
        spec: 'cypress/integration/A.ts',
        duration: 106,
      },
      {
        spec: 'cypress/integration/B.ts',
        duration: 90,
      },
    ],
  })
})

it('takes existing values', () => {
  const timings1 = {
    durations: [
      {
        spec: 'cypress/integration/A.ts',
        duration: 100,
      },
    ],
  }
  const timings2 = {
    durations: [
      {
        spec: 'cypress/integration/B.ts',
        duration: 20,
      },
    ],
  }
  const merged = mergeSplitTimings([timings1, timings2])
  // the result has both entries
  expect(merged).to.deep.equal({
    durations: [
      {
        spec: 'cypress/integration/A.ts',
        duration: 100,
      },
      {
        spec: 'cypress/integration/B.ts',
        duration: 20,
      },
    ],
  })
})

it('sorts entries', () => {
  const timings1 = {
    durations: [
      {
        spec: 'cypress/e2e/spec-a.cy.js',
        duration: 100,
      },
      {
        spec: 'cypress/e2e/spec-c.cy.js',
        duration: 300,
      },
    ],
  }

  const timings2 = {
    durations: [
      {
        spec: 'cypress/e2e/spec-d.cy.js',
        duration: 400,
      },
      {
        spec: 'cypress/e2e/spec-b.cy.js',
        duration: 200,
      },
    ],
  }

  const merged = mergeSplitTimings([timings1, timings2])
  // the result has sorted entries
  expect(merged).to.deep.equal({
    durations: [
      {
        spec: 'cypress/e2e/spec-a.cy.js',
        duration: 100,
      },
      {
        spec: 'cypress/e2e/spec-b.cy.js',
        duration: 200,
      },
      {
        spec: 'cypress/e2e/spec-c.cy.js',
        duration: 300,
      },
      {
        spec: 'cypress/e2e/spec-d.cy.js',
        duration: 400,
      },
    ],
  })
})
