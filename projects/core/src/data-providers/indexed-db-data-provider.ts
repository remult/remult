import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  EntityDataProviderGroupByOptions,
} from '../data-interfaces.js'
import type { EntityDbNamesBase } from '../filter/filter-consumer-bridge-to-sql-request.js'
import {
  dbNamesOf,
  isDbReadonly,
} from '../filter/filter-consumer-bridge-to-sql-request.js'
import type { ClassType } from '../../classType.js'
import type { FieldMetadata } from '../column-interfaces.js'
import type { Filter, FilterConsumer } from '../filter/filter-interfaces.js'
import type { EntityMetadata, MembersOnly } from '../remult3/remult3.js'
import { isAutoIncrement } from '../remult3/RepositoryImplementation.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export type IndexedDbIndexDef<entityType> =
  | keyof MembersOnly<entityType>
  | readonly (keyof MembersOnly<entityType>)[]

export class IndexedDbIndexBuilder {
  //@internal
  readonly entries: {
    entity: ClassType<any>
    indexes: IndexedDbIndexDef<any>[]
  }[] = []

  ensureIndexes<entityType>(
    entity: ClassType<entityType>,
    indexes: readonly IndexedDbIndexDef<entityType>[],
  ): this {
    this.entries.push({ entity, indexes: [...indexes] })
    return this
  }
}

export type IndexedDbDataProviderOptions = {
  indexes?: (x: IndexedDbIndexBuilder) => void
}

export class IndexedDbDataProvider implements DataProvider {
  //@internal
  private declaredIndexes: IndexedDbIndexBuilder['entries'] = []

  constructor(
    private dbName: string = 'remult',
    options?: IndexedDbDataProviderOptions,
  ) {
    if (options?.indexes) {
      const builder = new IndexedDbIndexBuilder()
      options.indexes(builder)
      this.declaredIndexes = builder.entries
    }
  }

