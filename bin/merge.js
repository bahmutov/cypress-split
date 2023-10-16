#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('cypress-split')
const globby = require('globby')

const label = 'cypress-split-merge'

const args = arg({
  '--split-file': String,
  '--parent-folder': String,
})
debug('args %o', args)
if (!args['--parent-folder']) {
  console.error('Missing --parent-folder')
  process.exit(1)
}
if (!args['--split-file']) {
  console.error('Missing --split-file')
  process.exit(1)
}

console.log(
  '%s finding all timings files %s/**/%s',
  label,
  args['--parent-folder'],
  args['--split-file'],
)

const files = globby.sync('**/' + args['--split-file'], {
  sort: true,
  cwd: args['--parent-folder'],
})
console.log('%s found %d file(s)', label, files.length)
debug(files)
