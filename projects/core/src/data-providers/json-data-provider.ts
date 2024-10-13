import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
} from '../data-interfaces.js'
import type { Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata } from '../remult3/remult3.js'
import { ArrayEntityDataProvider } from './array-entity-data-provider.js'

export interface JsonEntityStorage {
  getItem(entityDbName: string): any | null | Promise<any | null>
  setItem(entityDbName: string, json: any): void | Promise<void>
  // When set to false, stringify version of the json will be sent to setItem
  supportsRawJson?: boolean
}

export class JsonDataProvider implements DataProvider {
  constructor(
    private storage: JsonEntityStorage,
    private formatted = false,
  ) {}
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    return new JsonEntityDataProvider(entity, this.storage, this.formatted)
  }
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    await action(this)
  }
}

class JsonEntityDataProvider implements EntityDataProvider {
  constructor(
    private entity: EntityMetadata,
    private helper: JsonEntityStorage,
    private formatted: boolean,
  ) {}
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) => dp.groupBy(options)),
    ))
  }
  async loadEntityData(
    what: (dp: EntityDataProvider, save: () => Promise<void>) => any,
  ): Promise<any> {
    let data = []
    let dbName = await this.entity.dbName
    let s = await this.helper.getItem(dbName)
    if (s) data = this.helper.supportsRawJson ? s : JSON.parse(s)
    let dp = new ArrayEntityDataProvider(this.entity, () => data)
    return what(
      dp,
      async () =>
        await this.helper.setItem(
          dbName,
          this.helper.supportsRawJson
            ? data
            : JSON.stringify(data, undefined, this.formatted ? 2 : undefined),
        ),
    )
  }
  p: Promise<any> = Promise.resolve()
  find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) => dp.find(options)),
    ))
  }
  count(where: Filter): Promise<number> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) => dp.count(where)),
    ))
  }

  update(id: any, data: any): Promise<any> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) =>
        dp.update(id, data).then(async (x) => {
          await save()
          return x
        }),
      ),
    ))
  }
  delete(id: any): Promise<void> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) =>
        dp.delete(id).then(async (x) => {
          await save()
          return x
        }),
      ),
    ))
  }
  async insert(data: any): Promise<any> {
    return (this.p = this.p.then(() =>
      this.loadEntityData((dp, save) =>
        dp.insert(data).then(async (x) => {
          await save()
          return x
        }),
      ),
    ))
  }
}
