import type { JsonEntityStorage } from './json-data-provider.js'

export class JsonEntityOpfsStorage implements JsonEntityStorage {
  //@internal
  opfsRoot?: FileSystemDirectoryHandle
  async getItem(entityDbName: string) {
    const opfsFile = await (
      await this.init()
    ).getFileHandle(entityDbName + '.json', {
      create: true,
    })
    const readable = await opfsFile.getFile()
    return await readable.text()
  }
  //@internal
  async init() {
    if (!this.opfsRoot) {
      this.opfsRoot = await navigator.storage.getDirectory()
    }
    return this.opfsRoot
  }

  async setItem(entityDbName: string, json: string) {
    const opfsFile = await await (
      await this.init()
    ).getFileHandle(entityDbName + '.json', {
      create: true,
    })
    const writable = await opfsFile.createWritable()
    await writable.write(json)
    await writable.close()
  }
}
