
import { DataProvider, RestDataProviderHttpProvider } from "./data-interfaces";
import { DataApiRequest } from "./data-api";
import { Action, actionInfo } from './server-action';
import { RestDataProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { EntityMetadata, EntityRef, FindOptions, Repository } from "./remult3";
import { RepositoryImplementation } from "./remult3/RepositoryImplementation";
import { ClassType } from "../classType";

export interface HttpProvider {
    post(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    delete(url: string): Promise<void> | { toPromise(): Promise<void> };
    put(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    get(url: string): Promise<any> | { toPromise(): Promise<any> };
}
export class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
    constructor(private http: HttpProvider) {

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
            dataProvider = this._dataSource;
        let dpCache = this.repCache.get(dataProvider);
        if (!dpCache)
            this.repCache.set(dataProvider, dpCache = new Map<ClassType<any>, Repository<any>>());

        let r = dpCache.get(entity);
        if (!r) {

            dpCache.set(entity, r = new RepositoryImplementation(entity, this, dataProvider));
        }
        return r;
    }
    /** Returns the current user's info */
    get user(): UserInfo {
        if (this._user === undefined) {
            return {
                id: undefined,
                name: '',
                roles: []
            }
        }
        return this._user;
    }
    /** Set's the current user info */
    async setUser(info: UserInfo | undefined) {
        this._user = info as UserInfo;
        if (this._user === null)
            this._user = undefined;
        let auth = info as { sub?: string, name?: string, permissions?: string[], username?: string };
        if (auth) {
            if (!this._user.id && auth.sub)
                this._user.id = auth.sub;
            if (!this._user.roles && auth.permissions) {
                this._user.roles = auth.permissions;
            }
            if (!this._user.name)
                this._user.name = auth.username;
        }
        if (this._user && !this._user.roles)
            this._user.roles = [];
        await this._userChangeEvent.fire();
    }






    private _user: UserInfo;

    private _userChangeEvent = new EventSource();
    /** Checks if a user was authenticated */
    authenticated() {
        return this.user.id !== undefined;
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
            if (this.user.roles.indexOf(roles.toString()) >= 0)
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

    /** returns a dispatcher object that fires once a user has changed*/
    get userChange() {
        return this._userChangeEvent.dispatcher;
    }

    private repCache = new Map<DataProvider, Map<ClassType<any>, Repository<any>>>();
    /** Creates a new instance of the `remult` object.
     * 
     * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
     * 
     * If no provider is specified, `fetch` will be used as an http provider
     */
    constructor(provider?: HttpProvider | DataProvider | typeof fetch) {

        if (provider && (provider as DataProvider).getEntityDataProvider) {
            this._dataSource = provider as DataProvider;
            return;
        }
        let dataProvider: RestDataProviderHttpProvider;

        if (!dataProvider) {
            let http: HttpProvider = provider as HttpProvider;
            if (http && http.get && http.put && http.post && http.delete) {
                dataProvider = new HttpProviderBridgeToRestDataProviderHttpProvider(http);
            }
        }
        if (!dataProvider) {
            if (typeof provider === "function") {
                dataProvider = new RestDataProviderHttpProviderUsingFetch(provider);
            }
        }

        if (!dataProvider) {
            dataProvider = new RestDataProviderHttpProviderUsingFetch();
        }
        this._dataSource = new RestDataProvider(Remult.apiBaseUrl, dataProvider);
        if (!Action.provider)
            Action.provider = dataProvider;
    }
    /** The api Base Url to be used in all remult calls. by default it's set to `/api`.
     * 
     * Set this property in case you want to determine a non relative api url
     */
    static apiBaseUrl = '/api';
    /** The current data provider */
    /** @internal */
    _dataSource: DataProvider;
    /** sets the current data provider */
    /** @internal */
    setDataProvider(dataProvider: DataProvider) {
        this._dataSource = dataProvider;
    }
    /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
    static onFind = (metadata: EntityMetadata, options: FindOptions<any>) => { };
    clearAllCache(): any {
        this.repCache.clear();
    }
    /** A helper callback that is called whenever an entity is created. */
    static entityRefInit?: (ref: EntityRef<any>, row: any) => void;
}


export const allEntities: ClassType<any>[] = [];
export interface ControllerOptions {
    key: string
}

export const classHelpers = new Map<any, ClassHelper>();
export class ClassHelper {
    methods: MethodHelper[] = [];
}
export class MethodHelper {
    classes = new Map<any, ControllerOptions>();
}


export function setControllerSettings(target: any, options: ControllerOptions) {
    let r = target;
    while (true) {
        let helper = classHelpers.get(r);
        if (helper) {
            for (const m of helper.methods) {
                m.classes.set(target, options);
            }
        }
        let p = Object.getPrototypeOf(r.prototype);
        if (p == null)
            break;
        r = p.constructor;
    }
}


export interface UserInfo {
    id: string;
    name: string;
    roles: string[];
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
