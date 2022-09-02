
import { DataProvider, RestDataProviderHttpProvider } from "./data-interfaces";
import { DataApiRequest } from "./data-api";
import { Action, actionInfo, serverActionField } from './server-action';
import { RestDataProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { RepositoryImplementation } from "./remult3/RepositoryImplementation";
import { ClassType } from "../classType";

export interface ExternalHttpProvider {
    post(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    delete(url: string): Promise<void> | { toPromise(): Promise<void> };
    put(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    get(url: string): Promise<any> | { toPromise(): Promise<any> };
}
export class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
    constructor(private http: ExternalHttpProvider) {

    }
    async post(url: string, data: any): Promise<any> {
        return await retry(() => toPromise(this.http.post(url, data)));
    }
    delete(url: string): Promise<void> {
        return toPromise(this.http.delete(url));
    }
    put(url: string, data: any): Promise<any> {
        return toPromise(this.http.put(url, data));
    }
    async get(url: string): Promise<any> {
        return await retry(() => toPromise(this.http.get(url)));
    }
}
export async function retry<T>(what: () => Promise<T>): Promise<T> {
    while (true) {
        try {
            return await what();
        } catch (err) {
            if (err.message?.startsWith("Error occurred while trying to proxy") ||
                err.message?.startsWith("Error occured while trying to proxy") ||
                err.message?.includes("http proxy error") ||
                err.message?.startsWith("Gateway Timeout")) {
                await new Promise((res, req) => {
                    setTimeout(() => {
                        res({})
                    }, 250);
                })
                continue;
            }
            throw err;
        }
    }
}

export function toPromise<T>(p: Promise<T> | { toPromise(): Promise<T> }) {
    let r: Promise<T>;
    if (p["toPromise"] !== undefined) {
        r = p["toPromise"]();
    }
    //@ts-ignore
    else r = p;
    return r.then((x: any) => {
        if (x && (x.status == 200 || x.status == 201) && x.headers && x.request && x.data)//for axios
            return x.data;
        return x;
    }).catch(async ex => {
        throw await processHttpException(ex);
    });
}

export async function processHttpException(ex: any) {
    let z = await ex;
    var error;
    if (z.error)
        error = z.error;

    else if (z.isAxiosError) {
        if (typeof z.response?.data === "string")
            error = z.response.data;
        else
            error = z?.response?.data

    }
    if (!error)
        error = z.message;
    if (z.status == 0 && z.error.isTrusted)
        error = "Network Error";
    if (typeof error === 'string') {
        error = {
            message: error,
        };
    }
    if (z.modelState)
        error.modelState = z.modelState;
    let httpStatusCode = z.status;
    if (httpStatusCode === undefined)
        httpStatusCode = z.response?.status;
    if (httpStatusCode !== undefined && httpStatusCode !== null) {
        error.httpStatusCode = httpStatusCode;
    }
    var result = Object.assign(error, {
        //     exception: ex disabled for now because JSON.stringify crashed with this
    });
    return result;
}

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
        }

    }

    call<T extends ((...args: any[]) => Promise<Y>), Y>(backendMethod: T, self?: any): T {
        const z = (backendMethod[serverActionField]) as Action<any, any>;
        if (!z.doWork)
            throw Error("The method received is not a valid backend method");
        //@ts-ignore
        return (...args: any[]) => {
            return z.doWork(args, self, this.apiClient.url, buildRestDataProvider(this.apiClient.httpClient));
        }
    }
    /** The current data provider */
    dataProvider: DataProvider = new RestDataProvider(() => this.apiClient);

    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind = (metadata: EntityMetadata, options: FindOptions<any>) => { };
    clearAllCache(): any {
        this.repCache.clear();
    }
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
    readonly context: RemultContext = {};
    apiClient: ApiClient = {
        url: '/api'
    };
}
export interface RemultContext {

}
export interface ApiClient {
    httpClient?: ExternalHttpProvider | typeof fetch;
    url?: string;
};


export const allEntities: ClassType<any>[] = [];
export interface ControllerOptions {
    key: string
}

export const classHelpers = new Map<any, ClassHelper>();
export class ClassHelper {
    classes = new Map<any, ControllerOptions>();
}

function isExternalHttpProvider(item: any) {
    let http: ExternalHttpProvider = item as ExternalHttpProvider;
    if (http && http.get && http.put && http.post && http.delete)
        return true;
    return false;
}

export function buildRestDataProvider(provider: ExternalHttpProvider | typeof fetch) {
    if (!provider)
        return new RestDataProviderHttpProviderUsingFetch();
    let httpDataProvider: RestDataProviderHttpProvider;

    if (!httpDataProvider) {

        if (isExternalHttpProvider(provider)) {
            httpDataProvider = new HttpProviderBridgeToRestDataProviderHttpProvider(provider as ExternalHttpProvider);
        }
    }
    if (!httpDataProvider) {
        if (typeof provider === "function") {
            httpDataProvider = new RestDataProviderHttpProviderUsingFetch(provider);
        }
    }
    return httpDataProvider;
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
