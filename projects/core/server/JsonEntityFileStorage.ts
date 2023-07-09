import * as path from 'path'
import * as fs from 'fs'
import { JsonDataProvider, JsonEntityStorage } from '../index'

export class JsonEntityFileStorage implements JsonEntityStorage {
  getItem(entityDbName: string): string {
    let fn = path.join(this.folderPath, entityDbName) + '.json'
    if (fs.existsSync(fn)) {
      return fs.readFileSync(fn).toString()
    }
    return undefined
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
