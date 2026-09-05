import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  EntityDataProviderGroupByOptions,
} from '../data-interfaces.js'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request.js'
import type { Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata } from '../remult3/remult3.js'
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
    mutate: boolean,
    what: (dp: ArrayEntityDataProvider) => Promise<T>,
  ): Promise<T> {
    return this.enqueue(async () => {
      await this.ensureStores([entity])
      const storeName = storeNameOf(entity)
      const rows = await this.getAll(storeName)
      const result = await what(new ArrayEntityDataProvider(entity, () => rows))
      if (mutate) await this.replaceStore(storeName, rows)
      return result
    })
  }

  //@internal
  async ensureStores(entities: EntityMetadata[]) {
    const wanted = await Promise.all(
      entities.map(async (entity) => ({
        name: storeNameOf(entity),
        keyPath: await keyPathOf(entity),
      })),
    )
    const db = await this.open()
    const missing = wanted.filter((w) => !db.objectStoreNames.contains(w.name))
    if (missing.length === 0) return

    const nextVersion = db.version + 1
    this.forget(db)
    db.close()

    await this.open(nextVersion, (upgradeDb) => {
      for (const { name, keyPath } of missing) {
        if (!upgradeDb.objectStoreNames.contains(name)) {
          upgradeDb.createObjectStore(name, { keyPath })
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
    return this.withStore(storeName, 'readonly', (store) => store.getAll())
  }

  //@internal
  private replaceStore(storeName: string, rows: any[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
      tx.onerror = () => reject(tx.error)
      const store = tx.objectStore(storeName)
      store.clear()
      for (const row of rows) store.put(row)
    })
  }

  //@internal
  private withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tx = this.db!.transaction(storeName, mode)
      tx.onabort = () => reject(tx.error)
      const request = op(tx.objectStore(storeName))
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}

class IndexedDbEntityDataProvider implements EntityDataProvider {
  constructor(
    private provider: IndexedDbDataProvider,
    private entity: EntityMetadata,
  ) {}

  find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    return this.provider.runWithRows(this.entity, false, (dp) =>
      dp.find(options),
    )
  }
  count(where: Filter): Promise<number> {
    return this.provider.runWithRows(this.entity, false, (dp) =>
      dp.count(where),
    )
  }
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return this.provider.runWithRows(this.entity, false, (dp) =>
      dp.groupBy(options),
    )
  }
  insert(data: any): Promise<any> {
    return this.provider.runWithRows(this.entity, true, (dp) => dp.insert(data))
  }
  update(id: any, data: any): Promise<any> {
    return this.provider.runWithRows(this.entity, true, (dp) =>
      dp.update(id, data),
    )
  }
  delete(id: any): Promise<void> {
    return this.provider.runWithRows(this.entity, true, (dp) => dp.delete(id))
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
