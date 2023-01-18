// @ts-check

const debug = require('debug')('cypress-split')
const { getSpecs } = require('find-cypress-specs')
const ghCore = require('@actions/core')
const cTable = require('console.table')
const { getChunk } = require('./chunk')
const path = require('path')
const os = require('os')
const fs = require('fs')

const label = 'cypress-split:'

const isDefined = (x) => typeof x !== 'undefined'

function cypressSplit(on, config) {
  // maybe the user called this function with a single argument
  // then we assume it is the config object
  if (arguments.length === 1) {
    debug('single argument, assuming it is the config object')
    config = on
  }

  if (config.spec) {
    debug('config has specs set')
    debug(config.spec)
  }

  // the user can specify the split flag / numbers
  // using either OS process environment variables
  // or Cypress env variables
  debug('Cypress config env')
  debug(config.env)

  let SPLIT = process.env.SPLIT || config.env.split || config.env.SPLIT
  let SPLIT_INDEX = process.env.SPLIT_INDEX || config.env.splitIndex
  // potentially a list of files to run / split
  let SPEC = process.env.SPEC || config.env.spec || config.env.SPEC
  let specs
  if (typeof SPEC === 'string' && SPEC) {
    specs = SPEC.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    console.log(
      '%s have explicit %d spec %s',
      label,
      specs.length,
      specs.length === 1 ? 'file' : 'files',
    )
  }

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
    if (!specs) {
      // @ts-ignore
      specs = getSpecs(config)
    }

    console.log('%s there are %d found specs', label, specs.length)
    // console.log(specs)
    const splitN = Number(SPLIT)
    const splitIndex = Number(SPLIT_INDEX)
    console.log('%s split %d of %d', label, splitIndex, splitN)

    debug('get chunk %o', { specs, splitN, splitIndex })
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

    if (splitSpecs.length) {
      debug('setting the spec pattern to')
      debug(splitSpecs)
      config.specPattern = splitSpecs
    } else {
      // copy the empty spec file from our source folder into temp folder
      const tempFilename = path.join(
        os.tmpdir(),
        `empty-${splitIndex + 1}-of-${splitN}.cy.js`,
      )
      const emptyFilename = path.resolve(__dirname, 'empty-spec.cy.js')
      fs.copyFileSync(emptyFilename, tempFilename)
      console.log(
        '%s no specs to run, running an empty spec file %s',
        label,
        tempFilename,
      )
      config.specPattern = tempFilename
    }

    return config
  }
}

module.exports = cypressSplit
