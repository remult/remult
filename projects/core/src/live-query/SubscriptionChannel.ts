import type { Remult } from '../context.js'
import type { FieldMetadata } from '../column-interfaces.js'
import { Sort } from '../sort.js'
import { remult as defaultRemult } from '../remult-proxy.js'
import type {
  EntityFilter,
  FindOptions,
  LiveQueryChangeInfo,
  Repository,
} from '../remult3/remult3.js'
import { getRepositoryInternals } from '../remult3/repository-internals.js'
import { getEntityRef } from '../remult3/getEntityRef.js'
import type { RelationFieldInfo } from '../remult3/relationInfoMember.js'
import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'

export const streamUrl = 'stream'
//@internal
export class LiveQuerySubscriber<entityType> {
  sendDefaultState(onResult: (info: LiveQueryChangeInfo<entityType>) => void) {
    onResult(
      this.createReducerType(
        () => [...this.defaultQueryState],
        this.allItemsMessage(this.defaultQueryState),
      ),
    )
  }
  queryChannel: string
  subscribeCode?: () => void
  unsubscribe: VoidFunction = () => {}
  unsubscribeChannel: VoidFunction = () => {}
  unsubscribeQuery: VoidFunction = () => {}
  snapshotReady = false
  droppedWhilePending = false
  /** The raw json rows behind the current items. Re-running
   * `_fromJsonArray` on them re-resolves the included relations with fresh
   * follow-up finds — how a related-entity change refreshes this query
   * (see #712). Kept in step with the items in `setAllItems` / `handle`. */
  rawRows: any[] | undefined
  private relationTracker: LiveQueryRelationTracker<entityType> | undefined
  /** Tear down the follow-up live queries that track this query's included
   * relations (see #712). Called when the outer query is unsubscribed. */
  disposeRelationSubscriptions() {
    this.relationTracker?.dispose()
  }
  /** Replace the given items (matched by id) with refreshed instances and
   * notify the listeners with `replace` changes. Used by the relation
   * tracker when a related entity changed (see #712). This is a client-side
   * refresh only — it does not touch the server version counter. */
  applyRelatedRefresh(
    replacements: { oldId: any; item: entityType }[],
  ) {
    if (replacements.length === 0) return
    const byId = new Map<any, entityType>()
    for (const r of replacements) byId.set(r.oldId, r.item)
    this.forListeners(
      (listener) => {
        listener((items) =>
          (items ?? []).map(
            (x) =>
              byId.get(this.repo.metadata.idMetadata.getId(x)) ?? x,
          ),
        )
      },
      replacements.map(
        (r) =>
          ({
            type: 'replace',
            data: { oldId: r.oldId, item: r.item },
          }) as LiveQueryChange,
      ),
    )
  }
  private updateRawRows(
    data: LiveQueryChange[],
    rawAddReplace: { type: 'add' | 'replace'; oldId?: any; item: any }[],
  ) {
    if (this.rawRows === undefined) return
    for (const m of data) {
      if (m.type === 'all') {
        this.rawRows = [...(m.data as any[])]
      } else if (m.type === 'remove') {
        const id = (m.data as { id: any }).id
        this.rawRows = this.rawRows.filter(
          (row) => this.repo.metadata.idMetadata.getId(row) !== id,
        )
      }
    }
    for (const r of rawAddReplace) {
      if (r.type === 'replace' && r.oldId !== undefined) {
        this.rawRows = this.rawRows.filter(
          (row) => this.repo.metadata.idMetadata.getId(row) !== r.oldId,
        )
      }
      const id = this.repo.metadata.idMetadata.getId(r.item)
      this.rawRows = this.rawRows.filter(
        (row) => this.repo.metadata.idMetadata.getId(row) !== id,
      )
      this.rawRows.push(r.item)
    }
  }
  async setAllItems(result: any[]) {
    // server re-registers the query at version 0; reset before the await so a
    // version message landing mid-parse is judged against the new baseline
    this.version = 0
    this.rawRows = [...result]
    const items = await getRepositoryInternals(this.repo)._fromJsonArray(
      result,
      this.query.options,
    )
    this.forListeners((listener) => {
      listener(() => {
        return items
      })
    }, this.allItemsMessage(items))
    this.snapshotReady = true
    this.relationTracker?.sync()
  }

