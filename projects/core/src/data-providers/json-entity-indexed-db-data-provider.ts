import type { JsonEntityStorage } from './json-data-provider.js'

export class JsonEntityIndexedDbStorage implements JsonEntityStorage {
  constructor(
    private dbName: string = 'db',
    private storeName: string = 'jsonStore',
  ) {}
  supportsRawJson = true
  //@internal
  db?: IDBDatabase
  async getItem(entityDbName: string) {
    return new Promise<string>(async (resolve, reject) => {
      const transaction = (await this.init()).transaction(
        [this.storeName],
        'readonly',
      )
      const store = transaction.objectStore(this.storeName)
      const request = store.get(entityDbName)

      request.onerror = (event) => reject(request.error)
      request.onsuccess = (event) => {
        if (request.result) {
          resolve(request.result)
        } else {
          resolve(null!)
        }
      }
    })
  }
  //@internal
  async init() {
    if (!this.db) {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        let db: IDBDatabase
        const request = indexedDB.open(this.dbName, 1)

        request.onerror = (event) => reject(request.error)

        request.onsuccess = (event) => {
          db = request.result
          resolve(db)
        }

        request.onupgradeneeded = (event) => {
          db = request.result
          db.createObjectStore(this.storeName)
        }
      })
    }
    return this.db
  }

  async setItem(entityDbName: string, json: string) {
    return new Promise<void>(async (resolve, reject) => {
      const transaction = (await this.init()).transaction(
        [this.storeName],
        'readwrite',
      )
      const store = transaction.objectStore(this.storeName)
      const request = store.put(json, entityDbName)

      request.onerror = (event) => reject(request.error)
      request.onsuccess = (event) => resolve()
    })
  }

  async removeItem(entityDbName: string) {
    return new Promise<void>(async (resolve, reject) => {
      const transaction = (await this.init()).transaction(
        [this.storeName],
        'readwrite',
      )
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(entityDbName)

      request.onerror = (_event) => reject(request.error)
      request.onsuccess = (_event) => resolve()
    })
  }
}
