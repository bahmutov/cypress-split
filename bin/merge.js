#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('cypress-split')

const label = 'cypress-split-merge'

const args = arg({
  '--split-file': String,
  '--parent-folder': String,
})
debug('args %o', args)

console.log(
  '%s finding all timings files %s/**/%s',
  label,
  args['--parent-folder'],
  args['--split-file'],
)