  private allItemsMessage(items: entityType[]): LiveQueryChange[] {
    return [
      {
        type: 'all',
        data: items,
      },
    ]
  }

  forListeners(
    what: (
      listener: (
        reducer: LiveQueryChangeInfo<entityType>['applyChanges'],
      ) => void,
    ) => void,
    changes: LiveQueryChange[],
  ) {
    what((reducer) => {
      this.defaultQueryState = reducer(this.defaultQueryState)
    })

    for (const l of this.listeners) {
      what((reducer) => {
        l.next(this.createReducerType(reducer, changes))
      })
    }
  }

  private createReducerType(
    applyChanges: LiveQueryChangeInfo<entityType>['applyChanges'],
    changes: LiveQueryChange[],
  ): LiveQueryChangeInfo<entityType> {
    return {
      applyChanges,
      changes,
      items: this.defaultQueryState,
    }
  }

  async handle(messages: LiveQueryChange[]) {
    // the pending snapshot supersedes anything in flight; the keep-alive
    // after it lands catches whatever was dropped here
    if (!this.snapshotReady) {
      this.droppedWhilePending = true
      return
    }
    const ver = messages.find(
      (m): m is Extract<LiveQueryChange, { type: 'version' }> =>
        m.type === 'version',
    )
    // any gap, forward or backward, means a message was missed or two servers
    // published the same version with different diffs: refetch instead of drop
    if (ver && ver.from !== this.version) {
      this.version = ver.to
      this.subscribeCode?.()
      return
    }
    // bump before the await below, so a second message delivered in the same
    // tick is judged against this one and not mistaken for a gap
    if (ver) this.version = ver.to
    const data = messages.filter((m) => m.type !== 'version')
    {
      let x = data.filter(({ type }) => type == 'add' || type == 'replace')
      // capture the raw json before it is replaced by the loaded entities
      // below, so the raw rows behind the items stay in step (see #712)
      const rawAddReplace = x.map((m) => ({
        type: m.type as 'add' | 'replace',
        oldId:
          m.type === 'replace'
            ? (m.data as { oldId: any }).oldId
            : undefined,
        item: (m.data as { item: any }).item,
      }))
      let loadedItems = await getRepositoryInternals(this.repo)._fromJsonArray(
        x.map((m) => m.data.item),
        this.query.options,
      )
      for (let index = 0; index < x.length; index++) {
        const element = x[index]
        element.data.item = loadedItems[index]
      }
      this.updateRawRows(data, rawAddReplace)
    }

    this.forListeners((listener) => {
      listener((items, { pos = 'auto' } = {}) => {
        if (!items) items = []
        for (const message of data) {
          switch (message.type) {
            case 'all':
              this.setAllItems(message.data)
              break
            case 'replace': {
              items = items.map((x) =>
                this.repo.metadata.idMetadata.getId(x) === message.data.oldId
                  ? message.data.item
                  : x,
              )
              break
            }
            case 'add':
              items = items.filter(
                (x) =>
                  this.repo.metadata.idMetadata.getId(x) !==
                  this.repo.metadata.idMetadata.getId(message.data.item),
              )
              if (pos === 'first') items.unshift(message.data.item)
              else items.push(message.data.item)
              break
            case 'remove':
              items = items.filter(
                (x) =>
                  this.repo.metadata.idMetadata.getId(x) !== message.data.id,
              )
              break
          }
        }
        const orderBy =
          this.query.options.orderBy ??
          this.repo.metadata.options.defaultOrderBy
        if (
          pos === 'auto' &&
          orderBy &&
          data.some((m) => m.type === 'add' || m.type === 'replace')
        ) {
          const o = Sort.translateOrderByToSort(this.repo.metadata, orderBy)
          items.sort((a: any, b: any) => o.compare(a, b))
        }
        return items
      })
    }, data)
    if (!ver && data.length > 0) this.version++
    // the item set may have changed (add / remove / fk switch): the tracked
    // related rows change with it (see #712)
    this.relationTracker?.sync()
  }

