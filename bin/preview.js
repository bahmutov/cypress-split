#!/usr/bin/env node

const arg = require('arg')
const debug = require('debug')('cypress-split')
const label = 'cypress-split-preview'

// get the split indices
// get the specs and split them up (using the names or timings)