  //@internal
  db?: IDBDatabase
  //@internal
  lastFetch?: IdbPrefetch
  //@internal
  private tail: Promise<void> = Promise.resolve()

  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    return new IndexedDbEntityDataProvider(this, entity)
  }

  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    await action(this)
  }

  async ensureSchema(entities: EntityMetadata[]): Promise<void> {
    await this.enqueue(() => this.ensureStores(entities))
  }

  close() {
    this.db?.close()
    this.db = undefined
  }

  //@internal
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.tail.then(fn, fn)
    this.tail = run.then(
      () => {},
      () => {},
    )
    return run
  }

  //@internal
  async runWithRows<T>(
    entity: EntityMetadata,
    where: Filter | undefined,
    what: (dp: ArrayEntityDataProvider) => Promise<T>,
  ): Promise<T> {
    return this.enqueue(async () => {
      await this.ensureStores([entity])
      const rows = await this.loadRows(entity, where)
      return what(new ArrayEntityDataProvider(entity, () => rows))
    })
  }

  //@internal
  async fetchRows(entity: EntityMetadata, where?: Filter) {
    return this.enqueue(async () => {
      await this.ensureStores([entity])
      return this.loadRows(entity, where)
    })
  }

  //@internal
  private async loadRows(entity: EntityMetadata, where?: Filter) {
    const storeName = storeNameOf(entity)
    const prefetch = await idbPrefetchFromFilter(
      entity,
      where,
      this.storeIndexes(storeName),
    )
    this.lastFetch = prefetch
    if (prefetch.type === 'all') return this.getAll(storeName)
    const ops = prefetch.type === 'or' ? prefetch.parts : [prefetch]
    return this.fetchOps(storeName, entity, ops)
  }

  //@internal
  private storeIndexes(storeName: string): IdbIndexInfo[] {
    const db = this.db
    if (!db?.objectStoreNames.contains(storeName)) return []
    const store = db.transaction(storeName).objectStore(storeName)
    const names = store.indexNames
    const result: IdbIndexInfo[] = []
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      result.push({
        name,
        keyPath: store.index(name).keyPath,
      })
    }
    return result
  }

  //@internal
  private indexesFor(entity: EntityMetadata): IndexedDbIndexDef<any>[] {
    return this.declaredIndexes
      .filter((e) => e.entity === entity.entityType)
      .flatMap((e) => e.indexes)
  }

  //@internal
  async ensureStores(entities: EntityMetadata[]) {
    const wanted = await Promise.all(
      entities.map(async (entity) => {
        const keyPath = await keyPathOf(entity)
        return {
          name: storeNameOf(entity),
          keyPath,
          autoIncrement: isAutoIncrement(entity.idMetadata.field),
          indexes: await resolveIndexDefs(
            entity,
            this.indexesFor(entity),
            keyPath,
          ),
        }
      }),
    )
    const db = await this.open()
    const needsUpgrade = wanted.some((w) => {
      if (!db.objectStoreNames.contains(w.name)) return true
      const existing = this.storeIndexes(w.name).map((i) => i.name)
      return w.indexes.some((idx) => !existing.includes(idx.name))
    })
    if (!needsUpgrade) return

    const nextVersion = db.version + 1
    this.forget(db)
    db.close()

    await this.open(nextVersion, (upgradeDb, tx) => {
      for (const { name, keyPath, autoIncrement, indexes } of wanted) {
        const store = upgradeDb.objectStoreNames.contains(name)
          ? tx.objectStore(name)
          : upgradeDb.createObjectStore(name, { keyPath, autoIncrement })
        for (const idx of indexes) {
          if (!store.indexNames.contains(idx.name)) {
            store.createIndex(idx.name, idx.keyPath)
          }
        }
      }
    })
  }

  //@internal
  private forget(db: IDBDatabase) {
    if (this.db === db) this.db = undefined
  }

  //@internal
  private async open(
    version?: number,
    upgrade?: (db: IDBDatabase, tx: IDBTransaction) => void,
  ): Promise<IDBDatabase> {
    if (this.db && version == null) return this.db
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request =
        version == null
          ? indexedDB.open(this.dbName)
          : indexedDB.open(this.dbName, version)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () =>
        upgrade?.(request.result, request.transaction!)
      request.onsuccess = () => {
        const db = request.result
        const forget = () => this.forget(db)
        db.onclose = forget
        db.onversionchange = () => {
          db.close()
          forget()
        }
        resolve(db)
      }
    })
    return this.db
  }

  //@internal
  private getAll(storeName: string, range?: IDBKeyRange): Promise<any[]> {
    return this.withStore(storeName, 'readonly', (store) =>
      idbReq(range ? store.getAll(range) : store.getAll()),
    )
  }

  //@internal
  private fetchOps(
    storeName: string,
    entity: EntityMetadata,
    ops: IdbFetchOp[],
  ): Promise<any[]> {
    return this.withStore(storeName, 'readonly', async (store) => {
      const idKey = entity.idMetadata.fields[0].key
      const seen = new Set<string>()
      const rows: any[] = []
      for (const op of ops) {
        const source = op.index ? store.index(op.index) : store
        const chunk =
          op.type === 'keys'
            ? op.index
              ? (
                  await Promise.all(
                    op.keys.map((key) => idbReq(source.getAll(key))),
                  )
                ).flat()
              : await Promise.all(op.keys.map((key) => idbReq(store.get(key))))
            : await idbReq(source.getAll(op.range))
        for (const row of chunk) {
          if (row == null) continue
          const k = JSON.stringify(row[idKey])
          if (seen.has(k)) continue
          seen.add(k)
          rows.push(row)
        }
      }
      return rows
    })
  }

  //@internal
  withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tx = this.db!.transaction(storeName, mode)
      let result: T
      let opErr: unknown
      tx.oncomplete = () => {
        if (opErr) reject(opErr)
        else resolve(result)
      }
      tx.onabort = () => reject(opErr ?? tx.error)
      tx.onerror = () => reject(opErr ?? tx.error)
      Promise.resolve(op(tx.objectStore(storeName))).then(
        (r) => {
          result = r
        },
        (e) => {
          opErr = e
          try {
            tx.abort()
          } catch {
            /* already aborted */
          }
        },
      )
    })
  }
}

