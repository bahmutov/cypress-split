const { defineConfig } = require('cypress')
const cypressSplit = require('../src')

module.exports = defineConfig({
  e2e: {
    // baseUrl, etc
    supportFile: false,
    fixturesFolder: false,
    excludeSpecPattern: '*.hot-update.js',
    setupNodeEvents(on, config) {
      console.log('cwd is', process.cwd())

      // user sets their own custom specPattern list of specs
      // make sure the list of specs is relative to the folder
      // from where Cypress is launched
      config.specPattern = [
        'cypress/e2e/spec-c.cy.js',
        'cypress/e2e/spec-d.cy.js',
        'cypress/e2e/spec-e.cy.js',
      ]
      cypressSplit(on, config)
      // IMPORTANT: return the config object
      return config
    },
  },
})
