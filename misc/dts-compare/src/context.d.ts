import { DataProvider } from "./data-interfaces";
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { ClassType } from "../classType";
import type { SubscriptionServer } from "./live-query/SubscriptionServer";
import { ExternalHttpProvider } from "./buildRestDataProvider";
import { EntityOptions } from "./entity";
import { FieldOptions } from "./column-interfaces";
import { SubscriptionClient, Unsubscribe } from "./live-query/SubscriptionChannel";
export declare function isBackend(): boolean;
export interface EntityInfoProvider<InstanceType> {
    $entity$key: string;
    $entity$getInfo(remult: Remult): EntityInfo<InstanceType>;
}
export interface EntityInfo<instanceType> {
    options: EntityOptions;
    fields: FieldOptions[];
    createInstance?(remult: Remult): instanceType;
    entityType?: any;
}
export declare class Remult {
    /**Return's a `Repository` of the specific entity type
     * @example
     * const taskRepo = remult.repo(Task);
     * @see [Repository](https://remult.dev/docs/ref_repository.html)
     * @param entity - the entity to use
     * @param dataProvider - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
     */
    repo<T>(entity: (ClassType<T> | EntityInfoProvider<T>), dataProvider?: DataProvider): Repository<T>;
    /** Returns the current user's info */
    user?: UserInfo;
    /** Checks if a user was authenticated */
    authenticated(): boolean;
    /** checks if the user has any of the roles specified in the parameters
     * @example
     * remult.isAllowed("admin")
     * @see
     * [Allowed](https://remult.dev/docs/allowed.html)
     */
    isAllowed(roles?: Allowed): boolean;
    /** checks if the user matches the allowedForInstance callback
     * @see
     * [Allowed](https://remult.dev/docs/allowed.html)
     */
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean;
    /** The current data provider */
    dataProvider: DataProvider;
    /** Creates a new instance of the `remult` object.
     *
     * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
     *
     * If no provider is specified, `fetch` will be used as an http provider
     */
    constructor(http: ExternalHttpProvider | typeof fetch | ApiClient);
    constructor(p: DataProvider);
    constructor();
    subscriptionServer?: SubscriptionServer;
    /** Used to call a `backendMethod` using a specific `remult` object
     * @example
     * await remult.call(TasksController.setAll, undefined, true);
     * @param backendMethod - the backend method to call
     * @param classInstance - the class instance of the backend method, for static backend methods use undefined
     * @param args - the arguments to send to the backend method
    */
    call<T extends ((...args: any[]) => Promise<any>)>(backendMethod: T, classInstance?: any, ...args: GetArguments<T>): ReturnType<T>;
    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind: (metadata: EntityMetadata, options: FindOptions<any>) => void;
    clearAllCache(): any;
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
    /** context information that can be used to store custom information that will be disposed as part of the `remult` object */
    readonly context: RemultContext;
    /** The api client that will be used by `remult` to perform calls to the `api` */
    apiClient: ApiClient;
}
export declare type GetArguments<T> = T extends (...args: infer FirstArgument) => any ? FirstArgument : never;
export interface RemultContext {
}
export interface ApiClient {
    /** The http client to use when making api calls.
     * @example
     * remult.apiClient.httpClient = axios;
     * @example
     * remult.apiClient.httpClient = httpClient;//angular http client
     * @example
     * remult.apiClient.httpClient = fetch; //this is the default
     */
    httpClient?: ExternalHttpProvider | typeof fetch;
    /** The base url to for making api calls */
    url?: string;
    subscriptionClient?: SubscriptionClient;
    wrapMessageHandling?: (x: VoidFunction) => void;
}
export declare const allEntities: ClassType<any>[];
export interface ControllerOptions {
    key: string;
}
export declare const classHelpers: Map<any, ClassHelper>;
export declare class ClassHelper {
    classes: Map<any, ControllerOptions>;
}
export declare function setControllerSettings(target: any, options: ControllerOptions): void;
export interface UserInfo {
    id: string;
    name?: string;
    roles?: string[];
}
export declare type Allowed = boolean | string | string[] | ((c?: Remult) => boolean);
export declare type AllowedForInstance<T> = boolean | string | string[] | ((entity?: T, c?: Remult) => boolean);
export declare class Allow {
    static everyone: () => boolean;
    static authenticated: (...args: any[]) => any;
}
export declare const queryConfig: {
    defaultPageSize: number;
};
export interface EventDispatcher {
    observe(what: () => any | Promise<any>): Promise<Unsubscribe>;
}
export declare class EventSource {
    listeners: (() => {})[];
    fire(): Promise<void>;
    dispatcher: EventDispatcher;
}
export interface itemChange {
    id: any;
    oldId: any;
    deleted: boolean;
}
export declare function doTransaction(remult: Remult, what: () => Promise<void>): Promise<void>;
