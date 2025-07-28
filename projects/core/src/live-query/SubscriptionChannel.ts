import type { Remult } from '../context.js'
import { Sort } from '../sort.js'
import { remult as defaultRemult } from '../remult-proxy.js'
import type {
  FindOptions,
  LiveQueryChangeInfo,
  Repository,
} from '../remult3/remult3.js'
import { getRepositoryInternals } from '../remult3/repository-internals.js'

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
  async setAllItems(result: any[]) {
    const items = await getRepositoryInternals(this.repo)._fromJsonArray(
      result,
      this.query.options,
    )
    this.forListeners((listener) => {
      listener(() => {
        return items
      })
    }, this.allItemsMessage(items))
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
      listener: (reducer: (prevState: entityType[]) => entityType[]) => void,
    ) => void,
    changes: LiveQueryChange[],
  ) {
    what((reducer) => {
      this.defaultQueryState = reducer(this.defaultQueryState)
      if (changes.find((c) => c.type === 'add' || c.type === 'replace')) {
        if (this.query.options.orderBy) {
          const o = Sort.translateOrderByToSort(
            this.repo.metadata,
            this.query.options.orderBy,
          )
          this.defaultQueryState.sort((a: any, b: any) => o.compare(a, b))
        }
      }
    })

    for (const l of this.listeners) {
      what((reducer) => {
        l.next(this.createReducerType(reducer, changes))
      })
    }
  }

  private createReducerType(
    applyChanges: (prevState: entityType[]) => entityType[],
    changes: LiveQueryChange[],
  ): LiveQueryChangeInfo<entityType> {
    return {
      applyChanges,
      changes,
      items: this.defaultQueryState,
    }
  }

  async handle(messages: LiveQueryChange[]) {
    {
      let x = messages.filter(({ type }) => type == 'add' || type == 'replace')
      let loadedItems = await getRepositoryInternals(this.repo)._fromJsonArray(
        x.map((m) => m.data.item),
        this.query.options,
      )
      for (let index = 0; index < x.length; index++) {
        const element = x[index]
        element.data.item = loadedItems[index]
      }
    }

    this.forListeners((listener) => {
      listener((items) => {
        if (!items) items = []
        for (const message of messages) {
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
              items.push(message.data.item)
              break
            case 'remove':
              items = items.filter(
                (x) =>
                  this.repo.metadata.idMetadata.getId(x) !== message.data.id,
              )
              break
          }
        }
        return items
      })
    }, messages)
  }

  defaultQueryState: entityType[] = []
  listeners: SubscriptionListener<LiveQueryChangeInfo<entityType>>[] = []
  id = String(crypto.randomUUID())
  constructor(
    private repo: Repository<entityType>,
    private query: SubscribeToQueryArgs<entityType>,
    userId: string | undefined,
  ) {
    this.queryChannel = `users:${userId}:queries:${this.id}`
    this.id = this.queryChannel
  }
}

export interface SubscriptionListener<type> {
  next(message: type): void
  error(err: any): void
  complete(): void
}

export type Unsubscribe = VoidFunction
export interface SubscriptionClientConnection {
  subscribe(
    channel: string,
    onMessage: (message: any) => void,
    onError: (err: any) => void,
  ): Promise<Unsubscribe>
  close(): void
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
 * // Defined in code that is shared between the frontend and the backend
 * const statusChange = new SubscriptionChannel<{ oldStatus: number, newStatus: number }>("statusChange");
 *
 * // Backend: Publishing a message
 * statusChange.publish({ oldStatus: 1, newStatus: 2 });
 *
 * // Frontend: Subscribing to messages
 * statusChange.subscribe((message) => {
 *     console.log(`Status changed from ${message.oldStatus} to ${message.newStatus}`);
 * });
 *
 * // Note: If you want to publish from the frontend, use a BackendMethod for that.
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
