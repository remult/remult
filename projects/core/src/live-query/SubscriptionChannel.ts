import { FindOptions, remult as defaultRemult, Remult, Sort } from '../../index'
import type { LiveQueryChangeInfo, RepositoryImplementation } from '../remult3'
import { v4 as uuid } from 'uuid'

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
  subscribeCode: () => void
  unsubscribe: VoidFunction = () => {}
  async setAllItems(result: any[]) {
    const items = await this.repo.fromJsonArray(result, this.query.options.load)
    this.forListeners((listener) => {
      listener((x) => {
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
      let loadedItems = await this.repo.fromJsonArray(
        x.map((m) => m.data.item),
        this.query.options.load,
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
  id = uuid()
  constructor(
    private repo: RepositoryImplementation<entityType>,
    private query: SubscribeToQueryArgs<entityType>,
    userId: string,
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

interface SubscribeToQueryArgs<entityType = any> {
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
export class SubscriptionChannel<messageType> {
  constructor(public channelKey: string) {}
  publish(message: messageType, remult?: Remult) {
    remult = remult || defaultRemult
    remult.subscriptionServer.publishMessage(this.channelKey, message)
  }
  subscribe(
    next: (message: messageType) => void,
    remult?: Remult,
  ): Promise<Unsubscribe>
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
