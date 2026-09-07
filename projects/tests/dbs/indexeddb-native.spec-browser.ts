import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  Filter,
  IndexedDbDataProvider,
  IndexedDbIndexBuilder,
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

function idbPut(db: IDBDatabase, storeName: string, value: any) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(storeName).put(value)
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
    expect(names).not.toContain('__remult_keys')
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

describe('IndexedDB indexes', () => {
  @Entity('idx_items')
  class Item {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
    @Fields.string()
    status = ''
    @Fields.string()
    tag = ''
  }

  let db: IndexedDbDataProvider
  let remult: Remult
  let dbName: string

  beforeEach(() => {
    dbName = `remult-idb-idx-${crypto.randomUUID()}`
    db = new IndexedDbDataProvider(dbName, {
      indexes: (x) => x.ensureIndexes(Item, ['title', ['status', 'title']]),
    })
    remult = new Remult(db)
  })

  afterEach(async () => {
    db.close()
    await deleteIndexedDb(dbName)
  })

  async function seed() {
    const repo = remult.repo(Item)
    await repo.insert([
      { id: 1, title: 'a', status: 'open', tag: 'x' },
      { id: 2, title: 'b', status: 'open', tag: 'y' },
      { id: 3, title: 'a', status: 'done', tag: 'z' },
    ])
    return repo
  }

  async function raw(where: { title?: any; status?: any; $or?: any }) {
    const repo = remult.repo(Item)
    return db.fetchRows(
      repo.metadata,
      Filter.fromEntityFilter(repo.metadata, { tag: 'nope', ...where }),
    )
  }

  function ids(rows: any[]) {
    return rows.map((r) => r.id).sort((a, b) => a - b)
  }

  function indexNames() {
    const store = db
      .db!.transaction('idx_items')
      .objectStore('idx_items')
    return [...store.indexNames]
  }

  it('creates declared indexes', async () => {
    await seed()
    expect(indexNames()).toEqual(expect.arrayContaining(['title', 'status_title']))
  })

  it('eq on title uses the title index', async () => {
    await seed()
    expect(ids(await raw({ title: 'a' }))).toEqual([1, 3])
    expect(db.lastFetch).toMatchObject({
      type: 'keys',
      keys: ['a'],
      index: 'title',
    })
  })

  it('in on title uses the title index', async () => {
    await seed()
    expect(ids(await raw({ title: ['a', 'b'] }))).toEqual([1, 2, 3])
    expect(db.lastFetch).toMatchObject({ type: 'keys', index: 'title' })
  })

  it('gt on title uses a range on the title index', async () => {
    await seed()
    expect(ids(await raw({ title: { $gt: 'a' } }))).toEqual([2])
    expect(db.lastFetch).toMatchObject({ type: 'range', index: 'title' })
  })

  it('or of titles uses the title index', async () => {
    await seed()
    expect(
      ids(await raw({ $or: [{ title: 'a' }, { title: 'b' }] })),
    ).toEqual([1, 2, 3])
    expect(db.lastFetch).toMatchObject({ type: 'keys', index: 'title' })
  })

  it('eq on status+title uses the compound index', async () => {
    await seed()
    expect(ids(await raw({ status: 'open', title: 'a' }))).toEqual([1])
    expect(db.lastFetch).toMatchObject({
      type: 'keys',
      keys: [['open', 'a']],
      index: 'status_title',
    })
  })
})