class IndexedDbEntityDataProvider implements EntityDataProvider {
  constructor(
    private provider: IndexedDbDataProvider,
    private entity: EntityMetadata,
  ) {}

  find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    return this.provider.runWithRows(this.entity, options?.where, (dp) =>
      dp.find(options),
    )
  }
  count(where: Filter): Promise<number> {
    return this.provider.runWithRows(this.entity, where, (dp) => dp.count(where))
  }
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return this.provider.runWithRows(this.entity, options?.where, (dp) =>
      dp.groupBy(options),
    )
  }

  insert(data: any[]): Promise<any[]> {
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      const helper = new ArrayEntityDataProvider(this.entity, () => [])
      const names = await helper.init()
      const auto = isAutoIncrement(this.entity.idMetadata.field)
      const idName = names.$dbNameOf(this.entity.idMetadata.field)
      const rows = data.map((row) => {
        const json = helper.translateToJson(row, names)
        helper.verifyThatRowHasAllNotNullColumns(json, names)
        if (auto) delete json[idName]
        return json
      })
      return this.provider.withStore(
        storeNameOf(this.entity),
        'readwrite',
        async (store) => {
          const result: any[] = []
          for (const json of rows) {
            try {
              const key = await idbReq(store.add(json))
              if (auto) json[idName] = json[idName] ?? key
            } catch (e: any) {
              if (e?.name === 'ConstraintError') throw Error('id already exists')
              throw e
            }
            result.push(helper.translateFromJson(json, names))
          }
          return result
        },
      )
    })
  }

  update(id: any, data: any): Promise<any> {
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      const helper = new ArrayEntityDataProvider(this.entity, () => [])
      const names = await helper.init()
      const key = toIdbKey(this.entity, id)
      return this.provider.withStore(
        storeNameOf(this.entity),
        'readwrite',
        async (store) => {
          const existing = await idbReq(store.get(key))
          if (existing == null)
            throw new Error(
              `Couldn't find row with id "${id}" in entity "${this.entity.key}" to update`,
            )
          const json = { ...existing }
          const keys = Object.keys(data)
          for (const f of this.entity.fields) {
            if (!isDbReadonly(f, names) && keys.includes(f.key)) {
              json[names.$dbNameOf(f)] = f.valueConverter.toJson(data[f.key])
            }
          }
          helper.verifyThatRowHasAllNotNullColumns(json, names)
          const newKey = keyFromRow(this.entity, names, json)
          if (!idbKeysEqual(key, newKey)) {
            const conflict = await idbReq(store.get(newKey))
            if (conflict != null) throw Error('id already exists')
            await idbReq(store.delete(key))
          }
          await idbReq(store.put(json))
          return helper.translateFromJson(json, names)
        },
      )
    })
  }

  delete(ids: any[]): Promise<void> {
    if (ids.length === 0) return Promise.resolve()
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      return this.provider.withStore(
        storeNameOf(this.entity),
        'readwrite',
        async (store) => {
          for (const id of ids) {
            const key = toIdbKey(this.entity, id)
            const existing = await idbReq(store.get(key))
            if (existing == null)
              throw new Error(
                `Couldn't find row with id "${id}" in entity "${this.entity.key}" to delete`,
              )
            await idbReq(store.delete(key))
          }
        },
      )
    })
  }
}

function storeNameOf(entity: EntityMetadata) {
  return entity.dbName
}

export type IdbFetchOp =
  | { type: 'keys'; keys: IDBValidKey[]; index?: string }
  | { type: 'range'; range: IDBKeyRange; index?: string }

export type IdbPrefetch =
  | { type: 'all' }
  | IdbFetchOp
  | { type: 'or'; parts: IdbFetchOp[] }

export type IdbIndexInfo = { name: string; keyPath: string | string[] }

