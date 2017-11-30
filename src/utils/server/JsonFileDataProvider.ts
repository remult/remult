

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
    return this.doWork((dp, save) => dp.find(options));
  }
  doWork<T>(what: (dp: DataProvider, save: () => void) => T): T {
    let data = JSON.parse(fs.readFileSync(this.filePath).toString());
    let dp = new ActualInMemoryDataProvider(data);
    return what(dp, () => fs.writeFileSync(this.filePath, JSON.stringify(data, undefined, 2)));
  }

  update(id: any, data: any): Promise<any> {
    return this.doWork((dp, save) => dp.update(id, data).then(x => {
      save();
      return x;
    }))

  }
  delete(id: any): Promise<void> {
    return this.doWork((dp, save) => dp.delete(id).then(x => {
      save();
      return x;
    }))
  }
  insert(data: any): Promise<any> {
    return this.doWork((dp, save) => dp.insert(data).then(x => {
      save();
      return x;
    }))
  }
  constructor(private filePath: string) {

  }
}
