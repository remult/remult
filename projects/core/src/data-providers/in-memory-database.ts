
import { Column } from '../column';
import {  DataProvider, EntityDataProvider, EntityDataProviderFindOptions,  __RowsOfDataForTesting } from '../data-interfaces';

import { Entity } from '../entity';
import { StringColumn } from '../columns/string-column';
import { FilterConsumer } from '../filter/filter-interfaces';
import { ArrayEntityDataProvider } from './array-entity-data-provider';



export class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  rows: any = {};
  public getEntityDataProvider(entity:Entity): EntityDataProvider {
    let name = entity.defs.name;
    if (!this.rows[name])
      this.rows[name] = [];
    return new ArrayEntityDataProvider(entity, this.rows[name]);
  }
  toString() { return "InMemoryDataProvider" }

}




