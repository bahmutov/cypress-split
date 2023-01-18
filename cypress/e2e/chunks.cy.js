const { getChunk, chunkify } = require('../../src/chunk')

describe('getChunk', () => {
  it('splits 4 specs across 4 machines', () => {
    const specs = [1, 2, 3, 4]
    let chunk = getChunk(specs, 4, 0)
    expect(chunk, 'chunk 0').to.deep.equal([1])
    chunk = getChunk(specs, 4, 1)
    expect(chunk, 'chunk 1').to.deep.equal([2])
    chunk = getChunk(specs, 4, 2)
    expect(chunk, 'chunk 2').to.deep.equal([3])
    chunk = getChunk(specs, 4, 3)
    expect(chunk, 'chunk 3').to.deep.equal([4])
  })

  it('splits 5 specs across 4 machines', () => {
    const specs = [1, 2, 3, 4, 5]
    let chunk = getChunk(specs, 4, 0)
    expect(chunk, 'chunk 0').to.deep.equal([1, 2])
    chunk = getChunk(specs, 4, 1)
    expect(chunk, 'chunk 1').to.deep.equal([3])
    chunk = getChunk(specs, 4, 2)
    expect(chunk, 'chunk 2').to.deep.equal([4])
    chunk = getChunk(specs, 4, 3)
    expect(chunk, 'chunk 3').to.deep.equal([5])
  })

  it('splits 1 spec across 2 machines', () => {
    const specs = [1]
    let chunk = getChunk(specs, 2, 0)
    expect(chunk, 'chunk 0').to.deep.equal([1])
    chunk = getChunk(specs, 2, 1)
    expect(chunk, 'chunk 1').to.deep.equal(undefined)
  })
})

describe('chunkify', () => {
  it('splits 5 specs across 1 machine', () => {
    const specs = [1, 2, 3, 4, 5]
    const chunks = chunkify(specs, 1, true)
    expect(chunks).to.deep.equal([[1, 2, 3, 4, 5]])
  })

  it('splits 5 specs across 2 machines', () => {
    const specs = [1, 2, 3, 4, 5]
    const chunks = chunkify(specs, 2, true)
    expect(chunks).to.deep.equal([
      [1, 2, 3],
      [4, 5],
    ])
  })

  it('splits 5 specs across 6 machines', () => {
    const specs = [1, 2, 3, 4, 5]
    const chunks = chunkify(specs, 6, true)
    expect(chunks).to.deep.equal([[1], [2], [3], [4], [5]])
  })
})
