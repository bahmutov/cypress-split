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

module.exports = { splitByDuration }
