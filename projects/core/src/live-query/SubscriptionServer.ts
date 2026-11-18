import type { itemChange } from '../context.js'
import { findOptionsFromJson } from '../data-providers/rest-data-provider.js'
import type { Repository } from '../remult3/remult3.js'
import type { LiveQueryChange } from './SubscriptionChannel.js'
import type { SubscriptionServerRouteApi } from '../../server/remult-api-server.js'

export interface SubscriptionServer {
  publishMessage<T>(channel: string, message: T): Promise<void>
  /** A subscription server that also needs to serve http routes (for example SSE),
   * can implement this method to register them on the api server */
  initApiServer?(api: SubscriptionServerRouteApi): void
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
    await this.runPromise(
      this.liveQueryStorage().forEach(
        entityKey,
        async ({ query: q, setData }) => {
          let query = { ...q.data } as QueryData
          // The query is always evaluated against its own entity's repo,
          // even when the change that triggered this evaluation was to a
          // related entity (see relatedEntityKeys below).
          await this.performWithContext(
            query.requestJson,
            q.entityKey,
            async (repo) => {
              const messages: LiveQueryChange[] = []
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
              // When the query includes related entities, a change to a
              // related row doesn't change the item itself, so the id-based
              // diff above can't see it. Compare the full serialized item
              // (relations included) with what was last sent instead.
              const trackRelatedContent =
                (query.relatedEntityKeys?.length ?? 0) > 0
              const nextItemsJson: Record<string, string> = {}
              for (const item of currentItems) {
                const itemRef = repo.getEntityRef(item)
                const id = itemRef.getId()
                if (trackRelatedContent)
                  nextItemsJson[id] = JSON.stringify(itemRef.toApiJson(true))
                let c = changes.find((c) => c.id == id)
                if (c !== undefined && query.lastIds.includes(c.oldId)) {
                  messages.push({
                    type: 'replace',
                    data: {
                      oldId: c.oldId,
                      item: itemRef.toApiJson(),
                    },
                  })
                } else if (!query.lastIds.includes(id)) {
                  messages.push({
                    type: 'add',
                    data: { item: itemRef.toApiJson() },
                  })
                } else if (
                  trackRelatedContent &&
                  // No baseline yet (query registered before this feature):
                  // record it silently instead of replacing everything.
                  query.lastItemsJson !== undefined &&
                  query.lastItemsJson[id] !== nextItemsJson[id]
                ) {
                  messages.push({
                    type: 'replace',
                    data: {
                      oldId: id,
                      item: itemRef.toApiJson(),
                    },
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
              if (trackRelatedContent) query.lastItemsJson = nextItemsJson
              if (messages.length > 0) {
                const from = query.version ?? 0
                query.version = from + 1
                messages.push({ type: 'version', from, to: query.version })
              }
              await setData(query)
              if (messages.length > 0)
                this.subscriptionServer().publishMessage(q.id, messages)
            },
          )
        },
      ),
    )
  }
}

/* @internal*/
export interface LiveQueryChangesListener {
  itemChanged(entityKey: string, changes: itemChange[]): Promise<void>
}

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
  keepAliveAndReturnUnknownQueryIds(
    queryIds: string[],
  ): Promise<LiveQueryKeepAliveResult>
}
export type LiveQueryKeepAliveResult = {
  unknownQueryIds: string[]
  versions: Record<string, number>
}
export class InMemoryLiveQueryStorage implements LiveQueryStorage {
  debugFileSaver = (x: any) => {}
  debug() {
    this.debugFileSaver(this.queries)
  }
  async keepAliveAndReturnUnknownQueryIds(
    ids: string[],
  ): Promise<LiveQueryKeepAliveResult> {
    const unknownQueryIds: string[] = []
    const versions: Record<string, number> = {}
    for (const id of ids) {
      let q = this.queries.find((q) => q.id === id)
      if (q) {
        q.lastUsed = new Date().toISOString()
        versions[id] = (q.data as QueryData)?.version ?? 0
      } else unknownQueryIds.push(id)
    }
    this.debug()
    return { unknownQueryIds, versions }
  }

  queries: (StoredQuery & { lastUsed: string })[] = []

  constructor() {}
  async add(query: StoredQuery) {
    this.queries = this.queries.filter((q) => q.id !== query.id)
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
      // A query is also affected by changes to entities it includes
      // (see QueryData.relatedEntityKeys), not just its own entity.
      if (
        q.entityKey === entityKey ||
        (q.data as QueryData)?.relatedEntityKeys?.includes(entityKey)
      ) {
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
  version?: number
  /** Entity keys of related entities reachable through the query's `include`
   * options, at any level of nesting. A change to any of them re-evaluates
   * this query. Empty/absent for queries without includes (and for queries
   * registered before this was introduced). */
  relatedEntityKeys?: string[]
  /** Full serialized item (relations included) per item id, from the last
   * evaluation. Lets the publisher notice when only a related entity's
   * content changed. Absent until the first evaluation that tracks it. */
  lastItemsJson?: Record<string, string>
}
