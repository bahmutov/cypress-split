// @ts-check

// https://stackoverflow.com/questions/8188548/splitting-a-js-array-into-n-arrays
function chunkify(a, n, balanced) {
  if (n < 2) return [a]

  var len = a.length,
    out = [],
    i = 0,
    size

  if (len % n === 0) {
    size = Math.floor(len / n)
    while (i < len) {
      out.push(a.slice(i, (i += size)))
    }
  } else if (balanced) {
    while (i < len) {
      size = Math.ceil((len - i) / n--)
      out.push(a.slice(i, (i += size)))
    }
  } else {
    n--
    size = Math.floor(len / n)
    if (len % size === 0) size--
    while (i < size * n) {
      out.push(a.slice(i, (i += size)))
    }
    out.push(a.slice(size * n))
  }

  return out
}

/**
 * Splits the given array across N "buckets"
 * and returns the bucket with the index k.
 * Note: a bucket can be empty!
 */
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

  const chunks = chunkify(values, totalChunks, true)
  return chunks[chunkIndex] || []
}

module.exports = { getChunk, chunkify }
