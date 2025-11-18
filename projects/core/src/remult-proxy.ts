import type { ClassType } from '../classType.js'
import type {
  Allowed,
  AllowedForInstance,
  ApiClient,
  GetArguments,
  Remult,
  RemultContext,
  UserInfo,
} from './context.js'
import type { DataProvider } from './data-interfaces.js'
import type { LiveQueryClient } from './live-query/LiveQueryClient.js'
import type { Unsubscribe } from './live-query/SubscriptionChannel.js'
import type {
  LiveQueryChangesListener,
  LiveQueryStorage,
  SubscriptionServer,
} from './live-query/SubscriptionServer.js'
import { defaultFactory, remultStatic } from './remult-static.js'
import type { RefSubscriber, Repository } from './remult3/remult3.js'
import { getInternalKey } from './remult3/repository-internals.js'

/*@internal*/
export class RemultProxy implements Remult {
  /* @internal*/
  iAmRemultProxy = true
  /* @internal*/
  get liveQuerySubscriber() {
    return remultStatic.remultFactory().liveQuerySubscriber
  }
  /* @internal*/
  set liveQuerySubscriber(val: LiveQueryClient) {
    remultStatic.remultFactory().liveQuerySubscriber = val
  }

  /* @internal*/
  get liveQueryStorage() {
    return remultStatic.remultFactory().liveQueryStorage!
  }
  /* @internal*/
  set liveQueryStorage(val: LiveQueryStorage) {
    remultStatic.remultFactory().liveQueryStorage = val
  }

  /* @internal*/
  get liveQueryPublisher() {
    return remultStatic.remultFactory().liveQueryPublisher
  }
  /* @internal*/
  set liveQueryPublisher(val: LiveQueryChangesListener) {
    remultStatic.remultFactory().liveQueryPublisher = val
  }
  subscribeAuth(listener: RefSubscriber): Unsubscribe {
    return remultStatic.remultFactory().subscribeAuth(listener)
  }
  initUser() {
    return remultStatic.remultFactory().initUser()
  }
  call<T extends (...args: any[]) => Promise<any>>(
    backendMethod: T,
    self?: any,
    ...args: GetArguments<T>
  ): ReturnType<T> {
    return remultStatic.remultFactory().call(backendMethod, self, ...args)
  }
  get context(): RemultContext {
    return remultStatic.remultFactory().context
  }

  get dataProvider(): DataProvider {
    return remultStatic.remultFactory().dataProvider
  }
  set dataProvider(provider: DataProvider) {
    remultStatic.remultFactory().dataProvider = provider
  }
  /*@internal*/
  get repCache(): Map<DataProvider, Map<ClassType<any>, Repository<unknown>>> {
    return remultStatic.remultFactory().repCache
  }

  authenticated(): boolean {
    return remultStatic.remultFactory().authenticated()
  }
  isAllowed(roles?: Allowed): boolean {
    return remultStatic.remultFactory().isAllowed(roles)
  }
  isAllowedForInstance(
    instance: any,
    allowed?: AllowedForInstance<any>,
  ): boolean {
    return remultStatic.remultFactory().isAllowedForInstance(instance, allowed)
  }

  clearAllCache() {
    return remultStatic.remultFactory().clearAllCache()
  }

  clearDataProviderCache(dataProvider: DataProvider): void {
    return remultStatic.remultFactory().clearDataProviderCache(dataProvider);
  }

  clearEntityCache(entity: ClassType<any>): void {
    return remultStatic.remultFactory().clearEntityCache(entity);
  }

  useFetch(args: typeof fetch) {
    return remultStatic.remultFactory().useFetch(args)
  }

  private repoCache = new Map<
    ClassType<any>,
    Map<DataProvider, Repository<any>>
  >()
  //@ts-ignore
  repo: Remult['repo'] = (...args) => {
    let self = remultStatic
    let entityCache = this.repoCache.get(args[0])
    if (!entityCache) {
      this.repoCache.set(args[0], (entityCache = new Map()))
    }
    let result = entityCache.get(args[1]!)
    if (result) return result
    result = {
      get fields() {
        return remultStatic.remultFactory().repo(...args).metadata.fields
      },
      //@ts-ignore
      [getInternalKey]() {
        return (self.remultFactory().repo(...args) as any)[getInternalKey]()
      },

      relations: (args2) =>
        self
          .remultFactory()
          .repo(...args)
          .relations(args2),
      validate: (a, ...b) =>
        self
          .remultFactory()
          .repo(...args)
          //@ts-ignore
          .validate(a, ...b),

      addEventListener: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .addEventListener(...args2),
      count: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .count(...args2),
      create: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .create(...args2),
      delete: (args2: any) =>
        self
          .remultFactory()
          .repo(...args)
          .delete(args2),
      deleteMany: (args2) =>
        self
          .remultFactory()
          .repo(...args)
          .deleteMany(args2),
      updateMany: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .updateMany(...args2),
      find: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .find(...args2),
      groupBy: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          //@ts-ignore
          .groupBy(...args2) as any,
      aggregate: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          //@ts-ignore
          .aggregate(...args2) as any,

      findFirst: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .findFirst(...args2),
      findOne: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .findOne(...args2),
      findId: (a, b) =>
        self
          .remultFactory()
          .repo(...args)
          .findId(a as any, b),
      //@ts-ignore
      toJson: (json: any) =>
        self
          .remultFactory()
          .repo(...args)
          .toJson(json),
      fromJson: (item, isNew) =>
        self
          .remultFactory()
          .repo(...args)
          .fromJson(item, isNew) as any[],
      getEntityRef: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .getEntityRef(...args2),
      insert: (args2: any, args3: any) =>
        self
          .remultFactory()
          .repo(...args)
          .insert(args2, args3),
      liveQuery: (...args2) =>
        self
          .remultFactory()
          .repo(...args)
          .liveQuery(...args2),
      get metadata() {
        return remultStatic.remultFactory().repo(...args).metadata
      },
      query: (options: any) =>
        self
          .remultFactory()
          .repo(...args)
          .query(options) as any,
      save: (args2: any) =>
        self
          .remultFactory()
          .repo(...args)
          .save(args2),
      upsert: (args2: any) =>
        self
          .remultFactory()
          .repo(...args)
          .upsert(args2),
      update: (a: any, b: any, c: any) =>
        self
          .remultFactory()
          .repo(...args)
          .update(a, b, c),
    }
    entityCache.set(args[1]!, result!)
    return result
  }

  get user() {
    return remultStatic.remultFactory().user
  }
  set user(info: UserInfo | undefined) {
    remultStatic.remultFactory().user = info
  }
  get apiClient(): ApiClient {
    return remultStatic.remultFactory().apiClient
  }
  set apiClient(client: ApiClient) {
    remultStatic.remultFactory().apiClient = client
  }
  get subscriptionServer() {
    return remultStatic.remultFactory().subscriptionServer!
  }
  set subscriptionServer(value: SubscriptionServer) {
    remultStatic.remultFactory().subscriptionServer = value
  }
}

export const remult: Remult = new RemultProxy()
