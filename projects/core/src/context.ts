import { DataProvider } from './data-interfaces'
import { Action, actionInfo, serverActionField } from './server-action'
import { RestDataProvider } from './data-providers/rest-data-provider'
import { EntityMetadata, EntityRef, FindOptions, Repository } from './remult3'
import { RepositoryImplementation } from './remult3/RepositoryImplementation'
import { ClassType } from '../classType'
import { LiveQueryClient } from './live-query/LiveQueryClient'
import { SseSubscriptionClient } from './live-query/SseSubscriptionClient'
import { RemultProxy, remult } from './remult-proxy'

import type {
  LiveQueryStorage,
  LiveQueryPublisher,
  LiveQueryChangesListener,
  SubscriptionServer,
} from './live-query/SubscriptionServer'
import {
  buildRestDataProvider,
  ExternalHttpProvider,
  isExternalHttpProvider,
} from './buildRestDataProvider'
import {
  SubscriptionClient,
  Unsubscribe,
} from './live-query/SubscriptionChannel'

export class RemultAsyncLocalStorage {
  static enable() {
    ;(remult as RemultProxy).remultFactory = () => {
      const r = RemultAsyncLocalStorage.instance.getRemult()
      if (r) return r
      else
        throw new Error(
          'remult object was requested outside of a valid context, try running it within initApi or a remult request cycle',
        )
    }
  }
  static disable() {
    ;(remult as RemultProxy).resetFactory()
  }
  constructor(
    private readonly remultObjectStorage: myAsyncLocalStorage<Remult>,
  ) {}
  run(remult: Remult, callback: VoidFunction) {
    if (this.remultObjectStorage) this.remultObjectStorage.run(remult, callback)
    else callback()
  }
  getRemult() {
    if (!this.remultObjectStorage) {
      throw new Error(
        "can't use static remult in this environment, `async_hooks` were not initialized",
      )
    }
    return this.remultObjectStorage.getStore()
  }
  static instance = new RemultAsyncLocalStorage(undefined!)
}
type myAsyncLocalStorage<T> = {
  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R
  getStore(): T
}

export function isBackend() {
  return actionInfo.runningOnServer || !remult.dataProvider.isProxy
}

export class Remult {
  /**Return's a `Repository` of the specific entity type
   * @example
   * const taskRepo = remult.repo(Task);
   * @see [Repository](https://remult.dev/docs/ref_repository.html)
   * @param entity - the entity to use
   * @param dataProvider - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
   */
  public repo<T>(
    entity: ClassType<T>,
    dataProvider?: DataProvider,
  ): Repository<T> {
    if (dataProvider === undefined) dataProvider = this.dataProvider
    let dpCache = this.repCache.get(dataProvider)
    if (!dpCache)
      this.repCache.set(
        dataProvider,
        (dpCache = new Map<ClassType<any>, Repository<any>>()),
      )

    let r = dpCache.get(entity)
    if (!r) {
      dpCache.set(
        entity,
        (r = new RepositoryImplementation(entity, this, dataProvider)),
      )
    }
    return r
  }
  /** Returns the current user's info */
  user?: UserInfo

  /** Checks if a user was authenticated */
  authenticated() {
    return this.user?.id !== undefined
  }
  /** checks if the user has any of the roles specified in the parameters
   * @example
   * remult.isAllowed("admin")
   * @see
   * [Allowed](https://remult.dev/docs/allowed.html)
   */
  isAllowed(roles?: Allowed): boolean {
    if (roles == undefined) return undefined
    if (roles instanceof Array) {
      for (const role of roles) {
        if (this.isAllowed(role) === true) {
          return true
        }
      }
      return false
    }

    if (typeof roles === 'function') {
      return (<any>roles)(this)
    }
    if (typeof roles === 'boolean') return roles
    if (typeof roles === 'string')
      if (this.user?.roles?.indexOf(roles.toString()) >= 0) return true

    return false
  }

