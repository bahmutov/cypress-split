// @ts-check
const debug = require('debug')('cypress-split')
const path = require('path')
const { getSpecs } = require('find-cypress-specs')
const globby = require('globby')
const { createShuffle } = require('fast-shuffle')

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
    } else if (env.BUILDKITE) {
      ciName = 'Buildkite'
      SPLIT = env.BUILDKITE_PARALLEL_JOB_COUNT
      SPLIT_INDEX = env.BUILDKITE_PARALLEL_JOB
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
  // potential list of specs to skip
  let SKIP_SPEC =
    env.SKIP_SPEC || config?.env?.skipSpec || config?.env?.SKIP_SPEC
  const skipSpecs = []
  if (typeof SKIP_SPEC === 'string' && SKIP_SPEC) {
    const possiblePatterns = SKIP_SPEC.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((specFilename) => {
        // make sure every spec filename is absolute
        return path.resolve(specFilename)
      })
    // all resolved absolute spec filenames
    possiblePatterns.forEach((pattern) => {
      if (pattern.includes('*')) {
        // the user specified the wildcard pattern
        // resolve it using globby and searching the disk
        const found = globby.sync(pattern)
        skipSpecs.push(...found)
      } else {
        skipSpecs.push(pattern)
      }
    })
  }
  if (skipSpecs.length) {
    debug('skipping %d specs', skipSpecs.length)
    if (skipSpecs.length < 10) {
      debug('skipping specs %o', skipSpecs)
    }
  }

  let splitRandomSeed = null
  if (env.SPLIT_RANDOM_SEED) {
    splitRandomSeed = Number(env.SPLIT_RANDOM_SEED)
    debug('found random seed %d', splitRandomSeed)
  }

  let foundSpecs

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
    debug(
      'resolving %d specs "%s"',
      possiblePatterns.length,
      possiblePatterns.join(','),
    )

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
    // returned a filtered list
    if (skipSpecs.length) {
      debug(
        'before skipping specs %d, filtering %d specs',
        specs.length,
        skipSpecs.length,
      )
    }

    foundSpecs = specs
  } else {
    const returnAbsolute = true
    const specs = getSpecs(config, undefined, returnAbsolute)
    // returned a filtered list
    if (skipSpecs.length) {
      debug(
        'before skipping specs %d, filtering %d specs',
        specs.length,
        skipSpecs.length,
      )
    }
    foundSpecs = specs
  }

  debug('skipping %d specs', skipSpecs.length)
  const filteredSpecs = foundSpecs.filter((spec) => !skipSpecs.includes(spec))

  if (splitRandomSeed) {
    debug('shuffling specs using random seed %d', splitRandomSeed)
    // shuffle the specs using the random seed
    const shuffleSpecs = createShuffle(splitRandomSeed)
    const shuffledSpecs = shuffleSpecs(filteredSpecs)
    return shuffledSpecs
  }

  return filteredSpecs
}

module.exports = { parseSplitInputs, getSpecsToSplit }
