import {  DataProvider, EntityDataProvider,   __RowsOfDataForTesting } from '../data-interfaces';
import { ArrayEntityDataProvider } from './array-entity-data-provider';
import { EntityDefs } from '../remult3';

export class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  rows: any = {};
  public getEntityDataProvider(entity:EntityDefs): EntityDataProvider {
    let name = entity.name;
    if (!this.rows[name])
      this.rows[name] = [];
    return new ArrayEntityDataProvider(entity, this.rows[name]);
  }
  toString() { return "InMemoryDataProvider" }

}




