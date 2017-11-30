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
    return new JsonFileImpl<T>(path.join(this.folderPath, name) + '.json');
  }
}
class JsonFileImpl<T extends Entity> implements DataProvider {
  find(options?: FindOptions): Promise<any[]> {
    return new ActualInMemoryDataProvider(JSON.parse(fs.readFileSync('./appData/categories.json').toString())).find(options);
  }
  update(id: any, data: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  delete(id: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  insert(data: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  constructor(private filePath: string) {

  }
}