  defaultQueryState: entityType[] = []
  listeners: SubscriptionListener<LiveQueryChangeInfo<entityType>>[] = []
  id = String(crypto.randomUUID())
  version = 0
  constructor(
    private repo: Repository<entityType>,
    private query: SubscribeToQueryArgs<entityType>,
    userId: string | undefined,
    runPromise: (p: Promise<any>) => Promise<any> = (p) => p,
  ) {
    this.queryChannel = `users:${userId}:queries:${this.id}`
    this.id = this.queryChannel
    this.relationTracker = new LiveQueryRelationTracker(
      this.repo,
      this.query.options,
      this,
      runPromise,
    )
  }
}

/**
 * Tracks the related rows of a live query's included relations, on the
 * frontend, as the maintainer requested for #712: each relation is another
 * find call to the backend, and that follow-up find is turned into a live
 * query call of its own, owned by the outer live query. When a related row
 * changes, the follow-up live query fires and the outer items are refreshed
 * with fresh related data.
 *
 * The follow-up live queries have their own channels (their own server
 * registrations): the live-query storage replaces a stored query when a
 * second one is added with the same id, so a related query cannot share the
 * outer query's channel without a storage / wire-protocol change. The
 * observable behaviour is the same — the related subscriptions live and die
 * with the outer query and only ever refresh its items.
 */
class LiveQueryRelationTracker<entityType> {
  private tracked = new Map<
    string,
    { unsubscribe: () => void; whereJson: string }
  >()
  private refreshChain: Promise<void> = Promise.resolve()
  private generation = 0
  private disposed = false

  constructor(
    private repo: Repository<entityType>,
    private options: FindOptions<entityType>,
    private subscriber: LiveQuerySubscriber<entityType>,
    private runPromise: (p: Promise<any>) => Promise<any>,
  ) {}

  dispose() {
    this.disposed = true
    this.generation++
    for (const t of this.tracked.values()) t.unsubscribe()
    this.tracked.clear()
  }

  /** (Re)build the follow-up live queries for the currently loaded items. */
  sync() {
    if (this.disposed) return
    const items = this.subscriber.defaultQueryState
    const wanted = new Map<
      string,
      { rel: RelationFieldInfo; innerOptions: FindOptions<any>; whereJson: string }
    >()
    for (const { field, rel, incl } of this.includedRelations()) {
      const where = this.buildRelationWhere(rel, field, incl, items)
      if (!where) continue
      const innerOptions: FindOptions<any> = { where }
      if (incl && typeof incl === 'object' && (incl as any).include)
        innerOptions.include = (incl as any).include
      wanted.set(field.key, {
        rel,
        innerOptions,
        whereJson: JSON.stringify(where),
      })
    }
    for (const [key, t] of this.tracked) {
      const w = wanted.get(key)
      if (!w || w.whereJson !== t.whereJson) {
        t.unsubscribe()
        this.tracked.delete(key)
      }
    }
    for (const [key, w] of wanted) {
      if (this.tracked.has(key)) continue
      const unsubscribe = w.rel.toRepo.liveQuery(w.innerOptions).subscribe({
        next: () => this.scheduleRefresh(),
        error: () => {},
        complete: () => {},
      })
      this.tracked.set(key, { unsubscribe, whereJson: w.whereJson })
    }
  }

