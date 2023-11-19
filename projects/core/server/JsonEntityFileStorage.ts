import type { JsonEntityStorage } from '../index'
import { JsonDataProvider } from '../index'

export class JsonEntityFileStorage implements JsonEntityStorage {
  async getItem(entityDbName: string): Promise<string> {
    const path = await import('path')
    const fs = await import('fs')
    let fn = path.join(this.folderPath, entityDbName) + '.json'
    if (fs.existsSync(fn)) {
      return fs.readFileSync(fn).toString()
    }
    return undefined
  }
  async setItem(entityDbName: string, json: string) {
    const path = await import('path')
    const fs = await import('fs')
    if (!fs.existsSync(this.folderPath)) {
      fs.mkdirSync(this.folderPath)
    }
    return fs.writeFileSync(
      path.join(this.folderPath, entityDbName) + '.json',
      json,
    )
  }
  constructor(private folderPath: string) {}
}

export class JsonFileDataProvider extends JsonDataProvider {
  constructor(folderPath: string) {
    super(new JsonEntityFileStorage(folderPath))
  }
}
