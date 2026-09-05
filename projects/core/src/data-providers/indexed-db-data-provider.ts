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
import type { FieldMetadata } from '../column-interfaces.js'
import type { Filter, FilterConsumer } from '../filter/filter-interfaces.js'
import type { EntityMetadata } from '../remult3/remult3.js'
import { isAutoIncrement } from '../remult3/RepositoryImplementation.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export class IndexedDbDataProvider implements DataProvider {
  constructor(private dbName: string = 'remult') {}

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
    const prefetch = idbPrefetchFromFilter(entity, where)
    this.lastFetch = prefetch
    if (prefetch.type === 'all') return this.getAll(storeName)
    const ops = prefetch.type === 'or' ? prefetch.parts : [prefetch]
    return this.fetchOps(storeName, entity, ops)
  }

  //@internal
  async ensureStores(entities: EntityMetadata[]) {
    const wanted = await Promise.all(
      entities.map(async (entity) => ({
        name: storeNameOf(entity),
        keyPath: await keyPathOf(entity),
        autoIncrement: isAutoIncrement(entity.idMetadata.field),
      })),
    )
    const db = await this.open()
    const missing = wanted.filter((w) => !db.objectStoreNames.contains(w.name))
    if (missing.length === 0) return

    const nextVersion = db.version + 1
    this.forget(db)
    db.close()

    await this.open(nextVersion, (upgradeDb) => {
      for (const { name, keyPath, autoIncrement } of missing) {
        if (!upgradeDb.objectStoreNames.contains(name)) {
          upgradeDb.createObjectStore(name, { keyPath, autoIncrement })
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
    upgrade?: (db: IDBDatabase) => void,
  ): Promise<IDBDatabase> {
    if (this.db && version == null) return this.db
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request =
        version == null
          ? indexedDB.open(this.dbName)
          : indexedDB.open(this.dbName, version)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => upgrade?.(request.result)
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
        const chunk =
          op.type === 'keys'
            ? await Promise.all(op.keys.map((key) => idbReq(store.get(key))))
            : await idbReq(store.getAll(op.range))
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

  insert(data: any): Promise<any> {
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      const helper = new ArrayEntityDataProvider(this.entity, () => [])
      const names = await helper.init()
      const json = helper.translateToJson(data, names)
      helper.verifyThatRowHasAllNotNullColumns(json, names)
      const auto = isAutoIncrement(this.entity.idMetadata.field)
      const idName = names.$dbNameOf(this.entity.idMetadata.field)
      if (auto) delete json[idName]
      return this.provider.withStore(
        storeNameOf(this.entity),
        'readwrite',
        async (store) => {
          try {
            const key = await idbReq(store.add(json))
            if (auto) json[idName] = json[idName] ?? key
          } catch (e: any) {
            if (e?.name === 'ConstraintError') throw Error('id already exists')
            throw e
          }
          return helper.translateFromJson(json, names)
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

  delete(id: any): Promise<void> {
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      const key = toIdbKey(this.entity, id)
      return this.provider.withStore(
        storeNameOf(this.entity),
        'readwrite',
        async (store) => {
          const existing = await idbReq(store.get(key))
          if (existing == null)
            throw new Error(
              `Couldn't find row with id "${id}" in entity "${this.entity.key}" to delete`,
            )
          await idbReq(store.delete(key))
        },
      )
    })
  }
}

function storeNameOf(entity: EntityMetadata) {
  return entity.dbName
}

export type IdbFetchOp =
  | { type: 'keys'; keys: IDBValidKey[] }
  | { type: 'range'; range: IDBKeyRange }

export type IdbPrefetch =
  | { type: 'all' }
  | IdbFetchOp
  | { type: 'or'; parts: IdbFetchOp[] }

//@internal
export function idbPrefetchFromFilter(
  entity: EntityMetadata,
  where?: Filter,
): IdbPrefetch {
  if (!where) return { type: 'all' }
  const fields = entity.idMetadata.fields
  if (fields.length !== 1) return { type: 'all' }
  const c = new IdbPrefetchCollector(fields[0])
  where.__applyToConsumer(c)
  return c.result()
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
  const keys: IDBValidKey[] = []
  const ranges: IDBKeyRange[] = []
  for (const op of ops) {
    if (op.type === 'keys') keys.push(...op.keys)
    else ranges.push(op.range)
  }
  const uniqueKeys = keys.filter(
    (k, i) => keys.findIndex((x) => idbKeysEqual(x, k)) === i,
  )
  if (ranges.length === 0) return { type: 'keys', keys: uniqueKeys }
  const parts: IdbFetchOp[] = [
    ...(uniqueKeys.length ? [{ type: 'keys' as const, keys: uniqueKeys }] : []),
    ...ranges.map((range) => ({ type: 'range' as const, range })),
  ]
  if (parts.length === 1) return parts[0]
  return { type: 'or', parts }
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
