import type { ClassType } from '../classType.js'
import type { DataProvider } from './data-interfaces.js'
import { RestDataProvider } from './data-providers/rest-data-provider.js'
import { LiveQueryClient } from './live-query/LiveQueryClient.js'
import { SseSubscriptionClient } from './live-query/SseSubscriptionClient.js'
import { type RemultProxy, remult } from './remult-proxy.js'
import {
  RepositoryImplementation,
  createOldEntity,
} from './remult3/RepositoryImplementation.js'
import type {
  EntityMetadata,
  EntityRef,
  FindOptions,
  Repository,
} from './remult3/remult3.js'
import type { Action } from './server-action.js'
import { serverActionField } from './server-action-info.js'

import type { ExternalHttpProvider } from './buildRestDataProvider.js'
import {
  buildRestDataProvider,
  isExternalHttpProvider,
} from './buildRestDataProvider.js'
import type {
  SubscriptionClient,
  Unsubscribe,
} from './live-query/SubscriptionChannel.js'
import type {
  LiveQueryChangesListener,
  LiveQueryStorage,
  SubscriptionServer,
} from './live-query/SubscriptionServer.js'
import { verifyFieldRelationInfo } from './remult3/relationInfoMember.js'
import { remultStatic, resetFactory } from './remult-static.js'
import { initDataProvider } from '../server/initDataProvider.js'

export class RemultAsyncLocalStorage {
  static enable() {
    remultStatic.remultFactory = () => {
      const r = remultStatic.asyncContext.getStore()
      if (r) return r.remult
      else
        throw new Error(
          'remult object was requested outside of a valid context, try running it within initApi or a remult request cycle',
        )
    }
  }
  static disable() {
    resetFactory()
  }
  constructor(
    private readonly remultObjectStorage: RemultAsyncLocalStorageCore<{
      remult: Remult
      inInitRequest?: boolean
    }>,
  ) {}
  async run<T>(
    remult: Remult,
    callback: (remult: Remult) => Promise<T>,
  ): Promise<T> {
    if (this.remultObjectStorage) {
      return this.remultObjectStorage.run({ remult }, () => callback(remult))
    } else return callback(remult)
  }
  isInInitRequest() {
    return this.remultObjectStorage?.getStore()?.inInitRequest
  }
  setInInitRequest(val: boolean) {
    const store = this.remultObjectStorage?.getStore()
    if (!store) return
    store.inInitRequest = val
  }
  getStore() {
    if (!this.remultObjectStorage) {
      throw new Error(
        "can't use static remult in this environment, `async_hooks` were not initialized",
      )
    }
    return this.remultObjectStorage.getStore()
  }
}
if (!remultStatic.asyncContext)
  remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
export type RemultAsyncLocalStorageCore<T> = {
  run<R>(store: T, callback: () => Promise<R>): Promise<R>
  getStore(): T | undefined
  wasImplemented: 'yes'
}

export function isBackend() {
  return remultStatic.actionInfo.runningOnServer || !remult.dataProvider.isProxy
}

export class Remult {
  /**Return's a `Repository` of the specific entity type
   * @example
   * const taskRepo = remult.repo(Task);
   * @see [Repository](https://remult.dev/docs/ref_repository.html)
   * @param entity - the entity to use
   * @param dataProvider - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
   */
  public repo = <T>(
    entity: ClassType<T>,
    dataProvider?: DataProvider,
  ): Repository<T> => {
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
        (r = new RepositoryImplementation(
          entity,
          this,
          dataProvider,
          createOldEntity(entity, this),
        ) as Repository<any>),
      )

      verifyFieldRelationInfo(r, this, dataProvider)
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
    if (roles == undefined) return undefined!
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
      if (this.user?.roles?.includes(roles.toString())) return true

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
    return undefined!
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
}

remultStatic.defaultRemultFactory = () => new Remult()
export type GetArguments<T> = T extends (...args: infer FirstArgument) => any
  ? FirstArgument
  : never
