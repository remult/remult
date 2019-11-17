import * as path from 'path';
import * as fs from 'fs';
import {  DataProviderFactory, DataProvider,Entity, JsonStorageDataProvider, JsonStorage, ActualInMemoryDataProvider  } from '@remult/core';





export class JsonFileDataProvider implements DataProviderFactory {
  constructor(private folderPath: string) {

  }
  public provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {
    return new JsonStorageDataProvider<T>(new FileJsonStorage(path.join(this.folderPath, name) + '.json',factory));
  }
}

class FileJsonStorage implements JsonStorage {
  constructor(private filePath: string,private  factory: () => Entity<any>) {

  }
  doWork<T>(what: (dp: DataProvider, save: () => void) => T): T {
    let data = JSON.parse(fs.readFileSync(this.filePath).toString());
    let dp = new ActualInMemoryDataProvider(this.factory,data);
    return what(dp, () => fs.writeFileSync(this.filePath, JSON.stringify(data, undefined, 2)));
  }
}
