import { ActualInMemoryDataProvider } from './inMemoryDatabase';
import { JsonStorageDataProvider, JsonStorage } from './JsonStorageDataProvider';

import { DataProvider, EntityDataProvider } from '../data-interfaces';
import { Entity } from '../entity';


export class LocalStorageDataProvider implements DataProvider {
  constructor() {

  }
  public getEntityDataProvider(entity:Entity<any>): EntityDataProvider {
    return new JsonStorageDataProvider(new LocalJsonStorage( entity.__getName(), entity));
  }
}

class LocalJsonStorage implements JsonStorage {
  constructor(private key: string, private entity: Entity<any>) {

  }
  doWork<T>(what: (dp: EntityDataProvider, save: () => void) => T): T {
    let data: any = localStorage.getItem(this.key);
    try {
      data = JSON.parse(data);
    }
    catch (err) {
      data = [];
    }
    if (!(data instanceof Array))
      data = [];
    let dp = new ActualInMemoryDataProvider(this.entity, data);
    return what(dp, () => localStorage.setItem(this.key, JSON.stringify(data, undefined, 2)));
  }
}