  private includedRelations(): {
    field: FieldMetadata
    rel: RelationFieldInfo
    incl: any
  }[] {
    const include = (this.options as any)?.include
    const result: {
      field: FieldMetadata
      rel: RelationFieldInfo
      incl: any
    }[] = []
    for (const field of this.repo.metadata.fields.toArray()) {
      const rel = getRelationFieldInfo(field)
      if (!rel) continue
      let incl = (field.options as any).defaultIncluded
      if (include !== undefined && include[field.key as any] !== undefined)
        incl = include[field.key as any]
      if (incl) result.push({ field, rel, incl })
    }
    return result
  }

  private buildRelationWhere(
    rel: RelationFieldInfo,
    field: FieldMetadata,
    incl: any,
    items: entityType[],
  ): EntityFilter<any> | undefined {
    const internals = getRepositoryInternals(this.repo)
    const wheres: any[] = []
    for (const row of items) {
      const { findOptions, returnNull, returnUndefined } =
        internals._findOptionsBasedOnRelation(
          rel,
          field,
          incl,
          row,
          rel.toRepo,
        )
      if (returnNull || returnUndefined) continue
      if (findOptions?.where) wheres.push(findOptions.where)
    }
    if (wheres.length === 0) return undefined
    return mergeRelationWheres(wheres)
  }

  private scheduleRefresh() {
    if (this.disposed) return
    const gen = ++this.generation
    this.refreshChain = this.refreshChain.then(() =>
      this.refreshRelations(gen),
    )
    this.refreshChain.catch(() => {})
    // route through runPromise so test harnesses that track pending work
    // (and the live-query keep-alive) observe the refresh
    this.runPromise(this.refreshChain)
  }

  private async refreshRelations(gen: number) {
    if (this.disposed || gen !== this.generation) return
    const rawRows = this.subscriber.rawRows
    if (!rawRows || rawRows.length === 0) return
    // re-resolve the relations with fresh follow-up finds; the outer rows
    // themselves are not re-fetched
    const freshItems = await getRepositoryInternals(
      this.repo,
    )._fromJsonArray(rawRows, this.options)
    if (this.disposed || gen !== this.generation) return
    const freshById = new Map<any, entityType>()
    for (const item of freshItems)
      freshById.set(this.repo.metadata.idMetadata.getId(item), item)
    const replacements: { oldId: any; item: entityType }[] = []
    for (const oldItem of this.subscriber.defaultQueryState) {
      const id = this.repo.metadata.idMetadata.getId(oldItem)
      const fresh = freshById.get(id)
      if (fresh && !this.relationsEqual(oldItem, fresh))
        replacements.push({ oldId: id, item: fresh })
    }
    if (replacements.length > 0)
      this.subscriber.applyRelatedRefresh(replacements)
    // the refresh may have picked up fk changes: re-sync the tracked set
    this.sync()
  }

  private relationsEqual(oldItem: entityType, freshItem: entityType): boolean {
    for (const { field, rel } of this.includedRelations()) {
      const a = (oldItem as any)[field.key]
      const b = (freshItem as any)[field.key]
      if (!this.relatedValueEquals(a, b, rel.toRepo as Repository<any>))
        return false
    }
    return true
  }

  private relatedValueEquals(
    a: any,
    b: any,
    relRepo: Repository<any>,
  ): boolean {
    if (a === b) return true
    if (a == null || b == null) return a == b
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
        return false
      return a.every((x, i) => this.relatedValueEquals(x, b[i], relRepo))
    }
    return (
      JSON.stringify((getEntityRef(a) as any).toApiJson(true)) ===
      JSON.stringify((getEntityRef(b) as any).toApiJson(true))
    )
  }
}

/** Merge the per-row relation wheres into one where for the follow-up live
 * query. When every row filters on the same single field with a scalar value
 * (the toOne / toMany cases), the values merge into one `$in` filter; anything
 * else (compound ids, extra conditions from the include) falls back to an
 * `$or` of the per-row wheres, which is always correct. */