export interface RemultContext {}
/**
 * Interface for configuring the API client used by Remult to perform HTTP calls to the backend.
 */
export interface ApiClient {
  /**
   * The HTTP client to use when making API calls. It can be set to a function with the `fetch` signature
   * or an object that has `post`, `put`, `delete`, and `get` methods. This can also be used to inject
   * logic before each HTTP call, such as adding authorization headers.
   *
   * @example
   * // Using Axios
   * remult.apiClient.httpClient = axios;
   *
   * @example
   * // Using Angular HttpClient
   * remult.apiClient.httpClient = httpClient;
   * @see
   * If you want to add headers using angular httpClient, see: https://medium.com/angular-shots/shot-3-how-to-add-http-headers-to-every-request-in-angular-fab3d10edc26
   *
   * @example
   * // Using fetch (default)
   * remult.apiClient.httpClient = fetch;
   *
   * @example
   * // Adding bearer token authorization
   * remult.apiClient.httpClient = (
   *   input: RequestInfo | URL,
   *   init?: RequestInit
   * ) => {
   *   return fetch(input, {
   *     ...init,
   *     headers: authToken
   *       ? {
   *           ...init?.headers,
   *           authorization: 'Bearer ' + authToken,
   *         }
   *       : init?.headers,
   *
   *     cache: 'no-store',
   *   })
   * }
   */
  httpClient?: ExternalHttpProvider | typeof fetch

  /**
   * The base URL for making API calls. By default, it is set to '/api'. It can be modified to be relative
   * or to use a different domain for the server.
   *
   * @example
   * // Relative URL
   * remult.apiClient.url = './api';
   *
   * @example
   * // Different domain
   * remult.apiClient.url = 'https://example.com/api';
   */
  url?: string

  /**
   * The subscription client used for real-time data updates. By default, it is set to use Server-Sent Events (SSE).
   * It can be set to any subscription provider as illustrated in the Remult tutorial for deploying to a serverless environment.
   *
   * @see https://remult.dev/tutorials/react-next/deployment.html#deploying-to-a-serverless-environment
   */
  subscriptionClient?: SubscriptionClient

  /**
   * A function that wraps message handling for subscriptions. This is useful for executing some code before
   * or after any message arrives from the subscription.
   * For example, in Angular, to refresh a specific part of the UI,
   * you can call the `NgZone` run method at this time.
   *
   * @example
   * // Angular example
   * import { Component, NgZone } from '@angular/core';
   * import { remult } from "remult";
   *
   * export class AppComponent {
   *   constructor(zone: NgZone) {
   *     remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler());
   *   }
   * }
   */
  wrapMessageHandling?: (x: VoidFunction) => void
}

export interface ControllerOptions {
  key: string
}

export class ClassHelper {
  classes = new Map<any, ControllerOptions>()
}

export function setControllerSettings(target: any, options: ControllerOptions) {
  let r = target
  while (true) {
    let helper = remultStatic.classHelpers.get(r)
    if (!helper) remultStatic.classHelpers.set(r, (helper = new ClassHelper()))
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

export async function doTransaction(
  remult: Remult,
  what: (dp: DataProvider) => Promise<void>,
) {
  const trans = new transactionLiveQueryPublisher(remult.liveQueryPublisher)
  let ok = true
  const prev = remult.dataProvider
  try {
    await remult.dataProvider.transaction(async (ds) => {
      remult.dataProvider = ds
      remult.liveQueryPublisher = trans
      await what(ds)
      ok = true
    })

    if (ok) await trans.flush()
  } finally {
    remult.dataProvider = prev
  }
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
export async function withRemult<T>(
  callback: (remult) => Promise<T>,
  options?: {
    dataProvider?:
      | DataProvider
      | Promise<DataProvider>
      | (() => Promise<DataProvider | undefined>)
  },
) {
  const remult = new Remult()

  remult.dataProvider = await initDataProvider(
    options?.dataProvider,
    true,
    async () => remult.dataProvider,
  )

  return remultStatic.asyncContext.run(remult, (r) => callback(r))
}
