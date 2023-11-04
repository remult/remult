import { beforeEach, describe } from 'vitest'
import type { DataProvider } from '../../core'
import { InMemoryDataProvider, Remult } from '../../core'
import { allDbTests } from './shared-tests'

describe('In Memory Tests', () => {
  var db: DataProvider
  let remult: Remult

  beforeEach(() => {
    db = new InMemoryDataProvider()
    remult = new Remult(db)
  })
  allDbTests(
    {
      getDb() {
        return db
      },
      getRemult() {
        return remult
      },
      createEntity: async (entity) => remult.repo(entity),
    },
    {
      excludeTransactions: true,
      excludeLiveQuery: true,
    },
  )
})
