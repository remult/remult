import { buildRestDataProvider } from '../buildRestDataProvider.js'
import type { ApiClient } from '../context.js'
import { RestDataProvider } from '../data-providers/rest-data-provider.js'
import { remultStatic } from '../remult-static.js'
import type {
  FindOptions,
  LiveQueryChangeInfo,
  Repository,
} from '../remult3/remult3.js'
import { flags } from '../remult3/remult3.js'
import { getRepositoryInternals } from '../remult3/repository-internals.js'
import type {
  SubscriptionClientConnection,
  SubscriptionListener,
  Unsubscribe,
} from './SubscriptionChannel.js'
import {
  liveQueryKeepAliveRoute,
  LiveQuerySubscriber,
  onBrowserForeground,
} from './SubscriptionChannel.js'
/* @internal*/
export class LiveQueryClient {
  wrapMessageHandling(handleMessage: VoidFunction) {
    var x = this.apiProvider().wrapMessageHandling
    if (x) x(handleMessage)
    else handleMessage()
  }
  private queries = new Map<string, LiveQuerySubscriber<any>>()
  private channels = new Map<string, MessageChannel<any>>()
  hasQueriesForTesting() {
    return this.queries.size > 0
  }
  constructor(
    private apiProvider: () => ApiClient,
    private getUserId: () => string | undefined,
  ) {}
  runPromise<X>(p: Promise<X>) {
    return p
  }
  close() {
    this.queries.clear()
    this.channels.clear()
    this.detachForeground()
    this.closeIfNoListeners()
  }
  async subscribeChannel<T>(
    key: string,
    onResult: SubscriptionListener<T>,
  ): Promise<Unsubscribe> {
    let onUnsubscribe: VoidFunction = () => {}
    const client = await this.openIfNoOpened()
    try {
      let q = this.channels.get(key)
      if (!q) {
        this.channels.set(key, (q = new MessageChannel()))

        try {
          q.unsubscribe = await client.subscribe(
            key,
            (value) => this.wrapMessageHandling(() => q!.handle(value)),
            (err) => {
              onResult.error(err)
            },
          )
        } catch (err: any) {
          // drop the half-registered channel so the next subscribe retries
          // instead of joining a channel that was never subscribed
          this.channels.delete(key)
          q.listeners.forEach((l) => l.error(err))
          this.closeIfNoListeners()
          throw err
        }
      }

      q.listeners.push(onResult)
      onUnsubscribe = () => {
        q!.listeners.splice(q!.listeners.indexOf(onResult), 1)
        if (q!.listeners.length == 0) {
          this.channels.delete(key)
          q!.unsubscribe()
        }
        this.closeIfNoListeners()
      }
    } catch (err: any) {
      onResult.error(err)
      throw err
    }
    return () => {
      onUnsubscribe()
      onUnsubscribe = () => {}
    }
  }

  private closeIfNoListeners() {
    if (this.queries.size === 0 && this.channels.size === 0) {
      if (this.client)
        this.runPromise(this.client.then((x) => x.close()).catch(() => {}))
      this.client = undefined
      this.openedConnection = undefined
      this.detachForeground()
      clearInterval(this.interval)
      this.interval = undefined
    }
  }

