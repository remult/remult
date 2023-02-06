import { initDataProvider } from "../server/initDataProvider";
import { Remult } from "../src/context";
import { DataProvider } from "../src/data-interfaces";
import { IdEntity } from "../src/id-entity";
import { LiveQueryStorage, StoredQuery } from "../src/live-query/SubscriptionServer";
import { Entity, Fields, Repository } from "../src/remult3";



export class DataProviderLiveQueryStorage implements LiveQueryStorage {
  repo: Promise<Repository<LiveQueryStorageEntity>>;
  constructor(dataProvider: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>)) {

    this.repo = initDataProvider(dataProvider).then(dp =>
      new Remult(dp).repo(LiveQueryStorageEntity)
    )

  }
  add({ id, entityKey, data }: StoredQuery): void {
    this.repo.then(repo => repo.insert({
      id, entityKey, data
    }))
  }
  remove(queryId: string): void {
    this.repo.then(repo => repo.delete(queryId)).catch(()=>{});
  }

  async forEach(entityKey: string, callback: (args: { query: StoredQuery; setData(data: any): Promise<void>; }) => Promise<void>): Promise<void> {
    const repo = await this.repo;
    let d = new Date();
    d.setMinutes(d.getMinutes() - 5);
    for (const query of await repo.find({ where: { entityKey } })) {
      if (query.lastUsed < d)
        await repo.delete(query);
      else {
        await callback({
          query, setData: async data => {
            query.data = data;
            await repo.save(query);
          },
        })
      }
    }

  }
  async keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]> {
    const repo = await this.repo;
    for (const query of await repo.find({ where: { id: queryIds } })) {
      query.lastUsed = new Date();
      await repo.save(query);
      queryIds = queryIds.filter(x => x !== query.id);
    }
    return queryIds;
  }
}

@Entity(undefined!, {
  dbName: 'remult_live_query_storage'
})
class LiveQueryStorageEntity {
  @Fields.string()
  id = ''
  @Fields.string()
  entityKey = ''
  @Fields.object()
  data: any
  @Fields.date()
  lastUsed = new Date()
}