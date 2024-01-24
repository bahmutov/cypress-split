// @ts-check
const debug = require('debug')('cypress-split')
const path = require('path')
const { getSpecs } = require('find-cypress-specs')
const globby = require('globby')

function parseSplitInputs(env = {}, configEnv = {}) {
  let SPLIT = env.SPLIT || configEnv.split || configEnv.SPLIT
  let SPLIT_INDEX = env.SPLIT_INDEX || configEnv.splitIndex
  let SPLIT_FILE = env.SPLIT_FILE || configEnv.splitFile
  let SPLIT_OUTPUT_FILE =
    env.SPLIT_OUTPUT_FILE || configEnv.splitOutputFile || SPLIT_FILE

  // some CI systems like TeamCity provide agent index starting with 1
  // let's check for SPLIT_INDEX1 and if it is set,
  // use it instead of zero-based SPLIT_INDEX
  debug('split index 1 possible values', {
    SPLIT_INDEX1: env.SPLIT_INDEX1,
    splitIndex1: configEnv.splitIndex1,
  })
  if (env.SPLIT_INDEX1 || configEnv.splitIndex1) {
    const indexOne = env.SPLIT_INDEX1 || configEnv.splitIndex1
    SPLIT_INDEX = Number(indexOne) - 1
    debug(
      'set SPLIT_INDEX to %d from index starting with 1 "%s"',
      SPLIT_INDEX,
      indexOne,
    )
  }

  let ciName

  if (SPLIT === 'true' || SPLIT === true) {
    // the user wants us to determine the machine index
    // and the total number of machines, which is possible for some CI systems
    if (env.CIRCLECI) {
      ciName = 'CircleCI'
      SPLIT = env.CIRCLE_NODE_TOTAL
      SPLIT_INDEX = env.CIRCLE_NODE_INDEX
    } else if (env.CI_NODE_INDEX && env.CI_NODE_TOTAL) {
      // GitLab CI
      // https://docs.gitlab.com/ee/ci/variables/predefined_variables.html
      ciName = 'GitLabCI'
      SPLIT = env.CI_NODE_TOTAL
      // GitLabCI index starts with 1
      // convert it to zero base
      SPLIT_INDEX = Number(env.CI_NODE_INDEX) - 1
    } else {
      throw new Error('Do not know how to determine the correct split')
    }
  }

  return { SPLIT, SPLIT_INDEX, SPLIT_FILE, SPLIT_OUTPUT_FILE, ciName }
}

/**
 * Returns a list of spec filenames to split.
 * Each spec filename is absolute.
 * @returns {string[]} list of spec filenames
 */
function getSpecsToSplit(env = {}, config) {
  // potentially a list of files to run / split
  let SPEC = env.SPEC || config?.env?.spec || config?.env?.SPEC
  if (typeof SPEC === 'string' && SPEC) {
    debug('using explicit list of specs "%s"', SPEC)
    const possiblePatterns = SPEC.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((specFilename) => {
        // make sure every spec filename is absolute
        return path.resolve(specFilename)
      })
    // all resolved absolute spec filenames
    const specs = []
    possiblePatterns.forEach((pattern) => {
      if (pattern.includes('*')) {
        // the user specified the wildcard pattern
        // resolve it using globby and searching the disk
        const found = globby.sync(pattern)
        debug('found %d specs for pattern "%s"', found.length, pattern)
        specs.push(...found)
      } else {
        // pass the user-specified filename as is
        debug('adding spec "%s"', pattern)
        specs.push(pattern)
      }
    })
    return specs
  } else {
    const returnAbsolute = true
    const specs = getSpecs(config, undefined, returnAbsolute)
    return specs
  }
}

module.exports = { parseSplitInputs, getSpecsToSplit }
