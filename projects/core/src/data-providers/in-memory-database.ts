import type { __RowsOfDataForTesting } from '../__RowsOfDataForTesting.js'
import type { DataProvider, EntityDataProvider } from '../data-interfaces.js'
import type { EntityMetadata } from '../remult3/remult3.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export class InMemoryDataProvider
  implements DataProvider, __RowsOfDataForTesting
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
    return new ArrayEntityDataProvider(entity, () => this.rows[name])
  }
  toString() {
    return 'InMemoryDataProvider'
  }
}
