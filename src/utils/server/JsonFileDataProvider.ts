import { JsonStorageDataProvider,JsonStorage } from './../JsonStorageDataProvider';


import { ActualInMemoryDataProvider } from '../inMemoryDatabase';
import { Entity } from '../Data';
import * as path from 'path';
import * as fs from 'fs';

import { dataAreaSettings } from '../utils';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, iDataColumnSettings, FindOptions } from '../dataInterfaces';


import { isFunction, makeTitle } from '../common';


export class JsonFileDataProvider implements DataProviderFactory {
  constructor(private folderPath: string) {

  }
  public provideFor<T extends Entity>(name: string): DataProvider {
    return new JsonStorageDataProvider<T>(new FileJsonStorage(path.join(this.folderPath, name) + '.json'));
  }
}

class FileJsonStorage implements JsonStorage {
  constructor(private filePath: string) {

  }
  doWork<T>(what: (dp: DataProvider, save: () => void) => T): T {
    let data = JSON.parse(fs.readFileSync(this.filePath).toString());
    let dp = new ActualInMemoryDataProvider(data);
    return what(dp, () => fs.writeFileSync(this.filePath, JSON.stringify(data, undefined, 2)));
  }
}