describe('IndexedDB encryption', () => {
  @Entity('enc_tasks')
  class Task {
    @Fields.integer()
    id = 0
    @Fields.string()
    status = ''
    @Fields.string()
    secret = ''
    @Fields.createdAt()
    createdAt = new Date()
  }

  let db: IndexedDbDataProvider
  let remult: Remult
  let dbName: string

  function encOptions() {
    return {
      indexes: (x: IndexedDbIndexBuilder) =>
        x.ensureIndexes(Task, ['status', 'createdAt']),
      encrypt: true as const,
    }
  }

  beforeEach(() => {
    dbName = `remult-idb-enc-${crypto.randomUUID()}`
    db = new IndexedDbDataProvider(dbName, encOptions())
    remult = new Remult(db)
  })

  afterEach(async () => {
    db.close()
    await deleteIndexedDb(dbName)
  })

  it('encrypts non-indexed fields at rest and decrypts on find', async () => {
    const createdAt = new Date('2024-01-02T00:00:00.000Z')
    await remult.repo(Task).insert({
      id: 1,
      status: 'open',
      secret: 's3cret',
      createdAt,
    })
    const raw = await idbGet(db.db!, 'enc_tasks', 1)
    expect(raw._enc).toBeInstanceOf(ArrayBuffer)
    expect(raw._iv).toHaveLength(12)
    expect(raw.id).toBe(1)
    expect(raw.status).toBe('open')
    expect(raw.createdAt).toBeTruthy()
    expect(raw.secret).toBeUndefined()
    expect(JSON.stringify(raw)).not.toContain('s3cret')
    const dek = await idbGet(db.db!, '__remult_keys', 'dek')
    expect(dek.key).toBeInstanceOf(CryptoKey)
    expect(dek.key.extractable).toBe(false)
    expect(await remult.repo(Task).find()).toMatchObject([
      { id: 1, status: 'open', secret: 's3cret' },
    ])
  })

  it('find by indexed field still prefetches', async () => {
    const repo = remult.repo(Task)
    await repo.insert([
      { id: 1, status: 'open', secret: 'a' },
      { id: 2, status: 'done', secret: 'b' },
    ])
    const rows = await db.fetchRows(
      repo.metadata,
      Filter.fromEntityFilter(repo.metadata, { status: 'open', secret: 'nope' }),
    )
    expect(rows.map((r) => r.id)).toEqual([1])
    expect(db.lastFetch).toMatchObject({
      type: 'keys',
      keys: ['open'],
      index: 'status',
    })
    expect(await repo.find({ where: { status: 'open' } })).toMatchObject([
      { id: 1, secret: 'a' },
    ])
  })

  it('auto key persists across provider instances', async () => {
    await remult.repo(Task).insert({ id: 1, status: 'open', secret: 'keep' })
    db.close()
    const db2 = new IndexedDbDataProvider(dbName, encOptions())
    const remult2 = new Remult(db2)
    expect(await remult2.repo(Task).find()).toMatchObject([
      { id: 1, status: 'open', secret: 'keep' },
    ])
    db2.close()
  })

  it('reads unencrypted rows and encrypts on write', async () => {
    db.close()
    await deleteIndexedDb(dbName)
    const plain = new IndexedDbDataProvider(dbName)
    const remultPlain = new Remult(plain)
    await remultPlain.repo(Task).insert({
      id: 1,
      status: 'open',
      secret: 'old',
    })
    plain.close()
    db = new IndexedDbDataProvider(dbName, encOptions())
    remult = new Remult(db)
    expect(await remult.repo(Task).find()).toMatchObject([
      { id: 1, secret: 'old' },
    ])
    await remult.repo(Task).update(1, { secret: 'new' })
    const raw = await idbGet(db.db!, 'enc_tasks', 1)
    expect(raw._enc).toBeInstanceOf(ArrayBuffer)
    expect(raw.secret).toBeUndefined()
    expect(await remult.repo(Task).findId(1)).toMatchObject({ secret: 'new' })
  })

  it('throws if decrypt fails', async () => {
    await remult.repo(Task).insert({ id: 1, status: 'open', secret: 'x' })
    const raw = await idbGet(db.db!, 'enc_tasks', 1)
    raw._enc = new Uint8Array([1, 2, 3, 4]).buffer
    await idbPut(db.db!, 'enc_tasks', raw)
    await expect(remult.repo(Task).find()).rejects.toThrow(
      /Failed to decrypt IndexedDB row/,
    )
  })

  it('uses getEncryptionKey and skips the key store', async () => {
    db.close()
    await deleteIndexedDb(dbName)
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
    db = new IndexedDbDataProvider(dbName, {
      ...encOptions(),
      getEncryptionKey: () => key,
    })
    remult = new Remult(db)
    await remult.repo(Task).insert({ id: 1, status: 'open', secret: 'k' })
    expect([...db.db!.objectStoreNames]).not.toContain('__remult_keys')
    expect(await remult.repo(Task).find()).toMatchObject([{ secret: 'k' }])
  })
})

describe('IndexedDB encryption (all db tests)', () => {
  let db: IndexedDbDataProvider
  let remult: Remult
  let dbName: string

  beforeEach(() => {
    dbName = `remult-idb-enc-all-${crypto.randomUUID()}`
    db = new IndexedDbDataProvider(dbName, { encrypt: true })
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
})
