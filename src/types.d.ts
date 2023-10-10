import type Cypress from 'cypress'

/**
 * Initializes the cypress-split plugin using Cypress config values.
 * @see https://github.com/bahmutov/cypress-split
 */
export default function cypressSplit(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): void
