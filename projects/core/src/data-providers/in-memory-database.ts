import type { __RowsOfDataForTesting } from '../__RowsOfDataForTesting'
import type { DataProvider, EntityDataProvider } from '../data-interfaces'
import type { EntityMetadata } from '../remult3'
import { ArrayEntityDataProvider } from './array-entity-data-provider'

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
