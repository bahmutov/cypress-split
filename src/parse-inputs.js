// @ts-check

function parseSplitInputs(env = {}, configEnv = {}) {
  let SPLIT = process.env.SPLIT || configEnv.split || configEnv.SPLIT
  let SPLIT_INDEX = process.env.SPLIT_INDEX || configEnv.splitIndex
  let SPLIT_FILE = process.env.SPLIT_FILE || configEnv.splitFile
  let SPLIT_OUTPUT_FILE =
    process.env.SPLIT_OUTPUT_FILE || configEnv.splitOutputFile || SPLIT_FILE

  return { SPLIT, SPLIT_INDEX, SPLIT_FILE, SPLIT_OUTPUT_FILE }
}

module.exports = { parseSplitInputs }
