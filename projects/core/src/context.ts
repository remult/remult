import { DataProvider } from "./data-interfaces";
import { Action, actionInfo, serverActionField } from './server-action';
import { RestDataProvider } from './data-providers/rest-data-provider';
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { RepositoryImplementation } from "./remult3/RepositoryImplementation";
import { ClassType } from "../classType";
import { LiveQueryClient } from "./live-query/LiveQueryClient";
import { EventSourceSubClient } from "./live-query/EventSourceLiveQueryProvider";
import { RemultProxy } from "./remult-proxy";
import type { MessagePublisher } from "../live-query";
import type { LiveQueryStorage, LiveQueryPublisher, LiveQueryChangesListener } from "./live-query/LiveQueryPublisher";
import { buildRestDataProvider, ExternalHttpProvider, isExternalHttpProvider } from "./buildRestDataProvider";
import { SubClient } from "./live-query/LiveQuerySubscriber";






export function isBackend() {
    return actionInfo.runningOnServer;
}

export class Remult {
    /**Return's a `Repository` of the specific entity type
     * @example
     * const taskRepo = remult.repo(Task);
     * @see [Repository](https://remult.dev/docs/ref_repository.html)
     * 
     */
    public repo<T>(entity: ClassType<T>, dataProvider?: DataProvider): Repository<T> {
        if (dataProvider === undefined)
            dataProvider = this.dataProvider;
        let dpCache = this.repCache.get(dataProvider);
        if (!dpCache)
            this.repCache.set(dataProvider, dpCache = new Map<ClassType<any>, Repository<any>>());

        let r = dpCache.get(entity);
        if (!r) {

            dpCache.set(entity, r = new RepositoryImplementation(entity, this, dataProvider));
        }
        return r;
    }

    user?: UserInfo;

    /*  delete me */
    /** Checks if a user was authenticated */
    authenticated() {
        return this.user?.id !== undefined;
    }
    /** checks if the user has any of the roles specified in the parameters
     * @example
     * remult.isAllowed("admin")
     * @see
     * [Allowed](https://remult.dev/docs/allowed.html)
     */
    isAllowed(roles?: Allowed): boolean {
        if (roles == undefined)
            return undefined;
        if (roles instanceof Array) {
            for (const role of roles) {
                if (this.isAllowed(role) === true) {
                    return true;
                }
            }
            return false;
        }

        if (typeof roles === 'function') {
            return (<any>roles)(this);
        }
        if (typeof roles === 'boolean')
            return roles;
        if (typeof roles === 'string')
            if (this.user?.roles?.indexOf(roles.toString()) >= 0)
                return true;


        return false;
    }

    /** checks if the user matches the allowedForInstance callback
     * @see
     * [Allowed](https://remult.dev/docs/allowed.html)
     */
    isAllowedForInstance(instance: any, allowed?: AllowedForInstance<any>): boolean {
        if (Array.isArray(allowed)) {
            {
                for (const item of allowed) {
                    if (this.isAllowedForInstance(instance, item))
                        return true;
                }
            }
        }
        else if (typeof (allowed) === "function") {
            return allowed(this, instance)
        } else return this.isAllowed(allowed as Allowed);
    }
    /* @internal */
    repCache = new Map<DataProvider, Map<ClassType<any>, Repository<any>>>();
    /** Creates a new instance of the `remult` object.
     * 
     * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
     * 
     * If no provider is specified, `fetch` will be used as an http provider
     */
    constructor(http: ExternalHttpProvider | typeof fetch | ApiClient)
    constructor(p: DataProvider)
    constructor()
    constructor(provider?: ExternalHttpProvider | DataProvider | typeof fetch | ApiClient) {

        if (provider && (provider as DataProvider).getEntityDataProvider) {
            this.dataProvider = provider as DataProvider;
            return;
        }
        if (isExternalHttpProvider(provider)) {
            this.apiClient.httpClient = provider as ExternalHttpProvider;
        } else if (typeof (provider) === "function")
            this.apiClient.httpClient = provider;
        else if (provider) {
            const apiClient = provider as ApiClient;
            if (apiClient.httpClient)
                this.apiClient.httpClient = apiClient.httpClient;
            if (apiClient.url)
                this.apiClient.url = apiClient.url;
            if (apiClient.subClient)
                this.apiClient.subClient = apiClient.subClient;
            if (apiClient.wrapMessageHandling)
                this.apiClient.wrapMessageHandling = apiClient.wrapMessageHandling
        }

    }
    subServer: SubServer;
    /* @internal*/
    liveQueryPublisher: LiveQueryChangesListener = {
        itemChanged: () => { }
    };