//@internal
export async function idbPrefetchFromFilter(
  entity: EntityMetadata,
  where?: Filter,
  indexes: IdbIndexInfo[] = [],
): Promise<IdbPrefetch> {
  if (!where) return { type: 'all' }
  const names = await dbNamesOf(entity, (x) => x)
  if (entity.idMetadata.fields.length === 1) {
    const c = new IdbPrefetchCollector(entity.idMetadata.fields[0])
    where.__applyToConsumer(c)
    const r = c.result()
    if (r.type !== 'all') return r
  }
  const ordered = [...indexes].sort(
    (a, b) => pathLen(b.keyPath) - pathLen(a.keyPath),
  )
  for (const idx of ordered) {
    const r = prefetchForIndex(entity, names, where, idx)
    if (r.type !== 'all') return withIndex(r, idx.name)
  }
  return { type: 'all' }
}

function prefetchForIndex(
  entity: EntityMetadata,
  names: EntityDbNamesBase,
  where: Filter,
  idx: IdbIndexInfo,
): IdbPrefetch {
  const path = Array.isArray(idx.keyPath) ? idx.keyPath : [idx.keyPath]
  if (path.length === 1) {
    const field = fieldByDbName(entity, names, path[0])
    if (!field) return { type: 'all' }
    const c = new IdbPrefetchCollector(field)
    where.__applyToConsumer(c)
    return c.result()
  }
  const parts = path.map((dbName) => {
    const field = fieldByDbName(entity, names, dbName)
    if (!field) return { type: 'all' } as IdbPrefetch
    const c = new IdbPrefetchCollector(field)
    where.__applyToConsumer(c)
    return c.result()
  })
  if (parts.every((p) => p.type === 'keys')) {
    return {
      type: 'keys',
      keys: cartesian(parts.map((p) => (p as { keys: IDBValidKey[] }).keys)),
    }
  }
  const last = parts[parts.length - 1]
  const prefix = parts.slice(0, -1)
  if (
    last.type === 'range' &&
    prefix.every((p) => p.type === 'keys' && p.keys.length === 1)
  ) {
    const pre = prefix.map((p) => (p as { type: 'keys'; keys: IDBValidKey[] }).keys[0])
    const r = last.range
    try {
      if (r.lower !== undefined && r.upper !== undefined)
        return {
          type: 'range',
          range: IDBKeyRange.bound(
            [...pre, r.lower],
            [...pre, r.upper],
            r.lowerOpen,
            r.upperOpen,
          ),
        }
      if (r.lower !== undefined)
        return {
          type: 'range',
          range: IDBKeyRange.lowerBound([...pre, r.lower], r.lowerOpen),
        }
      if (r.upper !== undefined)
        return {
          type: 'range',
          range: IDBKeyRange.upperBound([...pre, r.upper], r.upperOpen),
        }
    } catch {
      return { type: 'keys', keys: [] }
    }
  }
  return { type: 'all' }
}

function withIndex(prefetch: IdbPrefetch, index: string): IdbPrefetch {
  if (prefetch.type === 'all') return prefetch
  if (prefetch.type === 'or')
    return { type: 'or', parts: prefetch.parts.map((p) => ({ ...p, index })) }
  return { ...prefetch, index }
}

function pathLen(keyPath: string | string[]) {
  return Array.isArray(keyPath) ? keyPath.length : 1
}

function fieldByDbName(
  entity: EntityMetadata,
  names: EntityDbNamesBase,
  dbName: string,
) {
  for (const f of entity.fields) {
    if (names.$dbNameOf(f) === dbName) return f
  }
}

function cartesian(lists: IDBValidKey[][]): IDBValidKey[] {
  let acc: IDBValidKey[][] = [[]]
  for (const list of lists) {
    acc = acc.flatMap((prefix) => list.map((v) => [...prefix, v]))
  }
  return acc
}

class IdbPrefetchCollector implements FilterConsumer {
  private keys?: IDBValidKey[]
  private lower?: { value: IDBValidKey; open: boolean }
  private upper?: { value: IDBValidKey; open: boolean }
  private orOps?: IdbFetchOp[]
  private cannotNarrow = false

