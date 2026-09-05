import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  Filter,
  IndexedDbDataProvider,
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

  describe('fetch by id filter', () => {
    @Entity('fetch_items')
    class Item {
      @Fields.integer()
      id = 0
      @Fields.string()
      title = ''
    }

    async function seed() {
      const repo = remult.repo(Item)
      await repo.insert([
        { id: 1, title: 'a' },
        { id: 2, title: 'b' },
        { id: 3, title: 'c' },
      ])
      return repo
    }

    /** extra `title: 'nope'` would empty find() — raw rows show if we over-fetched */
    async function raw(where: { id?: any; $or?: any }) {
      const repo = remult.repo(Item)
      return db.fetchRows(
        repo.metadata,
        Filter.fromEntityFilter(repo.metadata, { title: 'nope', ...where }),
      )
    }

    function ids(rows: any[]) {
      return rows.map((r) => r.id)
    }

    it('eq', async () => {
      await seed()
      expect(ids(await raw({ id: 1 }))).toEqual([1])
      expect(db.lastFetch).toMatchObject({ type: 'keys', keys: [1] })
    })

    it('in', async () => {
      await seed()
      expect(ids(await raw({ id: [1, 3] }))).toEqual([1, 3])
      expect(db.lastFetch).toMatchObject({ type: 'keys', keys: [1, 3] })
    })

    it('or of eq', async () => {
      await seed()
      expect(ids(await raw({ $or: [{ id: 1 }, { id: 2 }] }))).toEqual([1, 2])
      expect(db.lastFetch).toMatchObject({ type: 'keys', keys: [1, 2] })
    })

    it('gt', async () => {
      await seed()
      expect(ids(await raw({ id: { $gt: 1 } }))).toEqual([2, 3])
      expect(db.lastFetch).toMatchObject({ type: 'range' })
      const range = db.lastFetch as { type: 'range'; range: IDBKeyRange }
      expect(range.range.lower).toBe(1)
      expect(range.range.lowerOpen).toBe(true)
    })

    it('lt', async () => {
      await seed()
      expect(ids(await raw({ id: { $lt: 3 } }))).toEqual([1, 2])
      const range = db.lastFetch as { type: 'range'; range: IDBKeyRange }
      expect(range.range.upper).toBe(3)
      expect(range.range.upperOpen).toBe(true)
    })

    it('gte + lte', async () => {
      await seed()
      expect(ids(await raw({ id: { $gte: 2, $lte: 3 } }))).toEqual([2, 3])
      const range = db.lastFetch as { type: 'range'; range: IDBKeyRange }
      expect(range.range.lower).toBe(2)
      expect(range.range.lowerOpen).toBe(false)
      expect(range.range.upper).toBe(3)
      expect(range.range.upperOpen).toBe(false)
    })

    it('ne is a full scan (over-fetch visible)', async () => {
      await seed()
      expect(ids(await raw({ id: { $ne: 1 } }))).toEqual([1, 2, 3])
      expect(db.lastFetch).toEqual({ type: 'all' })
    })

    it('no id is a full scan (over-fetch visible)', async () => {
      await seed()
      expect(ids(await raw({}))).toEqual([1, 2, 3])
      expect(db.lastFetch).toEqual({ type: 'all' })
    })

    it('or of ranges fetches each and merges', async () => {
      await seed()
      expect(
        ids(await raw({ $or: [{ id: { $gt: 2 } }, { id: { $lt: 2 } }] })).sort(),
      ).toEqual([1, 3])
      expect(db.lastFetch?.type).toBe('or')
      expect((db.lastFetch as { parts: unknown[] }).parts).toHaveLength(2)
    })

    it('or of eq and range', async () => {
      await seed()
      expect(
        ids(await raw({ $or: [{ id: 1 }, { id: { $gt: 2 } }] })).sort(),
      ).toEqual([1, 3])
      expect(db.lastFetch?.type).toBe('or')
    })

    it('or with a branch that is not id-narrowed is a full scan', async () => {
      await seed()
      expect(
        ids(await raw({ $or: [{ id: { $gt: 2 } }, { title: 'a' }] })),
      ).toEqual([1, 2, 3])
      expect(db.lastFetch).toEqual({ type: 'all' })
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
