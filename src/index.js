const { getSpecs } = require('find-cypress-specs')
const ghCore = require('@actions/core')
const cTable = require('console.table')

function getChunk(values, totalChunks, chunkIndex) {
  // split all items into N chunks and take just a single chunk
  if (totalChunks < 0) {
    throw new Error('totalChunks must be >= 0')
  }

  if (chunkIndex < 0 || chunkIndex >= totalChunks) {
    throw new Error(
      `Invalid chunk index ${chunkIndex} vs all chunks ${totalChunks}`,
    )
  }

  const chunkSize = Math.ceil(values.length / totalChunks)
  const chunkStart = chunkIndex * chunkSize
  const chunkEnd = chunkStart + chunkSize
  const chunk = values.slice(chunkStart, chunkEnd)
  return chunk
}

const label = 'cypress-split:'

const isDefined = (x) => typeof x !== 'undefined'

function cypressSplit(on, config) {
  // maybe the user called this function with a single argument
  // then we assume it is the config object
  if (arguments.length === 1) {
    config = on
  }

  if (config.specs) {
    console.log(config.specs)
  }

  // the user can specify the split flag / numbers
  // using either OS process environment variables
  // or Cypress env variables
  console.log('Cypress config env')
  console.log(config.env)

  let SPLIT = process.env.SPLIT || config.env.split || config.env.SPLIT
  let SPLIT_INDEX = process.env.SPLIT_INDEX || config.env.splitIndex
  if (SPLIT === 'true' || SPLIT === true) {
    // the user wants us to determine the machine index
    // and the total number of machines, which is possible for some CI systems
    if (process.env.CIRCLECI) {
      SPLIT = process.env.CIRCLE_NODE_TOTAL
      SPLIT_INDEX = process.env.CIRCLE_NODE_INDEX
      console.log(
        '%s detected CircleCI machine %d of %d',
        label,
        SPLIT_INDEX,
        SPLIT,
      )
    } else if (process.env.CI_NODE_INDEX && process.env.CI_NODE_TOTAL) {
      // GitLab CI
      // https://docs.gitlab.com/ee/ci/variables/predefined_variables.html
      SPLIT = process.env.CI_NODE_TOTAL
      // GitLabCI index starts with 1
      // convert it to zero base
      SPLIT_INDEX = Number(process.env.CI_NODE_INDEX) - 1
      console.log(
        '%s detected GitLabCI machine %d of %d',
        label,
        SPLIT_INDEX,
        SPLIT,
      )
    } else {
      throw new Error('Do not know how to determine the correct split')
    }
  }

  if (isDefined(SPLIT) && isDefined(SPLIT_INDEX)) {
    const specs = getSpecs(config)
    console.log('%s there are %d found specs', label, specs.length)
    // console.log(specs)
    const splitN = Number(SPLIT)
    const splitIndex = Number(SPLIT_INDEX)
    console.log('%s split %d of %d', label, splitIndex, splitN)
    const splitSpecs = getChunk(specs, splitN, splitIndex)

    const specRows = splitSpecs.map((specName, k) => {
      return [String(k + 1), specName]
    })
    console.log(cTable.getTable(['k', 'spec'], specRows))

    if (process.env.GITHUB_ACTIONS) {
      // https://github.blog/2022-05-09-supercharging-github-actions-with-job-summaries/

      ghCore.summary
        .addHeading(
          `${label} chunk ${splitIndex + 1} of ${splitN} (${
            splitSpecs.length
          } ${splitSpecs.length === 1 ? 'spec' : 'specs'})`,
        )
        .addTable([
          [
            { data: 'k', header: true },
            { data: 'spec', header: true },
          ],
          ...specRows,
        ])
        .addLink(
          'bahmutov/cypress-split',
          'https://github.com/bahmutov/cypress-split',
        )
        .write()
    }

    config.specPattern = splitSpecs
    return config
  }
}

module.exports = cypressSplit
