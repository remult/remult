import {  DataProvider, EntityDataProvider } from '../data-interfaces.js';
import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting.js";
import { ArrayEntityDataProvider } from './array-entity-data-provider.js';
import { EntityMetadata } from '../remult3/index.js';

export class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    await action(this);
  }
  rows: any = {};
  public getEntityDataProvider(entity:EntityMetadata): EntityDataProvider {
    let name = entity.key;
    if (!this.rows[name])
      this.rows[name] = [];
    return new ArrayEntityDataProvider(entity, this.rows[name]);
  }
  toString() { return "InMemoryDataProvider" }

}