    //@ts-ignore // type error of typescript regarding args that doesn't appear in my normal development
    call<T extends ((...args: any[]) => Promise<any>)>(backendMethod: T, classInstance?: any, ...args: GetArguments<T>): ReturnType<T> {
        const z = (backendMethod[serverActionField]) as Action<any, any>;
        if (!z.doWork)
            throw Error("The method received is not a valid backend method");
        //@ts-ignore
        return z.doWork(args, classInstance, this.apiClient.url, buildRestDataProvider(this.apiClient.httpClient));
    }
    /** The current data provider */
    dataProvider: DataProvider = new RestDataProvider(() => this.apiClient);

    /* @internal*/
    liveQuerySubscriber = new LiveQueryClient(() => this.apiClient);

    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind = (metadata: EntityMetadata, options: FindOptions<any>) => { };
    clearAllCache(): any {
        this.repCache.clear();
    }
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
    readonly context: RemultContext = {} as any;
    apiClient: ApiClient = {
        url: '/api',
        subClient: new EventSourceSubClient()
    };
}

RemultProxy.defaultRemult = new Remult();
export type GetArguments<T> = T extends (
    ...args: infer FirstArgument
) => any
    ? FirstArgument
    : never
export interface RemultContext {

}
export interface ApiClient {
    httpClient?: ExternalHttpProvider | typeof fetch;
    url?: string;
    subClient?: SubClient
    wrapMessageHandling?: (x: VoidFunction) => void
};
export interface SubServer {
    storage?: LiveQueryStorage,
    //TODO - consider not calling it server, since one may publish posts from the frontend as well
    publisher?: MessagePublisher
}


export const allEntities: ClassType<any>[] = [];
export interface ControllerOptions {
    key: string
}

export const classHelpers = new Map<any, ClassHelper>();
export class ClassHelper {
    classes = new Map<any, ControllerOptions>();
}



export function setControllerSettings(target: any, options: ControllerOptions) {
    let r = target;
    while (true) {
        let helper = classHelpers.get(r);
        if (!helper)
            classHelpers.set(r, helper = new ClassHelper());
        helper.classes.set(target, options);
        let p = Object.getPrototypeOf(r.prototype);
        if (p == null)
            break;
        r = p.constructor;
    }
}


export interface UserInfo {
    id: string;
    name?: string;
    roles?: string[];
}


export declare type Allowed = boolean | string | string[] | ((c: Remult) => boolean);

export declare type AllowedForInstance<T> = boolean | string | string[] | ((c: Remult, entity?: T) => boolean);
export class Allow {
    static everyone = () => true;
    static authenticated = (remult: Remult) => remult.authenticated();
}


export const queryConfig = {
    defaultPageSize: 200
};


export interface EventDispatcher {
    observe(what: () => any | Promise<any>): Promise<Unobserve>;
}
export declare type Unobserve = () => void;
export class EventSource {
    listeners: (() => {})[] = []
    async fire() {
        for (const l of this.listeners) {
            await l();
        }
    }
    dispatcher: EventDispatcher = {
        observe: async (what) => {
            this.listeners.push(what);
            await what();
            return () => {
                this.listeners = this.listeners.filter(x => x != what);
            }
        }
    };

}



export interface itemChange {
    id: any;
    oldId: any;
    deleted: boolean;
}
//TODO - consider allowing the user to add logic post transaction - like send messages etc...
export async function doTransaction(remult: Remult, what: () => Promise<void>) {
    return await remult.dataProvider.transaction(async ds => {
        remult.dataProvider = (ds);
        const trans = new transactionLiveQueryPublisher(remult.liveQueryPublisher);
        remult.liveQueryPublisher = trans;
        await what();
        trans.flush();
    });
}
// TODO - talk about message size limit in ably - something that we may reach if we group the messages
//@ts-ignore
class transactionLiveQueryPublisher implements LiveQueryChangesListener {

    constructor(private orig: LiveQueryChangesListener) { }
    transactionItems = new Map<string, itemChange[]>();
    itemChanged(entityKey: string, changes: itemChange[]): void {
        let items = this.transactionItems.get(entityKey);
        if (!items) {
            this.transactionItems.set(entityKey, items = []);
        }
        for (const c of changes) {
            if (c.oldId !== undefined) {
                const item = items.find(y => y.id === c.oldId);
                if (item !== undefined) {
                    if (c.deleted)
                        item.deleted = true;
                    if (c.id != item.id)
                        item.id = c.id;
                }
                else
                    items.push(c);
            }
            else items.push(c);
        }
    }
    flush() {
        for (const key of this.transactionItems.keys()) {
            this.orig.itemChanged(key, this.transactionItems.get(key));
        }
    }
}