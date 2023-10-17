#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('cypress-split')
const globby = require('globby')
const fs = require('fs')
const { mergeSplitTimings } = require('../src/timings')
const ghCore = require('@actions/core')

const label = 'cypress-split-merge'

const args = arg({
  '--split-file': String,
  '--parent-folder': String,
  '--output': String, // output filename to write
  '--set-gha-output': String, // output merged json string
  // aliases
  '-o': '--output',
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
  absolute: true,
})
console.log('%s found %d file(s)', label, files.length)
debug(files)

const loadedTimings = files.map((filename) => {
  const json = JSON.parse(fs.readFileSync(filename, 'utf8'))
  return json
})
debug(
  'loaded %d timings lists from %d files',
  loadedTimings.length,
  files.length,
)

const merged = mergeSplitTimings(loadedTimings, debug)
debug('merged timings has %d entries', merged.durations.length)
debug(merged)

const mergedText = JSON.stringify(merged, null, 2)
if (args['--output']) {
  fs.writeFileSync(args['--output'], mergedText + '\n', 'utf8')
  console.log('%s wrote merged timings into %s', label, args['--output'])
} else {
  console.log('%s merged timings:', label)
  console.log(mergedText)
}

if (args['--set-gha-output']) {
  console.log(
    '%s setting timings as GHA output named "%s"',
    label,
    args['--set-gha-output'],
  )
  ghCore.setOutput(args['--set-gha-output'], JSON.stringify(merged))
}
