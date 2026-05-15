import type { JsonEntityStorage } from './json-data-provider.js'

const connectionLostNames = new Set([
  'InvalidStateError',
  'UnknownError',
  'AbortError',
])

export class JsonEntityIndexedDbStorage implements JsonEntityStorage {
  constructor(
    private dbName: string = 'db',
    private storeName: string = 'jsonStore',
  ) {}
  supportsRawJson = true
  //@internal
  db?: IDBDatabase

  getItem(entityDbName: string) {
    return this.run('readonly', (s) => s.get(entityDbName)) as Promise<string>
  }
  setItem(entityDbName: string, json: string) {
    return this.run('readwrite', (s) =>
      s.put(json, entityDbName),
    ) as Promise<void>
  }
  removeItem(entityDbName: string) {
    return this.run('readwrite', (s) => s.delete(entityDbName)) as Promise<void>
  }
  clear() {
    return this.run('readwrite', (s) => s.clear()) as Promise<void>
  }

  //@internal
  private async run(
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest,
  ): Promise<unknown> {
    const attempt = async () => {
      const db = await this.init()
      return new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction([this.storeName], mode)
        tx.onabort = () => reject(tx.error)
        const request = op(tx.objectStore(this.storeName))
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result ?? null!)
      })
    }
    try {
      return await attempt()
    } catch (err) {
      if (!connectionLostNames.has((err as DOMException)?.name)) throw err
      this.db = undefined
      return await attempt()
    }
  }

  //@internal
  async init() {
    if (this.db) return this.db
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () =>
        request.result.createObjectStore(this.storeName)
      request.onsuccess = () => {
        const db = request.result
        const forget = () => {
          if (this.db === db) this.db = undefined
        }
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
}