  constructor(private idField: FieldMetadata) {}

  result(): IdbPrefetch {
    if (this.cannotNarrow) return { type: 'all' }
    const andOp = this.andOp()
    if (this.keys && andOp) return andOp
    if (this.orOps) return mergeOps(this.orOps)
    return andOp ?? { type: 'all' }
  }

  private hasIdConstraint() {
    return this.keys != null || this.hasBounds || this.orOps != null
  }
  private get hasBounds() {
    return this.lower != null || this.upper != null
  }

  private andOp(): IdbFetchOp | undefined {
    if (this.keys) {
      if (!this.hasBounds) return { type: 'keys', keys: this.keys }
      try {
        const range = this.toKeyRange()
        return {
          type: 'keys',
          keys: this.keys.filter((k) => range.includes(k)),
        }
      } catch {
        return { type: 'keys', keys: [] }
      }
    }
    if (!this.hasBounds) return undefined
    try {
      return { type: 'range', range: this.toKeyRange() }
    } catch {
      return { type: 'keys', keys: [] }
    }
  }

  private toKeyRange() {
    if (this.lower && this.upper)
      return IDBKeyRange.bound(
        this.lower.value,
        this.upper.value,
        this.lower.open,
        this.upper.open,
      )
    if (this.lower)
      return IDBKeyRange.lowerBound(this.lower.value, this.lower.open)
    return IDBKeyRange.upperBound(this.upper!.value, this.upper!.open)
  }

  private isId(col: FieldMetadata) {
    return col.key === this.idField.key
  }
  private toKey(col: FieldMetadata, val: any) {
    return col.valueConverter.toJson(val)
  }
  private intersectKeys(vals: IDBValidKey[]) {
    if (!this.keys) this.keys = [...vals]
    else
      this.keys = this.keys.filter((k) =>
        vals.some((v) => idbKeysEqual(k, v)),
      )
  }
  private addLower(value: IDBValidKey, open: boolean) {
    if (!this.lower) this.lower = { value, open }
    else if (value > this.lower.value) this.lower = { value, open }
    else if (value === this.lower.value)
      this.lower = { value, open: this.lower.open || open }
  }
  private addUpper(value: IDBValidKey, open: boolean) {
    if (!this.upper) this.upper = { value, open }
    else if (value < this.upper.value) this.upper = { value, open }
    else if (value === this.upper.value)
      this.upper = { value, open: this.upper.open || open }
  }

  isEqualTo(col: FieldMetadata, val: any) {
    if (this.isId(col)) this.intersectKeys([this.toKey(col, val)])
  }
  isIn(col: FieldMetadata, val: any[]) {
    if (this.isId(col)) this.intersectKeys(val.map((v) => this.toKey(col, v)))
  }
  isGreaterThan(col: FieldMetadata, val: any) {
    if (this.isId(col)) this.addLower(this.toKey(col, val), true)
  }
  isGreaterOrEqualTo(col: FieldMetadata, val: any) {
    if (this.isId(col)) this.addLower(this.toKey(col, val), false)
  }
  isLessThan(col: FieldMetadata, val: any) {
    if (this.isId(col)) this.addUpper(this.toKey(col, val), true)
  }
  isLessOrEqualTo(col: FieldMetadata, val: any) {
    if (this.isId(col)) this.addUpper(this.toKey(col, val), false)
  }
  or(orElements: Filter[]) {
    const results = orElements.map((el) => {
      const c = new IdbPrefetchCollector(this.idField)
      el.__applyToConsumer(c)
      return c.result()
    })
    if (results.some((r) => r.type === 'all')) return
    const ops = results.flatMap((r) =>
      r.type === 'or' ? r.parts : r.type === 'all' ? [] : [r],
    )
    this.orOps = this.orOps ? [...this.orOps, ...ops] : ops
  }
  not(filter: Filter) {
    const c = new IdbPrefetchCollector(this.idField)
    filter.__applyToConsumer(c)
    if (c.cannotNarrow || c.hasIdConstraint()) this.cannotNarrow = true
  }
  isNull(col: FieldMetadata) {
    if (this.isId(col)) this.cannotNarrow = true
  }
  isNotNull(col: FieldMetadata) {
    if (this.isId(col)) this.cannotNarrow = true
  }
  isDifferentFrom(_col: FieldMetadata, _val: any) {}
  containsCaseInsensitive(_col: FieldMetadata, _val: any) {}
  notContainsCaseInsensitive(_col: FieldMetadata, _val: any) {}
  startsWithCaseInsensitive(_col: FieldMetadata, _val: any) {}
  endsWithCaseInsensitive(_col: FieldMetadata, _val: any) {}
  custom(_key: string, _customItem: any) {
    this.cannotNarrow = true
  }
  databaseCustom(_databaseCustom: any) {
    this.cannotNarrow = true
  }
}

