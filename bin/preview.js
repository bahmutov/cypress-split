#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('cypress-split')
const label = 'cypress-split-preview'
const { version } = require('../package.json')

console.log('%s Version %s', label, version)

const args = arg({
  '--split': Number,
  '--split-file': String,
})
debug(args)

console.log('%s split %d ways', label, args['--split'])
