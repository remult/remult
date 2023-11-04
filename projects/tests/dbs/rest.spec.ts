import { beforeAll, beforeEach, describe } from 'vitest'
import { createPostgresConnection } from '../../core/postgres'
import type { DataProvider, SqlDatabase } from '../../core'
import { InMemoryDataProvider, Remult } from '../../core'
import type { ClassType } from '../../core/classType'
import { allDbTests } from './shared-tests'
import { MockRestDataProvider } from '../tests/testHelper'

describe('Rest', () => {
  var db: DataProvider
  let remult: Remult

  beforeEach(() => {
    let r = new Remult()
    r.dataProvider = new InMemoryDataProvider()
    db = new MockRestDataProvider(r)
    remult = new Remult()
    remult.dataProvider = db
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
