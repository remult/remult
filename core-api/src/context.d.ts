import { DataProvider, RestDataProviderHttpProvider } from "./data-interfaces";
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { ClassType } from "../classType";
export interface HttpProvider {
    post(url: string, data: any): Promise<any> | {
        toPromise(): Promise<any>;
    };
    delete(url: string): Promise<void> | {
        toPromise(): Promise<void>;
    };
    put(url: string, data: any): Promise<any> | {
        toPromise(): Promise<any>;
    };
    get(url: string): Promise<any> | {
        toPromise(): Promise<any>;
    };
}
export declare class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
    private http;
    constructor(http: HttpProvider);
    post(url: string, data: any): Promise<any>;
    delete(url: string): Promise<void>;
    put(url: string, data: any): Promise<any>;
    get(url: string): Promise<any>;
}
export declare function retry<T>(what: () => Promise<T>): Promise<T>;
export declare function toPromise<T>(p: Promise<T> | {
    toPromise(): Promise<T>;
}): Promise<any>;
export declare function processHttpException(ex: any): Promise<any>;
export declare function isBackend(): boolean;
export declare class Remult {
    /**Return's a `Repository` of the specific entity type
     * @example
     * const taskRepo = remult.repo(Task);
     * @see [Repository](https://remult.dev/docs/ref_repository.html)
     *
     */
    repo<T>(entity: ClassType<T>, dataProvider?: DataProvider): Repository<T>;
    /** Returns the current user's info */
    get user(): UserInfo;
    /** Set's the current user info */
    setUser(info: UserInfo | {
        sub?: string;
        name?: string;
        permissions?: string[];
        username?: string;
    }): Promise<void>;
    private _user;
    private _userChangeEvent;
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
    /** returns a dispatcher object that fires once a user has changed*/
    get userChange(): EventDispatcher;
    private repCache;
    /** Creates a new instance of the `remult` object.
     *
     * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
     *
     * If no provider is specified, `fetch` will be used as an http provider
     */
    constructor(provider?: HttpProvider | DataProvider);
    /** The api Base Url to be used in all remult calls. by default it's set to `/api`.
     *
     * Set this property in case you want to determine a non relative api url
     */
    static apiBaseUrl: string;
    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind: (metadata: EntityMetadata, options: FindOptions<any>) => void;
    clearAllCache(): any;
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
}
export declare const allEntities: ClassType<any>[];
export interface ControllerOptions {
    key: string;
}
export declare const classHelpers: Map<any, ClassHelper>;
export declare class ClassHelper {
    methods: MethodHelper[];
}
export declare class MethodHelper {
    classes: Map<any, ControllerOptions>;
}
export declare function setControllerSettings(target: any, options: ControllerOptions): void;
export interface UserInfo {
    id: string;
    name: string;
    roles: string[];
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
