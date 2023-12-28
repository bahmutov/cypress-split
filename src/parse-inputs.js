function parseSplitInputs(env = {}, configEnv = {}) {
  let SPLIT = process.env.SPLIT || config.env.split || config.env.SPLIT
  let SPLIT_INDEX = process.env.SPLIT_INDEX || config.env.splitIndex
  let SPLIT_FILE = process.env.SPLIT_FILE || config.env.splitFile
  let SPLIT_OUTPUT_FILE =
    process.env.SPLIT_OUTPUT_FILE || config.env.splitOutputFile || SPLIT_FILE

  return { SPLIT, SPLIT_INDEX, SPLIT_FILE, SPLIT_OUTPUT_FILE }
}

module.exports = { parseSplitInputs }
