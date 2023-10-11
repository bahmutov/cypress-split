import type Cypress from 'cypress'

/**
 * Initializes the cypress-split plugin using Cypress config values.
 * @see https://github.com/bahmutov/cypress-split
 */
interface CypressSplit {
  (
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
  ): void;
}
declare var cypressSplit: CypressSplit
export = cypressSplit