  /** checks if the user matches the allowedForInstance callback
   * @see
   * [Allowed](https://remult.dev/docs/allowed.html)
   */
  isAllowedForInstance(
    instance: any,
    allowed?: AllowedForInstance<any>,
  ): boolean {
    if (Array.isArray(allowed)) {
      {
        for (const item of allowed) {
          if (this.isAllowedForInstance(instance, item)) return true
        }
      }
    } else if (typeof allowed === 'function') {
      return allowed(instance, this)
    } else return this.isAllowed(allowed as Allowed)
  }
  /** The current data provider */
  dataProvider: DataProvider = new RestDataProvider(() => this.apiClient)
  /* @internal */
  repCache = new Map<DataProvider, Map<ClassType<any>, Repository<any>>>()
  /** Creates a new instance of the `remult` object.
   *
   * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
   *
   * If no provider is specified, `fetch` will be used as an http provider
   */
  constructor(http: ExternalHttpProvider | typeof fetch | ApiClient)
  constructor(p: DataProvider)
  constructor()
  constructor(
    provider?: ExternalHttpProvider | DataProvider | typeof fetch | ApiClient,
  ) {
    if (provider && (provider as DataProvider).getEntityDataProvider) {
      this.dataProvider = provider as DataProvider
      return
    }
    if (isExternalHttpProvider(provider)) {
      this.apiClient.httpClient = provider as ExternalHttpProvider
    } else if (typeof provider === 'function')
      this.apiClient.httpClient = provider
    else if (provider) {
      const apiClient = provider as ApiClient
      if (apiClient.httpClient) this.apiClient.httpClient = apiClient.httpClient
      if (apiClient.url) this.apiClient.url = apiClient.url
      if (apiClient.subscriptionClient)
        this.apiClient.subscriptionClient = apiClient.subscriptionClient
      if (apiClient.wrapMessageHandling)
        this.apiClient.wrapMessageHandling = apiClient.wrapMessageHandling
    }
  }
  /* @internal*/
  liveQueryStorage?: LiveQueryStorage
  subscriptionServer?: SubscriptionServer
  /* @internal*/
  liveQueryPublisher: LiveQueryChangesListener = {
    itemChanged: async () => {},
  }

  //@ts-ignore // type error of typescript regarding args that doesn't appear in my normal development
  /** Used to call a `backendMethod` using a specific `remult` object
   * @example
   * await remult.call(TasksController.setAll, undefined, true);
   * @param backendMethod - the backend method to call
   * @param classInstance - the class instance of the backend method, for static backend methods use undefined
   * @param args - the arguments to send to the backend method
   */
  call<T extends (...args: any[]) => Promise<any>>(
    backendMethod: T,
    classInstance?: any,
    ...args: GetArguments<T>
  ): ReturnType<T> {
    const z = backendMethod[serverActionField] as Action<any, any>
    if (!z.doWork)
      throw Error('The method received is not a valid backend method')
    //@ts-ignore
    return z.doWork(
      args,
      classInstance,
      this.apiClient.url,
      buildRestDataProvider(this.apiClient.httpClient),
    )
  }

  /* @internal*/
  liveQuerySubscriber = new LiveQueryClient(
    () => this.apiClient,
    () => this.user?.id,
  )

  /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
  static onFind = (metadata: EntityMetadata, options: FindOptions<any>) => {}
  clearAllCache(): any {
    this.repCache.clear()
  }
  /** A helper callback that is called whenever an entity is created. */
  static entityRefInit?: (ref: EntityRef<any>, row: any) => void
  /** context information that can be used to store custom information that will be disposed as part of the `remult` object */
  readonly context: RemultContext = {} as any
  /** The api client that will be used by `remult` to perform calls to the `api` */
  apiClient: ApiClient = {
    url: '/api',
    subscriptionClient: new SseSubscriptionClient(),
  }
  static run<T>(
    callback: () => T,
    options: {
      dataProvider: DataProvider
    },
  ) {
    const remult = new Remult()
    if (options.dataProvider) remult.dataProvider = options.dataProvider
    let r: T
    RemultAsyncLocalStorage.instance.run(remult, () => {
      r = callback()
    })
    return r
  }
}

