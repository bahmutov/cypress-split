#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-split')
const label = 'cypress-split-preview'
const { version, homepage } = require('../package.json')
const { getSpecsToSplit } = require('../src/parse-inputs')
const { splitSpecsLogic } = require('../src/utils')

console.log('%s Version %s', label, version)
console.log('%s Homepage %s', label, homepage)

const args = arg({
  '--split': Number,
  '--split-file': String,
})
debug(args)

const n = args['--split']
console.log('%s split %d ways', label, n)
const specs = getSpecsToSplit(process.env)
console.log('%s found %d specs', label, specs.length)
debug(specs)

if (typeof n !== 'number') {
  throw new Error('Please provide --split N')
}

for (let k = 0; k < n; k += 1) {
  console.log('%s chunk %d of %d', label, k + 1, n)
  splitSpecsLogic({
    specs,
    splitN: n,
    splitIndex: k,
    splitFileName: args['--split-file'],
    label,
  })
}
