import type { JsonEntityStorage } from './json-data-provider.js'

export class OpfsEntityStorage implements JsonEntityStorage {
  //@internal
  opfsRoot?: FileSystemDirectoryHandle
  async getItem(entityDbName: string) {
    if (!this.opfsRoot) {
      this.opfsRoot = await navigator.storage.getDirectory()
    }
    const opfsFile = await this.opfsRoot.getFileHandle(entityDbName + '.json', {
      create: true,
    })
    const readable = await opfsFile.getFile()
    return await readable.text()
  }
  async setItem(entityDbName: string, json: string) {
    const opfsFile = await this.opfsRoot.getFileHandle(entityDbName + '.json', {
      create: true,
    })
    const writable = await opfsFile.createWritable()
    await writable.write(json)
    await writable.close()
  }
}
