import { DataProvider } from "./data-interfaces";
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { ClassType } from "../classType";
import type { MessagePublisher } from "../live-query";
import type { LiveQueryStorage } from "./live-query/LiveQueryPublisher";
import { ExternalHttpProvider } from "./buildRestDataProvider";
import { SubClient } from "./live-query/LiveQuerySubscriber";
export declare function isBackend(): boolean;
export declare class Remult {
    /**Return's a `Repository` of the specific entity type
     * @example
     * const taskRepo = remult.repo(Task);
     * @see [Repository](https://remult.dev/docs/ref_repository.html)
     *
     */
    repo<T>(entity: ClassType<T>, dataProvider?: DataProvider): Repository<T>;
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
    /** Creates a new instance of the `remult` object.
     *
     * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
     *
     * If no provider is specified, `fetch` will be used as an http provider
     */
    constructor(http: ExternalHttpProvider | typeof fetch | ApiClient);
    constructor(p: DataProvider);
    constructor();
    subServer: SubServer;
    call<T extends ((...args: any[]) => Promise<any>)>(backendMethod: T, classInstance?: any, ...args: GetArguments<T>): ReturnType<T>;
    /** The current data provider */
    dataProvider: DataProvider;
    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind: (metadata: EntityMetadata, options: FindOptions<any>) => void;
    clearAllCache(): any;
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
    readonly context: RemultContext;
    apiClient: ApiClient;
}
export declare type GetArguments<T> = T extends (...args: infer FirstArgument) => any ? FirstArgument : never;
export interface RemultContext {
}
export interface ApiClient {
    httpClient?: ExternalHttpProvider | typeof fetch;
    url?: string;
    subClient?: SubClient;
    wrapMessageHandling?: (x: VoidFunction) => void;
}
export interface SubServer {
    storage?: LiveQueryStorage;
    publisher?: MessagePublisher;
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
export declare type Allowed = boolean | string | string[] | ((c: Remult) => boolean);
export declare type AllowedForInstance<T> = boolean | string | string[] | ((c: Remult, entity?: T) => boolean);
export declare class Allow {
    static everyone: () => boolean;
    static authenticated: (remult: Remult) => boolean;
}
export declare const queryConfig: {
    defaultPageSize: number;
};
export interface EventDispatcher {
    observe(what: () => any | Promise<any>): Promise<Unobserve>;
}
export declare type Unobserve = () => void;
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