function mergeOps(ops: IdbFetchOp[]): IdbPrefetch {
  const keyGroups = new Map<string, IDBValidKey[]>()
  const ranges: IdbFetchOp[] = []
  for (const op of ops) {
    if (op.type === 'keys') {
      const k = op.index ?? ''
      keyGroups.set(k, [...(keyGroups.get(k) ?? []), ...op.keys])
    } else ranges.push(op)
  }
  const parts: IdbFetchOp[] = [
    ...[...keyGroups.entries()].map(([index, keys]) => ({
      type: 'keys' as const,
      keys: keys.filter((k, i) => keys.findIndex((x) => idbKeysEqual(x, k)) === i),
      ...(index ? { index } : {}),
    })),
    ...ranges,
  ]
  if (parts.length === 1) return parts[0]
  return { type: 'or', parts }
}

async function resolveIndexDefs(
  entity: EntityMetadata,
  defs: IndexedDbIndexDef<any>[],
  storeKeyPath: string | string[],
): Promise<IdbIndexInfo[]> {
  if (defs.length === 0) return []
  const names = await dbNamesOf(entity, (x) => x)
  const result: IdbIndexInfo[] = []
  const seen = new Set<string>()
  const pk = JSON.stringify(storeKeyPath)
  for (const def of defs) {
    const keys = Array.isArray(def) ? [...def] : [def]
    const keyPath = keys.map((key) => {
      const field = [...entity.fields].find((f) => f.key === key)
      if (!field)
        throw new Error(
          `IndexedDB index field "${key}" not found on entity "${entity.key}"`,
        )
      return names.$dbNameOf(field)
    })
    const path: string | string[] = keyPath.length === 1 ? keyPath[0] : keyPath
    if (JSON.stringify(path) === pk) continue
    const name = keyPath.join('_')
    if (seen.has(name)) continue
    seen.add(name)
    result.push({ name, keyPath: path })
  }
  return result
}

async function keyPathOf(entity: EntityMetadata): Promise<string | string[]> {
  const names = await dbNamesOf(entity, (x) => x)
  const fields = entity.idMetadata.fields
  if (fields.length === 1) return names.$dbNameOf(fields[0])
  return fields.map((f) => names.$dbNameOf(f))
}

function toIdbKey(entity: EntityMetadata, id: any): IDBValidKey {
  const fields = entity.idMetadata.fields
  if (fields.length === 1) return fields[0].valueConverter.toJson(id)
  const values =
    typeof id === 'object' && id !== null
      ? id
      : Object.fromEntries(
          String(id)
            .split(',')
            .map((part, i) => [
              fields[i].key,
              fields[i].valueConverter.fromJson(part),
            ]),
        )
  return fields.map((f) => f.valueConverter.toJson(values[f.key]))
}

function keyFromRow(
  entity: EntityMetadata,
  names: EntityDbNamesBase,
  row: any,
): IDBValidKey {
  const fields = entity.idMetadata.fields
  if (fields.length === 1) return row[names.$dbNameOf(fields[0])]
  return fields.map((f) => row[names.$dbNameOf(f)])
}

function idbKeysEqual(a: IDBValidKey, b: IDBValidKey) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
