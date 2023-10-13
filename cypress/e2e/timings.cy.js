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
  const { chunks, sums } = splitByDuration(2, list)
  expect(chunks, 'chunks').to.deep.equal([
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
  expect(sums, 'duration sums').to.deep.equal([7000, 7000])
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
  const { chunks, sums } = splitByDuration(4, list)
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
  expect(sums, 'duration sums').to.deep.equal([6000, 6000, 1000, 1000])
})
