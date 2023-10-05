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
    await action(this)
  }
  rows: any = {}
  public getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    let name = entity.key
    if (!this.rows[name]) this.rows[name] = []
    return new ArrayEntityDataProvider(entity, this.rows[name])
  }
  toString() {
    return 'InMemoryDataProvider'
  }
}
