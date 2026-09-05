import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Entity, Fields, IndexedDbDataProvider, Remult } from '../../core'
import { allDbTests } from './shared-tests'

async function deleteIndexedDb(name: string) {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

function idbGet(db: IDBDatabase, storeName: string, key: IDBValidKey) {
  return new Promise<any>((resolve, reject) => {
    const req = db.transaction(storeName).objectStore(storeName).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

describe('IndexedDB Data Provider', () => {
  let db: IndexedDbDataProvider
  let remult: Remult
  let dbName: string

  beforeEach(() => {
    dbName = `remult-idb-native-${crypto.randomUUID()}`
    db = new IndexedDbDataProvider(dbName)
    remult = new Remult(db)
  })

  afterEach(async () => {
    db.close()
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
      createEntity: async (entity) => {
        const repo = remult.repo(entity)
        await db.ensureSchema([repo.metadata])
        return repo
      },
    },
    {
      excludeTransactions: true,
      excludeLiveQuery: true,
    },
  )

  it('uses a store per entity', async () => {
    @Entity('orders')
    class Order {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    @Entity('customers')
    class Customer {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    await remult.repo(Order).insert({ id: 1, name: 'o' })
    await remult.repo(Customer).insert({ id: 1, name: 'c' })
    const names = [...db.db!.objectStoreNames]
    expect(names).toEqual(expect.arrayContaining(['orders', 'customers']))
    expect(await remult.repo(Order).find()).toMatchObject([
      { id: 1, name: 'o' },
    ])
    expect(await remult.repo(Customer).find()).toMatchObject([
      { id: 1, name: 'c' },
    ])
  })

  it('stores each row by id', async () => {
    @Entity('items')
    class Item {
      @Fields.integer()
      id = 0
      @Fields.string()
      title = ''
    }
    const repo = remult.repo(Item)
    await repo.insert({ id: 1, title: 'a' })
    await repo.insert({ id: 2, title: 'b' })
    expect(await idbGet(db.db!, 'items', 1)).toMatchObject({
      id: 1,
      title: 'a',
    })
    expect(await idbGet(db.db!, 'items', 2)).toMatchObject({
      id: 2,
      title: 'b',
    })
    await repo.update(1, { title: 'aa' })
    expect(await idbGet(db.db!, 'items', 1)).toMatchObject({
      id: 1,
      title: 'aa',
    })
    expect(await idbGet(db.db!, 'items', 2)).toMatchObject({
      id: 2,
      title: 'b',
    })
    await repo.delete(2)
    expect(await idbGet(db.db!, 'items', 2)).toBeUndefined()
    expect(await idbGet(db.db!, 'items', 1)).toMatchObject({
      id: 1,
      title: 'aa',
    })
  })

  it('persists across remult instances', async () => {
    @Entity('persist')
    class Persist {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    await remult.repo(Persist).insert({ id: 1, name: 'a' })
    db.close()
    const db2 = new IndexedDbDataProvider(dbName)
    const remult2 = new Remult(db2)
    expect(await remult2.repo(Persist).find()).toMatchObject([
      { id: 1, name: 'a' },
    ])
    db2.close()
  })
})
