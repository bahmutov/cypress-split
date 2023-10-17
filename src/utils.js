// @ts-check

const cTable = require('console.table')
const path = require('path')
const humanizeDuration = require('humanize-duration')

function getEnvironmentFlag(osVariableName, defaultValue = true) {
  if (!(osVariableName in process.env)) {
    return defaultValue
  }
  const value = process.env[osVariableName].toLowerCase()
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

module.exports = {
  getEnvironmentFlag,
  printSpecsList,
  printSpecsListWithDurations,
}
