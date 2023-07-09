import {
  FindOptions,
  remult as defaultRemult,
  Repository,
  RestDataProviderHttpProvider,
  UrlBuilder,
} from '../../index'
import {
  RestDataProvider,
  RestEntityDataProvider,
} from '../data-providers/rest-data-provider'
import type { LiveQueryChangeInfo, RepositoryImplementation } from '../remult3'
import { buildRestDataProvider } from '../buildRestDataProvider'
import {
  LiveQuerySubscriber,
  SubscriptionClient,
  SubscribeResult,
  SubscriptionClientConnection,
  liveQueryKeepAliveRoute,
  Unsubscribe,
  SubscriptionListener,
} from './SubscriptionChannel'
import type { ApiClient } from '../../index'
/* @internal*/
export class LiveQueryClient {
  wrapMessageHandling(handleMessage) {
    var x = this.apiProvider().wrapMessageHandling
    if (x) x(handleMessage)
    else handleMessage()
  }
  private queries = new Map<string, LiveQuerySubscriber<any>>()
  hasQueriesForTesting() {
    return this.queries.size > 0
  }
  private channels = new Map<string, MessageChannel<any>>()
  constructor(
    private apiProvider: () => ApiClient,
    private getUserId: () => string,
  ) {}
  runPromise<X>(p: Promise<X>) {
    return p
  }
  close() {
    this.queries.clear()
    this.channels.clear()
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
            (value) => this.wrapMessageHandling(() => q.handle(value)),
            (err) => {
              onResult.error(err)
            },
          )
        } catch (err: any) {
          onResult.error(err)
          throw err
        }
      }

      q.listeners.push(onResult)
      onUnsubscribe = () => {
        q.listeners.splice(q.listeners.indexOf(onResult), 1)
        if (q.listeners.length == 0) {
          this.channels.delete(key)
          q.unsubscribe()
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
    if (this.client)
      if (this.queries.size === 0 && this.channels.size === 0) {
        this.runPromise(this.client.then((x) => x.close()))
        this.client = undefined
        clearInterval(this.interval)
        this.interval = undefined
      }
  }

  subscribe<entityType>(
    repo: RepositoryImplementation<entityType>,
    options: FindOptions<entityType>,
    listener: SubscriptionListener<LiveQueryChangeInfo<entityType>>,
  ) {
    let alive = true
    let onUnsubscribe: VoidFunction = () => {
      alive = false
    }
    this.runPromise(
      (repo as RepositoryImplementation<entityType>)
        .buildEntityDataProviderFindOptions(options)
        .then((opts) => {
          if (!alive) return
          const { createKey, subscribe } = new RestDataProvider(
            this.apiProvider,
          )
            .getEntityDataProvider(repo.metadata)
            .buildFindRequest(opts)
          const eventTypeKey = createKey()
          let q = this.queries.get(eventTypeKey)
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
              if (q.unsubscribe) {
                q.unsubscribe()
                q.unsubscribe = () => {}
              }

              this.runPromise(
                this.subscribeChannel(q.queryChannel, {
                  next: (value: any) => this.runPromise(q.handle(value)),
                  complete: () => {},
                  error: (er) => {
                    q.listeners.forEach((l) => l.error(er))
                  },
                }).then((unsubscribeToChannel) => {
                  if (q.listeners.length == 0) {
                    unsubscribeToChannel()
                    return
                  }

                  this.runPromise(
                    subscribe(q.queryChannel)
                      .then((r) => {
                        if (q.listeners.length === 0) {
                          r.unsubscribe()
                          unsubscribeToChannel()
                          return
                        }
                        this.runPromise(q.setAllItems(r.result))
                        q.unsubscribe = () => {
                          q.unsubscribe = () => {}
                          unsubscribeToChannel()
                          this.runPromise(r.unsubscribe())
                        }
                      })
                      .catch((err) => {
                        q.listeners.forEach((l) => l.error(err))
                        unsubscribeToChannel()
                        this.queries.delete(eventTypeKey)
                      }),
                  )
                }),
              ).catch((err) => {
                q.listeners.forEach((l) => l.error(err))
              })
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
  client: Promise<SubscriptionClientConnection>
  interval: any
  private openIfNoOpened() {
    if (!this.client) {
      this.interval = setInterval(async () => {
        const ids = []
        for (const q of this.queries.values()) {
          ids.push(q.queryChannel)
        }
        if (ids.length > 0) {
          let p = this.apiProvider()
          let { actionInfo } = await import('../server-action')
          const invalidIds: string[] = await this.runPromise(
            await actionInfo.runActionWithoutBlockingUI(() =>
              buildRestDataProvider(p.httpClient).post(
                p.url + '/' + liveQueryKeepAliveRoute,
                ids,
              ),
            ),
          )
          for (const id of invalidIds) {
            for (const q of this.queries.values()) {
              if (q.queryChannel === id) q.subscribeCode()
            }
          }
        }
      }, 30000)

      return this.runPromise(
        (this.client = this.apiProvider().subscriptionClient.openConnection(
          () => {
            for (const q of this.queries.values()) {
              q.subscribeCode()
            }
          },
        )),
      )
    }

    return this.client
  }
}

class MessageChannel<T> {
  id: string
  unsubscribe: VoidFunction = () => {}
  async handle(message: T) {
    for (const l of this.listeners) {
      l.next(message)
    }
  }

  listeners: SubscriptionListener<T>[] = []
  constructor() {}
}
