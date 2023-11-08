const { defineConfig } = require('cypress')
const cypressSplit = require('../../../../src')

module.exports = defineConfig({
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    setupNodeEvents(on, config) {
      console.log('cwd is', process.cwd())
      cypressSplit(on, config)
      // IMPORTANT: return the config object
      return config
    },
  },
})
