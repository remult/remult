import * as path from 'path';
import * as fs from 'fs';
import {JsonEntityStorage } from '../index';


export class JsonEntityFileStorage implements JsonEntityStorage {
  getItem(entityDbName: string): string {
    return fs.readFileSync(path.join(this.folderPath, entityDbName) + '.json').toString();
  }
  setItem(entityDbName: string, json: string) {
    return fs.writeFileSync(path.join(this.folderPath, entityDbName) + '.json', json);
  }

  constructor(private folderPath: string) {

  }
}