RemultProxy.defaultRemult = new Remult()
export type GetArguments<T> = T extends (...args: infer FirstArgument) => any
  ? FirstArgument
  : never
export interface RemultContext {}
export interface ApiClient {
  /** The http client to use when making api calls.
   * @example
   * remult.apiClient.httpClient = axios;
   * @example
   * remult.apiClient.httpClient = httpClient;//angular http client
   * @example
   * remult.apiClient.httpClient = fetch; //this is the default
   */
  httpClient?: ExternalHttpProvider | typeof fetch
  /** The base url to for making api calls */
  url?: string
  subscriptionClient?: SubscriptionClient
  wrapMessageHandling?: (x: VoidFunction) => void
}

export const allEntities: ClassType<any>[] = []
export interface ControllerOptions {
  key: string
}

export const classHelpers = new Map<any, ClassHelper>()
export class ClassHelper {
  classes = new Map<any, ControllerOptions>()
}

export function setControllerSettings(target: any, options: ControllerOptions) {
  let r = target
  while (true) {
    let helper = classHelpers.get(r)
    if (!helper) classHelpers.set(r, (helper = new ClassHelper()))
    helper.classes.set(target, options)
    let p = Object.getPrototypeOf(r.prototype)
    if (p == null) break
    r = p.constructor
  }
}

export interface UserInfo {
  id: string
  name?: string
  roles?: string[]
}

export declare type Allowed =
  | boolean
  | string
  | string[]
  | ((c?: Remult) => boolean)

export declare type AllowedForInstance<T> =
  | boolean
  | string
  | string[]
  | ((entity?: T, c?: Remult) => boolean)
export class Allow {
  static everyone = () => true
  static authenticated = (...args: any[]) => {
    if (args.length > 1) {
      return (args[1] as Remult).authenticated()
    } else if (args.length == 1) {
      if (args[0].authenticated) return args[0].authenticated()
    }
    return remult.authenticated()
  }
}

export const queryConfig = {
  defaultPageSize: 200,
}

export interface EventDispatcher {
  observe(what: () => any | Promise<any>): Promise<Unsubscribe>
}

export class EventSource {
  listeners: (() => {})[] = []
  async fire() {
    for (const l of this.listeners) {
      await l()
    }
  }
  dispatcher: EventDispatcher = {
    observe: async (what) => {
      this.listeners.push(what)
      await what()
      return () => {
        this.listeners = this.listeners.filter((x) => x != what)
      }
    },
  }
}

export interface itemChange {
  id: any
  oldId: any
  deleted: boolean
}

export async function doTransaction(remult: Remult, what: () => Promise<void>) {
  const trans = new transactionLiveQueryPublisher(remult.liveQueryPublisher)
  let ok = true
  const result = await remult.dataProvider.transaction(async (ds) => {
    remult.dataProvider = ds
    remult.liveQueryPublisher = trans
    await what()
    ok = true
  })
  if (ok) await trans.flush()
}
class transactionLiveQueryPublisher implements LiveQueryChangesListener {
  constructor(private orig: LiveQueryChangesListener) {}
  transactionItems = new Map<string, itemChange[]>()
  async itemChanged(entityKey: string, changes: itemChange[]) {
    let items = this.transactionItems.get(entityKey)
    if (!items) {
      this.transactionItems.set(entityKey, (items = []))
    }
    for (const c of changes) {
      if (c.oldId !== undefined) {
        const item = items.find((y) => y.id === c.oldId)
        if (item !== undefined) {
          if (c.deleted) item.deleted = true
          if (c.id != item.id) item.id = c.id
        } else items.push(c)
      } else items.push(c)
    }
  }
  async flush() {
    for (const key of this.transactionItems.keys()) {
      await this.orig.itemChanged(key, this.transactionItems.get(key))
    }
  }
}
