import { ActualInMemoryDataProvider } from './inMemoryDatabase';
import { JsonStorageDataProvider, JsonStorage } from './JsonStorageDataProvider';
import { Entity } from './utils';
import { DataProviderFactory, DataProvider } from './dataInterfaces1';


export class LocalStorageDataProvider implements DataProviderFactory {
  constructor() {

  }
  public provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {
    return new JsonStorageDataProvider<T>(new LocalJsonStorage(name, factory));
  }
}

class LocalJsonStorage implements JsonStorage {
  constructor(private key: string, private factory: () => Entity<any>) {

  }
  doWork<T>(what: (dp: DataProvider, save: () => void) => T): T {
    let data: any = localStorage.getItem(this.key);
    try {
      data = JSON.parse(data);
    }
    catch (err) {
      data = [];
    }
    if (!(data instanceof Array))
      data = [];
    let dp = new ActualInMemoryDataProvider(this.factory, data);
    return what(dp, () => localStorage.setItem(this.key, JSON.stringify(data, undefined, 2)));
  }
}
