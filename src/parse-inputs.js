// @ts-check
const debug = require('debug')('cypress-split')
const path = require('path')

function parseSplitInputs(env = {}, configEnv = {}) {
  let SPLIT = process.env.SPLIT || configEnv.split || configEnv.SPLIT
  let SPLIT_INDEX = process.env.SPLIT_INDEX || configEnv.splitIndex
  let SPLIT_FILE = process.env.SPLIT_FILE || configEnv.splitFile
  let SPLIT_OUTPUT_FILE =
    process.env.SPLIT_OUTPUT_FILE || configEnv.splitOutputFile || SPLIT_FILE

  // some CI systems like TeamCity provide agent index starting with 1
  // let's check for SPLIT_INDEX1 and if it is set,
  // use it instead of zero-based SPLIT_INDEX
  debug('split index 1 possible values', {
    SPLIT_INDEX1: process.env.SPLIT_INDEX1,
    splitIndex1: configEnv.splitIndex1,
  })
  if (process.env.SPLIT_INDEX1 || configEnv.splitIndex1) {
    const indexOne = process.env.SPLIT_INDEX1 || configEnv.splitIndex1
    SPLIT_INDEX = Number(indexOne) - 1
    debug(
      'set SPLIT_INDEX to %d from index starting with 1 "%s"',
      SPLIT_INDEX,
      indexOne,
    )
  }

  // potentially a list of files to run / split
  let SPEC = process.env.SPEC || configEnv.spec || configEnv.SPEC
  /** @type {string[]|undefined} absolute spec filenames */
  let specs
  if (typeof SPEC === 'string' && SPEC) {
    specs = SPEC.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((specFilename) => {
        // make sure every spec filename is absolute
        return path.resolve(specFilename)
      })
  }

  return { SPLIT, SPLIT_INDEX, SPLIT_FILE, SPLIT_OUTPUT_FILE, specs }
}

module.exports = { parseSplitInputs }
