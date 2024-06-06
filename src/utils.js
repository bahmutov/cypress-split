// @ts-check

const cTable = require('console.table')
const path = require('path')
const humanizeDuration = require('humanize-duration')
const debug = require('debug')('cypress-split')
const fs = require('fs')
const { getChunk } = require('./chunk')
const { findFile } = require('./find-file')
const { splitByDuration } = require('./timings')

function getEnvironmentFlag(osVariableName, defaultValue = true) {
  if (!(osVariableName in process.env)) {
    return defaultValue
  }
  const value = process?.env[osVariableName]?.toLowerCase()
  return value === '1' || value === 'true'
}

/**
 * Console table with the list of specs names
 */
function printSpecsList(splitSpecs) {
  const cwd = process.cwd()
  const nameRows = splitSpecs.map((specName, k) => {
    const row = [String(k + 1), path.relative(cwd, specName)]
    return row
  })

  const headers = ['k', 'spec']
  console.log(cTable.getTable(headers, nameRows))
}

/**
 * Prints a table with spec names and durations
 */
function printSpecsListWithDurations(chunk) {
  const cwd = process.cwd()
  const nameRows = chunk.map((item, k) => {
    const relative = path.relative(cwd, item.specName)
    const duration = humanizeDuration(item.duration)
    const row = [String(k + 1), relative, duration]
    return row
  })
  const headers = ['k', 'spec', 'duration (estimate)']
  console.log(cTable.getTable(headers, nameRows))
}

function splitSpecsLogic({ specs, splitN, splitIndex, splitFileName, label }) {
  debug('get chunk %o', { specs, splitN, splitIndex })
  /** @type {string[]} absolute spec filenames */
  let splitSpecs

  const cwd = process.cwd()

  let foundSplitFile
  if (splitFileName) {
    debug('loading split file %s', splitFileName)
    try {
      foundSplitFile = findFile(splitFileName)
      if (!foundSplitFile) {
        throw new Error(
          `Could not find ${splitFileName} based on the current working directory ${cwd}`,
        )
      }
      const splitFile = JSON.parse(fs.readFileSync(foundSplitFile, 'utf8'))
      const previousDurations = splitFile.durations
      const averageDuration =
        previousDurations
          .map((item) => item.duration)
          .reduce((sum, duration) => (sum += duration), 0) /
        previousDurations.length
      const specsWithDurations = specs.map((specName) => {
        const relativeSpec = path.relative(cwd, specName)
        const foundInfo = previousDurations.find(
          (item) => item.spec === relativeSpec,
        )
        if (!foundInfo) {
          return {
            specName,
            duration: Math.round(averageDuration),
          }
        } else {
          return {
            specName,
            duration: Math.round(foundInfo.duration),
          }
        }
      })
      debug('splitting by duration %d ways', splitN)
      debug(specsWithDurations)
      const { chunks, sums } = splitByDuration(splitN, specsWithDurations)
      debug('split by duration')
      debug(chunks)
      debug('sums of durations for chunks')
      debug(sums)

      splitSpecs = chunks[splitIndex].map((item) => item.specName)
      console.log(
        '%s split %d specs using durations from %s file',
        label,
        specsWithDurations.length,
        splitFileName,
      )
      console.log(
        '%s approximate total duration for current chunk is %s (plus Cypress overhead)',
        label,
        humanizeDuration(Math.round(sums[splitIndex])),
      )

      printSpecsListWithDurations(chunks[splitIndex])
    } catch (err) {
      console.error('%s Could not split specs by duration', label)
      console.error(err.message)
      console.error('%s splitting as is by name', label)
      splitSpecs = getChunk(specs, splitN, splitIndex)
      printSpecsList(splitSpecs)
    }
  } else {
    splitSpecs = getChunk(specs, splitN, splitIndex)
    printSpecsList(splitSpecs)
  }
  debug('split specs %d batch %d', splitN, splitIndex + 1)
  debug(splitSpecs)
  return { splitSpecs, foundSplitFile }
}

module.exports = {
  getEnvironmentFlag,
  printSpecsList,
  printSpecsListWithDurations,
  splitSpecsLogic,
}
