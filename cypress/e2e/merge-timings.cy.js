/// <reference types="cypress" />

const { mergeSplitTimings } = require('../../src/timings')

chai.config.truncateThreshold = 500

it('averages the durations', () => {
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
        duration: 80,
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
        duration: 90,
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
