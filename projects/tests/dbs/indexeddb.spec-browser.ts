import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DataProvider } from '../../core'
import {
  Entity,
  Fields,
  JsonDataProvider,
  JsonEntityIndexedDbStorage,
  Remult,
} from '../../core'
import { allDbTests } from './shared-tests'

async function deleteIndexedDb(name: string) {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

describe('IndexedDB', () => {
  let db: DataProvider
  let remult: Remult
  let storage: JsonEntityIndexedDbStorage
  let dbName: string

  beforeEach(() => {
    dbName = `remult-idb-${crypto.randomUUID()}`
    storage = new JsonEntityIndexedDbStorage(dbName)
    db = new JsonDataProvider(storage)
    remult = new Remult(db)
  })

  afterEach(async () => {
    storage.db?.close()
    storage.db = undefined
    await deleteIndexedDb(dbName)
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

  it('persists across remult instances', async () => {
    @Entity('persist')
    class Persist {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    await remult.repo(Persist).insert({ id: 1, name: 'a' })
    const storage2 = new JsonEntityIndexedDbStorage(dbName)
    const remult2 = new Remult(new JsonDataProvider(storage2))
    expect(await remult2.repo(Persist).find()).toMatchObject([
      { id: 1, name: 'a' },
    ])
    storage2.db?.close()
  })
})