  subscribe<entityType>(
    repo: Repository<entityType>,
    options: FindOptions<entityType>,
    listener: SubscriptionListener<LiveQueryChangeInfo<entityType>>,
  ) {
    let alive = true
    let onUnsubscribe: VoidFunction = () => {
      alive = false
    }
    this.runPromise(
      getRepositoryInternals(repo)
        ._buildEntityDataProviderFindOptions(options)
        .then((opts) => {
          if (!alive) return
          const { createKey, subscribe } = new RestDataProvider(
            this.apiProvider,
          )
            .getEntityDataProvider(repo.metadata)
            .buildFindRequest(opts)
          const eventTypeKey = createKey()
          let q = this.queries.get(eventTypeKey)!
          if (!q) {
            this.queries.set(
              eventTypeKey,
              (q = new LiveQuerySubscriber(
                repo,
                { entityKey: repo.metadata.key, options },
                this.getUserId(),
              )),
            )
            q.subscribeCode = () => {
              q.snapshotReady = false
              q.droppedWhilePending = false
              q.unsubscribeChannel()

              let unsubscribeToChannel: Unsubscribe = () => {}
              q.unsubscribeChannel = () => {
                unsubscribeToChannel()
                unsubscribeToChannel = () => {}
              }
              q.unsubscribe = () => {
                q.unsubscribe = () => {}
                q.unsubscribeChannel()
                q.unsubscribeQuery()
              }

              let snapshotDone = false
              const applySnapshot = (r: {
                result: any
                unsubscribe: () => any
              }) => {
                if (q.listeners.length === 0) {
                  r.unsubscribe()
                  return
                }
                q.unsubscribeQuery = () => {
                  this.runPromise(r.unsubscribe())
                }
                snapshotDone = true
                return this.runPromise(
                  q.setAllItems(r.result).then(() => {
                    if (q.droppedWhilePending) return this.runKeepAlive()
                  }),
                )
              }

              this.runPromise(
                this.subscribeChannel(q.queryChannel, {
                  next: (value: any) => this.runPromise(q.handle(value)),
                  complete: () => {},
                  error: (er) => {
                    q.listeners.forEach((l) => l.error(er))
                  },
                })
                  .then((unsub) => {
                    if (q.listeners.length == 0) {
                      unsub()
                      return
                    }
                    unsubscribeToChannel = unsub
                    if (snapshotDone)
                      return this.runPromise(this.runKeepAlive())
                  })
                  .catch((err) => {
                    q.listeners.forEach((l) => l.error(err))
                  }),
              )

              this.runPromise(
                subscribe(q.queryChannel)
                  .then(applySnapshot)
                  .catch((err) => {
                    q.listeners.forEach((l) => l.error(err))
                    unsubscribeToChannel()
                    this.queries.delete(eventTypeKey)
                    this.closeIfNoListeners()
                  }),
              )
            }
            q.subscribeCode()
          } else {
            q.sendDefaultState(listener.next)
          }
          q.listeners.push(listener)
          onUnsubscribe = () => {
            q.listeners.splice(q.listeners.indexOf(listener), 1)
            listener.complete()
            if (q.listeners.length == 0) {
              this.queries.delete(eventTypeKey)
              q.unsubscribe()
            }
            this.closeIfNoListeners()
          }
        })
        .catch((err) => {
          listener.error(err)
        }),
    )

    return () => {
      onUnsubscribe()
    }
  }
  client?: Promise<SubscriptionClientConnection>
  openedConnection?: SubscriptionClientConnection
  interval: any
  lastKeepAliveAt = 0
  private keepAliveBackoffMs = flags.liveQueryPollWhenStaleMs
  private keepAliveInFlight?: Promise<boolean>
  private foregroundKeepAliveTimer: ReturnType<typeof setTimeout> | undefined
  isSseStale() {
    const conn = this.openedConnection
    if (!conn || conn.lastServerEvent === undefined) return false
    return Date.now() - conn.lastServerEvent > flags.sseStaleMs
  }
  async runKeepAlive() {
    if (this.keepAliveInFlight) return this.keepAliveInFlight
    this.keepAliveInFlight = this.sendKeepAlive().finally(() => {
      this.keepAliveInFlight = undefined
    })
    return this.keepAliveInFlight
  }
  /** Resolves true when a query was refetched. */
  private async sendKeepAlive() {
    const ids: string[] = []
    for (const q of this.queries.values()) {
      if (!q.snapshotReady) continue
      ids.push(q.queryChannel)
    }
    if (ids.length === 0) return false
    let p = this.apiProvider()
    const raw: unknown = await this.runPromise(
      remultStatic.actionInfo.runActionWithoutBlockingUI(() =>
        buildRestDataProvider(p.httpClient).post(
          p.url + '/' + liveQueryKeepAliveRoute,
          { queryIds: ids },
        ),
      ),
    )
    const unknownIds: string[] = Array.isArray(raw)
      ? raw
      : ((raw as { unknownQueryIds?: string[] })?.unknownQueryIds ?? [])
    const versions: Record<string, number> = Array.isArray(raw)
      ? {}
      : ((raw as { versions?: Record<string, number> })?.versions ?? {})
    let reloaded = false
    for (const q of this.queries.values()) {
      const serverVersion = versions[q.queryChannel]
      const unknown = unknownIds.includes(q.queryChannel)
      // server returns versions on every keep-alive, so a missed message is
      // caught even while SSE pings look healthy
      const mismatch =
        serverVersion !== undefined && serverVersion !== q.version
      if (unknown || mismatch) {
        reloaded = true
        if (serverVersion !== undefined) q.version = serverVersion
        q.subscribeCode!()
      }
    }
    return reloaded
  }
  private async maybeKeepAlive() {
    const stale = this.isSseStale()
    if (!stale) this.keepAliveBackoffMs = flags.liveQueryPollWhenStaleMs
    const interval = stale
      ? this.keepAliveBackoffMs
      : flags.liveQueryKeepAliveMs
    if (Date.now() - this.lastKeepAliveAt < interval) return
    this.lastKeepAliveAt = Date.now()
    if (stale) this.openedConnection?.resume?.(true)
    const reloaded = await this.runKeepAlive()
    // backoff lives here so channel-only clients (no query ids) back off too
    if (this.isSseStale())
      this.keepAliveBackoffMs = reloaded
        ? flags.liveQueryPollWhenStaleMs
        : Math.min(this.keepAliveBackoffMs * 2, flags.liveQueryKeepAliveMs)
  }
  private detachForeground = () => {}
  private attachForeground() {
    this.detachForeground()
    const unsub = onBrowserForeground(() => {
      this.openedConnection?.resume?.()
      if (this.foregroundKeepAliveTimer !== undefined)
        clearTimeout(this.foregroundKeepAliveTimer)
      this.foregroundKeepAliveTimer = setTimeout(() => {
        this.foregroundKeepAliveTimer = undefined
        this.keepAliveBackoffMs = flags.liveQueryPollWhenStaleMs
        this.lastKeepAliveAt = 0
        this.runPromise(this.runKeepAlive())
      }, 300)
    })
    this.detachForeground = () => {
      unsub()
      if (this.foregroundKeepAliveTimer !== undefined) {
        clearTimeout(this.foregroundKeepAliveTimer)
        this.foregroundKeepAliveTimer = undefined
      }
      this.detachForeground = () => {}
    }
  }
  private startKeepAlive() {
    // openConnection may reject and be retried with queries still alive
    if (this.interval !== undefined) return
    this.lastKeepAliveAt = Date.now()
    this.keepAliveBackoffMs = flags.liveQueryPollWhenStaleMs
    this.attachForeground()
    this.interval = setInterval(
      () => {
        this.runPromise(this.maybeKeepAlive())
      },
      Math.min(flags.liveQueryPollWhenStaleMs, flags.liveQueryKeepAliveMs),
    )
  }
  private openIfNoOpened() {
    if (!this.client) {
      this.startKeepAlive()
      return this.runPromise(
        (this.client = this.apiProvider()
          .subscriptionClient!.openConnection(() => {
            for (const q of this.queries.values()) {
              q.subscribeCode!()
            }
            for (const c of this.channels.values()) {
              for (const l of c.listeners) l.reconnect?.()
            }
          })
          .then((c) => {
            this.openedConnection = c
            return c
          })
          .catch((err) => {
            this.client = undefined
            this.openedConnection = undefined
            this.closeIfNoListeners()
            throw err
          })),
      )
    }

    return this.client
  }
}

class MessageChannel<T> {
  unsubscribe: VoidFunction = () => {}
  async handle(message: T) {
    for (const l of this.listeners) {
      l.next(message)
    }
  }

  listeners: SubscriptionListener<T>[] = []
  constructor() {}
}
