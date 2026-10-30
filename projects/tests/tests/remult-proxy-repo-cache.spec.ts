import { setFlagsFromString } from 'v8'
import { runInNewContext } from 'vm'
import { describe, expect, it } from 'vitest'
import { repo } from '../../core'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database'
import { Categories } from './remult-3-entities'

const gc: () => void = (() => {
  setFlagsFromString('--expose-gc')
  return runInNewContext('gc')
})()

async function collectGarbage() {
  for (let i = 0; i < 5; i++) {
    gc()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

// allocate in a separate function so no stack slot of the test frame
// keeps the dataProvider alive
function cacheRepoWithThrowawayDataProvider() {
  const dataProvider = new InMemoryDataProvider()
  repo(Categories, dataProvider)
  return new WeakRef(dataProvider)
}

describe('remult proxy repoCache', () => {
  it('does not retain a dataProvider passed to the global repo()', async () => {
    const ref = cacheRepoWithThrowawayDataProvider()
    await collectGarbage()
    expect(ref.deref()).toBeUndefined()
  })
  it('returns the same instance for the same dataProvider', () => {
    const dataProvider = new InMemoryDataProvider()
    expect(repo(Categories, dataProvider)).toBe(repo(Categories, dataProvider))
  })
  it('returns the same instance when no dataProvider is passed', () => {
    expect(repo(Categories)).toBe(repo(Categories))
  })
})
