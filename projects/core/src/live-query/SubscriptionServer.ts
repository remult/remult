import { itemChange } from '../context'
import { findOptionsFromJson } from '../data-providers/rest-data-provider'
import { Repository } from '../remult3'

export interface SubscriptionServer {
  publishMessage<T>(channel: string, message: T): Promise<void>
}

/* @internal*/
export declare type PerformWithContext = (
  serializedRequest: any,
  entityKey: string,
  what: (repo: Repository<any>) => Promise<void>,
) => Promise<void>
/* @internal*/
export class LiveQueryPublisher implements LiveQueryChangesListener {
  constructor(
    private subscriptionServer: () => SubscriptionServer,
    private liveQueryStorage: () => LiveQueryStorage,
    public performWithContext: PerformWithContext,
  ) {}

  runPromise(p: Promise<any>) {}
  debugFileSaver = (x: any) => {}
  async itemChanged(entityKey: string, changes: itemChange[]) {
    //TODO 2 - optimize so that the user will get their messages first. Based on user id
    await this.liveQueryStorage().forEach(
      entityKey,
      async ({ query: q, setData }) => {
        let query = { ...q.data } as QueryData
        await this.performWithContext(
          query.requestJson,
          entityKey,
          async (repo) => {
            const messages = []
            const currentItems = await repo.find(
              findOptionsFromJson(query.findOptionsJson, repo.metadata),
            )
            const currentIds = currentItems.map((x) =>
              repo.getEntityRef(x).getId(),
            )
            for (const id of query.lastIds.filter(
              (y) => !currentIds.includes(y),
            )) {
              let c = changes.find((c) => c.oldId == id)
              if (
                c === undefined ||
                id != c.oldId ||
                !currentIds.includes(c.id)
              )
                messages.push({
                  type: 'remove',
                  data: {
                    id: id,
                  },
                })
            }
            for (const item of currentItems) {
              const itemRef = repo.getEntityRef(item)
              let c = changes.find((c) => c.id == itemRef.getId())
              if (c !== undefined && query.lastIds.includes(c.oldId)) {
                messages.push({
                  type: 'replace',
                  data: {
                    oldId: c.oldId,
                    item: itemRef.toApiJson(),
                  },
                })
              } else if (!query.lastIds.includes(itemRef.getId())) {
                messages.push({
                  type: 'add',
                  data: { item: itemRef.toApiJson() },
                })
              }
            }
            this.debugFileSaver({
              query: q.id,
              currentIds,
              changes,
              lastIds: query.lastIds,
              messages,
            })
            query.lastIds = currentIds
            await setData(query)
            if (messages.length > 0)
              this.subscriptionServer().publishMessage(q.id, messages)
          },
        )
      },
    )
  }
}

/* @internal*/
export interface LiveQueryChangesListener {
  itemChanged(entityKey: string, changes: itemChange[]): Promise<void>
}

// TODO2 - PUBNUB
// TODO2 - https://centrifugal.dev/
export interface LiveQueryStorage {
  add(query: StoredQuery): Promise<void>
  remove(queryId: string): Promise<void>
  forEach(
    entityKey: string,
    callback: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ): Promise<void>
  keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>
}
export class InMemoryLiveQueryStorage implements LiveQueryStorage {
  debugFileSaver = (x: any) => {}
  debug() {
    this.debugFileSaver(this.queries)
  }
  async keepAliveAndReturnUnknownQueryIds(ids: string[]): Promise<string[]> {
    const result = []
    for (const id of ids) {
      let q = this.queries.find((q) => q.id === id)
      if (q) {
        q.lastUsed = new Date().toISOString()
      } else result.push(id)
    }
    this.debug()
    return result
  }

  queries: (StoredQuery & { lastUsed: string })[] = []

  constructor() {}
  async add(query: StoredQuery) {
    this.queries.push({ ...query, lastUsed: new Date().toISOString() })
    this.debug()
  }
  removeCountForTesting = 0
  async remove(id: any) {
    this.queries = this.queries.filter((q) => q.id !== id)
    this.removeCountForTesting++
    this.debug()
  }
  async forEach(
    entityKey: string,
    handle: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ) {
    let d = new Date()
    d.setMinutes(d.getMinutes() - 5)
    this.queries = this.queries.filter((x) => x.lastUsed > d.toISOString())
    for (const q of this.queries) {
      if (q.entityKey === entityKey) {
        await handle({
          query: q,
          setData: async (data) => {
            q.data = data
          },
        })
      }
    }
    this.debug()
  }
}
export interface StoredQuery {
  entityKey: string
  id: string
  data: any
}

export interface QueryData {
  findOptionsJson: any
  requestJson: any
  lastIds: any[]
}
