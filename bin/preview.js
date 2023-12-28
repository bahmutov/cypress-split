#!/usr/bin/env node

// @ts-check

const arg = require('arg')
const debug = require('debug')('cypress-split')
const label = 'cypress-split-preview'
const { version } = require('../package.json')
const { getSpecsToSplit } = require('../src/parse-inputs')
const { splitSpecsLogic } = require('../src/utils')

console.log('%s Version %s', label, version)

const args = arg({
  '--split': Number,
  '--split-file': String,
})
debug(args)

console.log('%s split %d ways', label, args['--split'])
const specs = getSpecsToSplit(process.env)
console.log('%s found %d specs', label, specs.length)
debug(specs)

if (typeof args['--split'] !== 'number') {
  throw new Error('Please provide --split N')
}

for (let k = 0; k < args['--split']; k += 1) {
  splitSpecsLogic({
    specs,
    splitN: args['--split'],
    splitIndex: k,
    splitFileName: args['--split-file'],
    label,
  })
}
