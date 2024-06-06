/// <reference types="Cypress" />
// @ts-check

const debug = require('debug')('cypress-split')
const ghCore = require('@actions/core')

const { parseSplitInputs, getSpecsToSplit } = require('./parse-inputs')
const { hasTimeDifferences, mergeTimings } = require('./timings')
const { getEnvironmentFlag, splitSpecsLogic } = require('./utils')
const path = require('path')
const os = require('os')
const fs = require('fs')
const humanizeDuration = require('humanize-duration')

const label = 'cypress-split:'

const isDefined = (x) => typeof x !== 'undefined'

const hasSpecPassed = (specResult) =>
  specResult.stats.passes > 0 && specResult.stats.failures === 0

const hasFailedTests = (specResult) => specResult.stats.failures > 0

/**
 * Initialize Cypress split plugin using Cypress "on" and "config" arguments.
 * @param {Cypress.PluginEvents} on Cypress "on" event registration
 * @param {Cypress.PluginConfigOptions} config Cypress config object
 * @param {((specs: string[]) => string[]) | undefined} userSpecOrderFn Custom function to order the specs. The list of specs has absolute filenames.
 */
function cypressSplit(on, config, userSpecOrderFn = undefined) {
  // maybe the user called this function with a single argument
  // then we assume it is the config object
  if (arguments.length === 1) {
    debug('single argument, assuming it is the config object')
    // @ts-ignore
    config = on
  }

  if (config.spec) {
    debug('config has specs set')
    debug(config.spec)
  }

  // if we want to see all settings
  // console.log(config)

  // the user can specify the split flag / numbers
  // using either OS process environment variables
  // or Cypress env variables
  debug('Cypress config env')
  debug(config.env)
  debug('current working directory %s', process.cwd())
  debug('project root folder %s', config.projectRoot)

  // collect the test results to generate a better report
  const specResults = {}
  // map from absolute to relative spec names as reported by Cypress
  const specAbsoluteToRelative = {}

  on('after:spec', (spec, results) => {
    // console.log(results, results)

    const passed = results.stats.failures === 0 && results.stats.passes > 0

    if (passed) {
      debug('after:spec for passed %s %o', spec.relative, results.stats)
    } else {
      debug('after:spec for %s %o', spec.relative, results.stats)
    }

    const cwd = process.cwd()
    const absoluteSpecPath = spec.absolute || path.join(cwd, spec.relative)

    // make sure there are no duplicate specs for some reason
    if (specResults[absoluteSpecPath]) {
      console.error(
        'Warning: cypress-split found duplicate test results for %s',
        absoluteSpecPath,
      )
    }

    specResults[absoluteSpecPath] = results
    specAbsoluteToRelative[absoluteSpecPath] = spec.relative
  })

  let { SPLIT, SPLIT_INDEX, SPLIT_FILE, SPLIT_OUTPUT_FILE, ciName } =
    parseSplitInputs(process.env, config.env)

  if (SPLIT_FILE) {
    console.log('%s Timings are read from %s', label, SPLIT_FILE)
  }
  if (SPLIT_OUTPUT_FILE) {
    console.log('%s Timings will be written to %s', label, SPLIT_OUTPUT_FILE)
  }

  if (ciName) {
    console.log(
      '%s detected %s machine %d of %d',
      label,
      ciName,
      SPLIT_INDEX + 1,
      SPLIT,
    )
  }

  if (isDefined(SPLIT) && isDefined(SPLIT_INDEX)) {
    const specs = getSpecsToSplit(process.env, config)

    console.log('%s there are %d found specs', label, specs.length)
    if (specs.length < 5) {
      specs.forEach((spec, k) => {
        console.log('- %d: %s', k + 1, spec)
      })
    } else {
      console.log('the first 5 specs')
      specs.slice(0, 5).forEach((spec, k) => {
        console.log('- %d: %s', k + 1, spec)
      })
    }
    // console.log(specs)
    const splitN = Number(SPLIT)
    const splitIndex = Number(SPLIT_INDEX)
    console.log('%s chunk %d of %d', label, splitIndex + 1, splitN)

    debug('get chunk %o', { specs, splitN, splitIndex })

    const { splitSpecs, foundSplitFile } = splitSpecsLogic({
      specs,
      splitN,
      splitIndex,
      splitFileName: SPLIT_FILE,
      label,
    })

    let batchSpecs
    if (userSpecOrderFn) {
      debug(
        'calling the user spec order function with %d specs',
        splitSpecs.length,
      )
      batchSpecs = userSpecOrderFn(splitSpecs)
      if (!Array.isArray(batchSpecs)) {
        throw new Error(
          'The user spec order function must return an array of spec filenames',
        )
      }
    } else {
      batchSpecs = splitSpecs
    }

    debug('split specs batch')
    debug(batchSpecs)

    const addSpecResults = () => {
      let chunkPassed = true

      // at this point, the specAbsoluteToRelative object should be filled
      const specRows = batchSpecs.map((absoluteSpecPath, k) => {
        const relativeName = specAbsoluteToRelative[absoluteSpecPath]
        const specRow = [String(k + 1), relativeName || absoluteSpecPath]

        const specResult = specResults[absoluteSpecPath]
        if (specResult) {
          // shorted to relative filename
          debug('spec results for %s', relativeName)
          debug(specResult.stats)
          // the duration field depends on the Cypress version
          const specDuration = Math.round(
            specResult.stats.duration || specResult.stats.wallClockDuration,
          )
          const humanSpecDuration = humanizeDuration(specDuration)
          debug(
            'spec took %d ms, human duration %s',
            specDuration,
            humanSpecDuration,
          )
          const specPassed = !hasFailedTests(specResult)
          chunkPassed = chunkPassed && specPassed

          // have to convert numbers to strings
          specRow.push(String(specResult.stats.passes))
          specRow.push(String(specResult.stats.failures))
          specRow.push(String(specResult.stats.pending))
          specRow.push(String(specResult.stats.skipped))
          specRow.push(humanSpecDuration)
        } else {
          console.error('Could not find spec results for %s', absoluteSpecPath)
        }

        return specRow
      })

      return { specRows, chunkPassed }
    }

    on('after:run', () => {
      if (SPLIT_FILE) {
        console.log('%s here are passing spec timings', label)

        const specDurations = batchSpecs
          .map((absoluteSpecPath, k) => {
            const relativeName = specAbsoluteToRelative[absoluteSpecPath]
            const specResult = specResults[absoluteSpecPath]
            if (specResult) {
              const passed = hasSpecPassed(specResult)
              const allPending =
                specResult.stats.tests === specResult.stats.pending
              debug({ relativeName, passed, allPending })

              if (passed || allPending) {
                const duration = Math.round(
                  specResult.stats.duration ||
                    specResult.stats.wallClockDuration,
                )
                debug('new info %o', { relativeName, duration })
                return {
                  spec: relativeName,
                  duration,
                }
              } else {
                debug('spec %s has not passed, ignoring timing', relativeName)
                return
              }
            } else {
              return
            }
          })
          .filter(Boolean)

        const timings = {
          durations: specDurations,
        }

        const timingsString = JSON.stringify(timings, null, 2)
        console.log(timingsString)

        if (!foundSplitFile) {
          console.log(
            '%s writing out timings file %s',
            label,
            SPLIT_OUTPUT_FILE,
          )
          fs.writeFileSync(SPLIT_OUTPUT_FILE, timingsString + '\n', 'utf8')
        } else {
          const splitFile = JSON.parse(fs.readFileSync(foundSplitFile, 'utf8'))
          let splitThreshold = 0.1
          if (
            'SPLIT_TIME_THRESHOLD' in process.env &&
            process.env.SPLIT_TIME_THRESHOLD
          ) {
            debug(
              'will use SPLIT_TIME_THRESHOLD value %s',
              process.env.SPLIT_TIME_THRESHOLD,
            )
            splitThreshold = parseFloat(process.env.SPLIT_TIME_THRESHOLD)
            debug('parsed SPLIT_TIME_THRESHOLD is %d', splitThreshold)
          }
          const hasUpdatedTimings = hasTimeDifferences(
            splitFile,
            timings,
            splitThreshold,
          )
          if (hasUpdatedTimings) {
            // TODO: merge split file with new timings
            // do not forget specs not present in the current run!
            const mergedTimings = mergeTimings(splitFile, timings)
            const mergedText = JSON.stringify(mergedTimings, null, 2)
            console.log(
              '%s writing out updated timings file %s',
              label,
              SPLIT_OUTPUT_FILE,
            )
            debug('previous timings has %d entries', splitFile.durations.length)
            debug('current timings has %d entries', timings.durations.length)
            debug(
              'merged timings has %d entries written to %s',
              mergedTimings.durations.length,
              SPLIT_OUTPUT_FILE,
            )
            fs.writeFileSync(SPLIT_OUTPUT_FILE, mergedText + '\n', 'utf8')
          } else {
            console.log('%s spec timings unchanged', label)
            if (SPLIT_OUTPUT_FILE !== SPLIT_FILE) {
              console.log(
                '%s writing out timings file %s',
                label,
                SPLIT_OUTPUT_FILE,
              )
              fs.writeFileSync(SPLIT_OUTPUT_FILE, timingsString + '\n', 'utf8')
            }
          }
        }
      }

      const shouldWriteSummary = getEnvironmentFlag('SPLIT_SUMMARY', true)
      debug('shouldWriteSummary', shouldWriteSummary)

      if (shouldWriteSummary) {
        // only output the GitHub summary table AFTER the run
        // because GH does not show the summary before the job finishes
        // so we might as well wait for all spec results to come in
        if (process.env.GITHUB_ACTIONS) {
          const { specRows, chunkPassed } = addSpecResults()

          const chunkEmoji = chunkPassed ? '✅' : '❌'
          const chunkHeading = `${label} chunk ${splitIndex + 1} of ${splitN} (${
            batchSpecs.length
          } ${batchSpecs.length === 1 ? 'spec' : 'specs'}) ${chunkEmoji}`

          // https://github.blog/2022-05-09-supercharging-github-actions-with-job-summaries/
          ghCore.summary
            .addHeading(chunkHeading)
            .addTable([
              [
                { data: 'K', header: true },
                { data: 'Spec', header: true },
                { data: 'Passed ✅', header: true },
                { data: 'Failed ❌', header: true },
                { data: 'Pending ✋', header: true },
                { data: 'Skipped ↩️', header: true },
                { data: 'Duration 🕗', header: true },
              ],
              ...specRows,
            ])
            .addLink(
              'bahmutov/cypress-split',
              'https://github.com/bahmutov/cypress-split',
            )
            .write()
        }
      }
    })

    if (batchSpecs.length) {
      debug('setting the spec pattern to')
      debug(batchSpecs)
      // if working with Cypress v9, there is integration folder
      // @ts-ignore
      if (config.integrationFolder) {
        debug('setting test files')
        // @ts-ignore
        config.testFiles = batchSpecs.map((name) =>
          // @ts-ignore
          path.relative(config.integrationFolder, name),
        )
      } else {
        // Cypress v10+
        config.specPattern = batchSpecs
      }
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
      debug('set spec pattern to "%s"', config.specPattern)
    }

    return config
  } else {
    debug('no SPLIT or SPLIT_INDEX, not splitting specs')
  }
}

module.exports = cypressSplit
