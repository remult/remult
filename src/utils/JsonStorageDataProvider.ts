import { Entity } from './utils';
import { DataProvider, FindOptions } from './dataInterfaces1';
export interface JsonStorage {
  doWork<T>(what: (dp: DataProvider, save: () => void) => T): T;
}


export class JsonStorageDataProvider<T extends Entity<any>> implements DataProvider {

  constructor(private helper: JsonStorage) {

  }
  find(options?: FindOptions): Promise<any[]> {
    return this.helper.doWork((dp, save) => dp.find(options));
  }


  update(id: any, data: any): Promise<any> {
    return this.helper.doWork((dp, save) => dp.update(id, data).then(x => {
      save();
      return x;
    }))

  }
  delete(id: any): Promise<void> {
    return this.helper.doWork((dp, save) => dp.delete(id).then(x => {
      save();
      return x;
    }))
  }
  insert(data: any): Promise<any> {
    return this.helper.doWork((dp, save) => dp.insert(data).then(x => {
      save();
      return x;
    }))
  }

}
