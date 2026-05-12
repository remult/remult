import type { JsonEntityStorage } from './json-data-provider.js'

export class JsonEntityIndexedDbStorage implements JsonEntityStorage {
  constructor(
    private dbName: string = 'db',
    private storeName: string = 'jsonStore',
  ) {}
  supportsRawJson = true
  //@internal
  db?: IDBDatabase

  getItem = (key: string) =>
    this.run('readonly', (s) => s.get(key)) as Promise<string>
  setItem = (key: string, json: string) =>
    this.run('readwrite', (s) => s.put(json, key)) as Promise<void>
  removeItem = (key: string) =>
    this.run('readwrite', (s) => s.delete(key)) as Promise<void>
  clear = () => this.run('readwrite', (s) => s.clear()) as Promise<void>

  private async run(
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest,
  ): Promise<unknown> {
    const attempt = async () => {
      const db = await this.init()
      return new Promise<unknown>((resolve, reject) => {
        const request = op(
          db.transaction([this.storeName], mode).objectStore(this.storeName),
        )
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result ?? null!)
      })
    }
    try {
      return await attempt()
    } catch (err) {
      if ((err as DOMException)?.name !== 'InvalidStateError') throw err
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
