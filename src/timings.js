if (typeof structuredClone === 'undefined') {
  // older versions of Node might not have "structuredClone"
  // so use a simply polyfill
  structuredClone = (x) => JSON.parse(JSON.stringify(x))
}

/**
 * Split the list of items into "n" lists by "duration" property
 * in each item. Sorts the list first, then round-robin fills
 * the lists. Put the item into the list with the smallest sum.
 * @param {number} n Number of output lists
 * @returns {any}
 */
function splitByDuration(n, list) {
  const result = []
  const sums = []
  for (let k = 0; k < n; k += 1) {
    result.push([])
    sums.push(0)
  }
  const sorted = list.sort((a, b) => b.duration - a.duration)
  sorted.forEach((item) => {
    const smallestIndex = sums.reduce((currentSmallestIndex, value, index) => {
      return value < sums[currentSmallestIndex] ? index : currentSmallestIndex
    }, 0)
    result[smallestIndex].push(item)
    sums[smallestIndex] += item.duration
  })

  // console.table(result)
  // console.table(sums)
  return { chunks: result, sums }
}

/**
 * Compares the original timings file contents with the new spec timings.
 * Returns true if there are differences and the new timings should be saved.
 * @param {object} originalTimingsJson JSON loaded from the timings file
 * @param {object} newTimingsJson new spec timings
 * @param {number} maxTimeDifference Max relative time difference for a spec 0 to 1
 * @returns {boolean} if found differences
 */
function hasTimeDifferences(
  originalTimingsJson,
  newTimingsJson,
  maxTimeDifference,
) {
  // first check if there are new specs
  const originalSpecNames = originalTimingsJson.durations.map(
    (item) => item.spec,
  )
  const newSpecNames = newTimingsJson.durations.map((item) => item.spec)
  if (newSpecNames.some((specName) => !originalSpecNames.includes(specName))) {
    // found new spec, must update the timings file
    return true
  }

  return newTimingsJson.durations.some((item) => {
    const prev = originalTimingsJson.durations.find(
      (curr) => curr.spec === item.spec,
    )
    if (!prev) {
      // should not happen, all specs should be there
      return false
    }
    // guard against zero
    const prevDuration = prev.duration || 1
    const relativeChange =
      Math.abs(prev.duration - item.duration) / prevDuration
    return relativeChange > maxTimeDifference
  })
}

/**
 * Merge previous timings with possible new or changed timings
 * into a new object to be saved.
 * @param {object} prevTimings JSON loaded from the timings file
 * @param {object} currTimings new spec timings
 * @returns {object} Merged object to be saved to the timings file
 */
function mergeTimings(prevTimings, currTimings) {
  const merged = structuredClone(prevTimings)
  currTimings.durations.forEach((item) => {
    const found = merged.durations.find((x) => x.spec === item.spec)
    if (found) {
      Object.assign(found, item)
    } else {
      merged.durations.push(item)
    }
  })
  merged.durations.sort((a, b) => a.spec.localeCompare(b.spec))
  return merged
}

const noop = () => {}

/**
 * Merged loaded timings from multiple files into a combined result.
 * @param {object[]} timings Loaded timings
 * @param {function} debug optional debug function
 */
function mergeSplitTimings(timings, debug = noop) {
  // [spec relative name]: duration
  const specResults = {}

  debug('merging %d timings', timings.length)
  timings.forEach((json, k) => {
    debug('timings list %d with %d entries', k + 1, json.durations.length)
  })

  timings.forEach((json) => {
    json.durations.forEach((item) => {
      if (!specResults[item.spec]) {
        specResults[item.spec] = item.duration
      } else {
        // average the durations
        const maxDuration = (item.duration + specResults[item.spec]) / 2
        specResults[item.spec] = maxDuration
      }
    })
  })

  const result = {
    durations: [],
  }
  Object.keys(specResults).forEach((spec) => {
    result.durations.push({
      spec,
      duration: specResults[spec],
    })
  })

  return result
}

module.exports = {
  splitByDuration,
  hasTimeDifferences,
  mergeTimings,
  mergeSplitTimings,
}
