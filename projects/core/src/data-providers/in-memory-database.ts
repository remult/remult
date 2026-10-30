import type { __RowsOfDataForTesting } from '../__RowsOfDataForTesting.js'
import type {
  DataProvider,
  DroppableDataProvider,
  EntityDataProvider,
} from '../data-interfaces.js'
import {
  getEntityMetadata,
  type EntityMetadataOverloads,
} from '../remult3/RepositoryImplementation.js'
import type { EntityMetadata } from '../remult3/remult3.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export class InMemoryDataProvider
  implements DroppableDataProvider, __RowsOfDataForTesting
{
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    let before = JSON.stringify(this.rows)
    try {
      await action(this)
    } catch (e) {
      this.rows = JSON.parse(before)
      throw e
    }
  }
  rows: any = {}
  public getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    let name = entity.dbName
    if (!this.rows[name]) this.rows[name] = []
    return new ArrayEntityDataProvider(entity, () => {
      if (!this.rows[name]) this.rows[name] = []
      return this.rows[name]
    })
  }
  async dropDatabase(): Promise<void> {
    this.rows = {}
  }
  async dropTable(entity: EntityMetadataOverloads): Promise<void> {
    delete this.rows[getEntityMetadata(entity).dbName]
  }
  toString() {
    return 'InMemoryDataProvider'
  }
}
