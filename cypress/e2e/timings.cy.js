/// <reference types="cypress" />

const { splitByDuration } = require('../../src/timings')

it('splits specs based on timings', () => {
  const list = [
    {
      spec: 'a',
      duration: 1000,
    },
    {
      spec: 'b',
      duration: 6000,
    },
    {
      spec: 'c',
      duration: 6000,
    },
    {
      spec: 'd',
      duration: 1000,
    },
  ]
  const chunks = splitByDuration(2, list)
  expect(chunks).to.deep.equal([
    [
      {
        spec: 'b',
        duration: 6000,
      },
      {
        spec: 'a',
        duration: 1000,
      },
    ],
    [
      {
        spec: 'c',
        duration: 6000,
      },
      {
        spec: 'd',
        duration: 1000,
      },
    ],
  ])
})

it('splits specs based on timings, single result', () => {
  const list = [
    {
      spec: 'a',
      duration: 1000,
    },
    {
      spec: 'b',
      duration: 6000,
    },
    {
      spec: 'c',
      duration: 6000,
    },
    {
      spec: 'd',
      duration: 1000,
    },
  ]
  const chunks = splitByDuration(4, list)
  expect(chunks).to.deep.equal([
    [
      {
        spec: 'b',
        duration: 6000,
      },
    ],
    [
      {
        spec: 'c',
        duration: 6000,
      },
    ],
    [
      {
        spec: 'a',
        duration: 1000,
      },
    ],

    [
      {
        spec: 'd',
        duration: 1000,
      },
    ],
  ])
})
