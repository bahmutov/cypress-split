const { defineConfig } = require('cypress')
const cypressSplit = require('../../../src')

module.exports = defineConfig({
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    // Cypress likes path with respect to the root folder, sigh
    specPattern: 'examples/my-app/tests/e2e-tests/*.cy.js',
    setupNodeEvents(on, config) {
      console.log('cwd is', process.cwd())
      cypressSplit(on, config)
      // IMPORTANT: return the config object
      return config
    },
  },
})
