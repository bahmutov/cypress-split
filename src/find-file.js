// @ts-check

const debug = require('debug')('cypress-split')
const exists = require('fs').existsSync
const { join, normalize } = require('path')

function isGitRootFolder(folder) {
  const gitRoot = '.git'
  const full = join(folder, gitRoot)
  return exists(full)
}

/**
 * Finds the file using the current working directory or its parent
 * directories up to the Git root folder.
 * @param {string} filename File to find
 * @returns {string|undefined} found file path or undefined
 */
function findFile(filename) {
  if (!filename) {
    throw new Error('Missing the filename')
  }

  let currentFolder = process.cwd()
  let found

  while (true) {
    const maybePath = join(currentFolder, filename)
    if (exists(maybePath)) {
      found = maybePath
      debug('found file %s', found)
      break
    }
    if (isGitRootFolder(currentFolder)) {
      debug('reached git root folder %s', currentFolder)
      debug('but could not find %s', filename)
      break
    }
    const parent = normalize(join(currentFolder, '..'))
    if (parent === currentFolder) {
      debug('reached top level folder %s', currentFolder)
      debug('but could not find tool %s', filename)
      break
    }
    currentFolder = parent
  }
  return found
}

module.exports = { findFile }
