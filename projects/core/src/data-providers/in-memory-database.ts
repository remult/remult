import {  DataProvider, EntityDataProvider,   __RowsOfDataForTesting } from '../data-interfaces';
import { ArrayEntityDataProvider } from './array-entity-data-provider';
import { EntityDefs } from '../remult3';

export class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    await action(this);
  }
  rows: any = {};
  public getEntityDataProvider(entity:EntityDefs): EntityDataProvider {
    let name = entity.key;
    if (!this.rows[name])
      this.rows[name] = [];
    return new ArrayEntityDataProvider(entity, this.rows[name]);
  }
  toString() { return "InMemoryDataProvider" }

}




