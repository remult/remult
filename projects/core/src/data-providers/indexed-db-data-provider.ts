import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  EntityDataProviderGroupByOptions,
} from '../data-interfaces.js'
import type { EntityDbNamesBase } from '../filter/filter-consumer-bridge-to-sql-request.js'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request.js'
import type { Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata } from '../remult3/remult3.js'
import { isAutoIncrement } from '../remult3/RepositoryImplementation.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export class IndexedDbDataProvider implements DataProvider {
  constructor(private dbName: string = 'remult') {}

  //@internal
  db?: IDBDatabase
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
    what: (dp: ArrayEntityDataProvider) => Promise<T>,
  ): Promise<T> {
    return this.enqueue(async () => {
      await this.ensureStores([entity])
      const rows = await this.getAll(storeNameOf(entity))
      return what(new ArrayEntityDataProvider(entity, () => rows))
    })
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
  private getAll(storeName: string): Promise<any[]> {
    return this.withStore(storeName, 'readonly', (store) =>
      idbReq(store.getAll()),
    )
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
    return this.provider.runWithRows(this.entity, (dp) => dp.find(options))
  }
  count(where: Filter): Promise<number> {
    return this.provider.runWithRows(this.entity, (dp) => dp.count(where))
  }
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return this.provider.runWithRows(this.entity, (dp) => dp.groupBy(options))
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
      const names = await dbNamesOf(this.entity, (x) => x)
      const key = toIdbKey(this.entity, id)
      const storeName = storeNameOf(this.entity)
      const existing = await this.provider.withStore(
        storeName,
        'readonly',
        (store) => idbReq(store.get(key)),
      )
      const rows = existing != null ? [existing] : []
      const rowHelper = new ArrayEntityDataProvider(this.entity, () => rows)
      const result = await rowHelper.update(id, data)
      const newRow = rows[0]
      const newKey = keyFromRow(this.entity, names, newRow)
      await this.provider.withStore(storeName, 'readwrite', async (store) => {
        if (!idbKeysEqual(key, newKey)) {
          const conflict = await idbReq(store.get(newKey))
          if (conflict != null) throw Error('id already exists')
          await idbReq(store.delete(key))
        }
        await idbReq(store.put(newRow))
      })
      return result
    })
  }

  delete(id: any): Promise<void> {
    return this.provider.enqueue(async () => {
      await this.provider.ensureStores([this.entity])
      const key = toIdbKey(this.entity, id)
      const storeName = storeNameOf(this.entity)
      const existing = await this.provider.withStore(
        storeName,
        'readonly',
        (store) => idbReq(store.get(key)),
      )
      const rows = existing != null ? [existing] : []
      await new ArrayEntityDataProvider(this.entity, () => rows).delete(id)
      await this.provider.withStore(storeName, 'readwrite', (store) =>
        idbReq(store.delete(key)),
      )
    })
  }
}

function storeNameOf(entity: EntityMetadata) {
  return entity.dbName
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