function mergeRelationWheres(wheres: any[]): any {
  let key: string | undefined
  const values: any[] = []
  for (const w of wheres) {
    const and = w?.$and
    if (!Array.isArray(and) || and.length !== 1) return { $or: wheres }
    const cond = and[0]
    const keys = Object.keys(cond)
    if (keys.length !== 1) return { $or: wheres }
    const k = keys[0]
    const v = cond[k]
    if (v === null || typeof v === 'object') return { $or: wheres }
    if (key === undefined) key = k
    else if (key !== k) return { $or: wheres }
    if (!values.includes(v)) values.push(v)
  }
  return { [key!]: values }
}

export interface SubscriptionListener<type> {
  next(message: type): void
  error(err: any): void
  complete(): void
  /** The connection was re-established; messages published meanwhile were lost, refetch state if needed. */
  reconnect?(): void
}

export type Unsubscribe = VoidFunction
//@internal
export function onBrowserForeground(handler: VoidFunction): Unsubscribe {
  if (typeof document === 'undefined') return () => {}
  function onForeground() {
    if (document.visibilityState === 'hidden') return
    handler()
  }
  document.addEventListener('visibilitychange', onForeground)
  window.addEventListener('online', onForeground)
  window.addEventListener('pageshow', onForeground)
  return () => {
    document.removeEventListener('visibilitychange', onForeground)
    window.removeEventListener('online', onForeground)
    window.removeEventListener('pageshow', onForeground)
  }
}
export interface SubscriptionClientConnection {
  subscribe(
    channel: string,
    onMessage: (message: any) => void,
    onError: (err: any) => void,
  ): Promise<Unsubscribe>
  close(): void
  /** SSE clients set this; missing means no heartbeat tracking (Ably, tests). */
  lastServerEvent?: number
  /** Foreground / online: reconnect now, skip backoff. `force` kills an OPEN zombie. */
  resume?: (force?: boolean) => void
}

export interface SubscriptionClient {
  openConnection(
    onReconnect: VoidFunction,
  ): Promise<SubscriptionClientConnection>
}

export const liveQueryKeepAliveRoute = '_liveQueryKeepAlive'

interface SubscribeToQueryArgs<entityType = unknown> {
  entityKey: string
  options: FindOptions<entityType>
}
export declare type LiveQueryChange =
  | {
      type: 'all'
      data: any[]
    }
  | {
      type: 'add'
      data: any
    }
  | {
      type: 'replace'
      data: {
        oldId: any
        item: any
      }
    }
  | {
      type: 'remove'
      data: { id: any }
    }
  | {
      type: 'version'
      from: number
      to: number
    }
//@internal
export interface SubscribeResult {
  result: []
  queryChannel: string
}

