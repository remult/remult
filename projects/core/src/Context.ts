
import { DataProvider, RestDataProviderHttpProvider } from "./data-interfaces";
import { DataApiRequest } from "./data-api";
import { Action, actionInfo } from './server-action';
import { RestDataProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { Repository } from "./remult3";
import { RepositoryImplementation } from "./remult3/RepositoryImplementation";
import { ClassType } from "../classType";

export interface HttpProvider {
    post(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    delete(url: string): Promise<void> | { toPromise(): Promise<void> };
    put(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    get(url: string): Promise<any> | { toPromise(): Promise<any> };
}
class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
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
async function retry<T>(what: () => Promise<T>): Promise<T> {
    while (true) {
        try {
            return await what();
        } catch (err) {
            if (err.message?.startsWith("Error occured while trying to proxy")) {
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
        if (x&&x.status == 200 && x.headers && x.request && x.data)//for axios
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
            message: error
        };
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
    clearAllCache(): any {
        this.repCache.clear();
    }

    authenticated() {
        return this.user.id !== undefined;
    }
    constructor(http?: HttpProvider) {
        let provider: RestDataProviderHttpProvider;
        if (http) {
            provider = new HttpProviderBridgeToRestDataProviderHttpProvider(http);
        }

        if (!provider) {
            provider = new RestDataProviderHttpProviderUsingFetch();
        }
        this._dataSource = new RestDataProvider(Remult.apiBaseUrl, provider);
        if (!Action.provider)
            Action.provider = provider;
    }


    _dataSource: DataProvider;
    setDataProvider(dataProvider: DataProvider) {
        this._dataSource = dataProvider;
    }

    protected _user: UserInfo;
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
    private _userChangeEvent = new EventSource();

    get userChange() {
        return this._userChangeEvent.dispatcher;
    }
    async setUser(info: UserInfo) {
        this._user = info;
        await this._userChangeEvent.fire();
    }
    static apiBaseUrl = 'api';
    isAllowedForInstance(instance: any, x: AllowedForInstance<any>) {
        if (Array.isArray(x)) {
            {
                for (const item of x) {
                    if (this.isAllowedForInstance(instance, item))
                        return true;
                }
            }
        }
        else if (typeof (x) === "function") {
            return x(this, instance)
        } else return this.isAllowed(x as Allowed);
    }

    isAllowed(roles: Allowed) {
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
        if (!this.user)
            return false;
        if (typeof roles === 'string')
            if (this.user.roles.indexOf(roles.toString()) >= 0)
                return true;


        return false;
    }
    private repCache = new Map<DataProvider, Map<ClassType<any>, Repository<any>>>();
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


export declare type AllowedItem = string | ((c: Remult) => boolean) | boolean;
export declare type Allowed = AllowedItem | AllowedItem[];

export declare type AllowedForInstance<T> = string | ((c: Remult, entity: T) => boolean) | boolean | Allowed;
export class Allow {
    static everyone = () => true;
    static authenticated = (remult: Remult) => remult.authenticated();
}










export interface IterateToArrayOptions {
    limit?: number;
    page?: number;
}
export const iterateConfig = {
    pageSize: 200
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