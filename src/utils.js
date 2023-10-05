function getEnvironmentFlag(osVariableName, defaultValue = true) {
  if (!(osVariableName in process.env)) {
    return defaultValue
  }
  const value = process.env[osVariableName].toLowerCase()
  return value === '1' || value === 'true'
}

module.exports = { getEnvironmentFlag }