//@internal
export interface ServerEventChannelSubscribeDTO {
  clientId: string
  channel: string
}
/**
 * The `SubscriptionChannel` class is used to send messages from the backend to the frontend,
 * using the same mechanism used by live queries.
 *
 * @template messageType The type of the message that the channel will handle.
 * @example
 * ```ts
 * // Defined in code that is shared between the frontend and the backend
 * export const notif = new SubscriptionChannel<{ coolInfo: string }>("notif");
 *
 * // Backend: Publishing a message
 * notif.publish({ coolInfo: "Message coming from the backend" });
 *
 * // Frontend: Subscribing to messages
 * notif.subscribe((message) => {
 *     console.log(`Something exciting happened: ${message.coolInfo}`);
 * });
 *
 * // Note: If you want to publish from the frontend, use a BackendMethod for that.
 * ```
 *  ---
 *
 *  ### Use cases:
 *
 *  #### A user _(Paul)_ wants to notify everyone _(Eric & Simona)_
 *  ```ts
 *  // shared code between the frontend and the backend
 *  export const notif = new SubscriptionChannel<{ from: UserInfo, msg: string }>("notif");
 *
 *  // Frontend, Paul can call a BackendMethod to send his message
 *  NotificationContoller.send("Hello everyone!")
 *
 *  // Backend
 *  export class NotificationContoller {
 *    @BackendMethod({ allowed: true })
 *    static async send(message: string) {
 *      notif.publish({ from: remult.user, msg: message });
 *    }
 *  }
 *
 *  // Frontend: Eric & Simona can subscribe to messages
 *  notif.subscribe((message) => {
 *    if (message.from === remult.user) return;
 *    console.log(`Message from ${message.from.name}: ${message.msg}`);
 *  });
 *  ```
 *
 *  #### A complexe chart that needs to be updated on multiple changes
 *  ```ts
 *  // shared code between the frontend and the backend
 *  export const chart = new SubscriptionChannel<{ kind: "pie" | "bar" | "line", data: number[] }>("chart");
 *
 *  // Entity
 *  @Entity<Task>("tasks", {
 *    saved: async (e) => {
 *      if (e.completed) chart.publish({ kind: "pie", data: [1, 2, 3] });
 *    }
 *  })
 *  export class Task { ... }
 *
 *  // Frontend: in the chart component, we can subscribe to messages
 *  chart.subscribe((message) => {
 *    chartData = message.data;
 *  });
 *  ```
 *
 *  #### Recovering after a dropped connection
 *  Messages published while the connection was down are not replayed.
 *  Use the `reconnect` listener to refetch state:
 *  ```ts
 *  chart.subscribe({
 *    next: (message) => (chartData = message.data),
 *    reconnect: () => loadChartData(),
 *  });
 *  ```
 *
 */
export class SubscriptionChannel<messageType> {
  /**
   * Constructs a new `SubscriptionChannel` instance.
   *
   * @param {string} channelKey The key that identifies the channel.
   */
  constructor(public channelKey: string) {}
  /**
   * Publishes a message to the channel. This method should only be used on the backend.
   *
   * @param {messageType} message The message to be published.
   * @param {Remult} [remult] An optional instance of Remult to use for publishing the message.
   */
  publish(message: messageType, remult?: Remult) {
    remult = remult || defaultRemult
    remult.subscriptionServer!.publishMessage(this.channelKey, message)
  }
  /**
   * Subscribes to messages from the channel. This method should only be used on the frontend.
   *
   * @param {(message: messageType) => void} next A function that will be called with each message received.
   * @param {Remult} [remult] An optional instance of Remult to use for the subscription.
   * @returns {Promise<Unsubscribe>} A promise that resolves to a function that can be used to unsubscribe from the channel.
   */
  subscribe(
    next: (message: messageType) => void,
    remult?: Remult,
  ): Promise<Unsubscribe>
  /**
   * Subscribes to messages from the channel using a `SubscriptionListener` object.
   *
   * @param {Partial<SubscriptionListener<messageType>>} listener An object that implements the `SubscriptionListener` interface.
   * @returns {Promise<Unsubscribe>} A promise that resolves to a function that can be used to unsubscribe from the channel.
   */
  subscribe(
    listener: Partial<SubscriptionListener<messageType>>,
  ): Promise<Unsubscribe>
  //@internal
  subscribe(
    next:
      | ((message: messageType) => void)
      | Partial<SubscriptionListener<messageType>>,
    remult?: Remult,
  ): Promise<Unsubscribe> {
    remult = remult || defaultRemult

    let listener = next as Partial<SubscriptionListener<messageType>>
    if (typeof next === 'function') {
      listener = {
        next,
      }
    }
    listener.error ??= () => {}
    listener.complete ??= () => {}

    return remult.liveQuerySubscriber.subscribeChannel(
      this.channelKey,
      listener as SubscriptionListener<messageType>,
    )
  }
}

//TODO2 - consider moving the queued job mechanism into this.
