import * as fs from 'fs'
import * as path from 'path'
import type { JsonEntityStorage } from '../index.js'
import { JsonDataProvider } from '../index.js'

export class JsonEntityFileStorage implements JsonEntityStorage {
  getItem(entityDbName: string) {
    let fn = path.join(this.folderPath, entityDbName) + '.json'
    if (fs.existsSync(fn)) {
      return fs.readFileSync(fn).toString()
    }
    return null
  }
  setItem(entityDbName: string, json: string) {
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
