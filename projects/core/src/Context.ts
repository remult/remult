
import { DataProvider, RestDataProviderHttpProvider } from "./data-interfaces";
import { DataApiRequest } from "./data-api";
import { Action } from './server-action';
import { RestDataProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { ClassType, Repository } from "./remult3";
import { RepositoryImplementation } from "./remult3/RepositoryImplementation";

export interface HttpProvider {
    post(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    delete(url: string): Promise<void> | { toPromise(): Promise<void> };
    put(url: string, data: any): Promise<any> | { toPromise(): Promise<any> };
    get(url: string): Promise<any> | { toPromise(): Promise<any> };
}
class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
    constructor(private http: HttpProvider) {

    }
    post(url: string, data: any): Promise<any> {
        return toPromise(this.http.post(url, data));
    }
    delete(url: string): Promise<void> {
        return toPromise(this.http.delete(url));
    }
    put(url: string, data: any): Promise<any> {
        return toPromise(this.http.put(url, data));
    }
    get(url: string): Promise<any> {
        return toPromise(this.http.get(url));
    }

}
export function toPromise<T>(p: Promise<T> | { toPromise(): Promise<T> }) {
    let r: Promise<T>;
    if (p["toPromise"] !== undefined) {
        r = p["toPromise"]();
    }
    //@ts-ignore
    else r = p;
    return r.catch(async ex => {
        let z = await ex;
        var error = z.error;
        if (typeof error === 'string') {
            error = {
                message: error
            }
        }
        var result = Object.assign(error, {
            //     exception: ex disabled for now because JSON.stringify crashed with this
        });
        throw result;
    });
}
export class keyFor<T>{

}

export class Context {
    map = new Map<any, any>();
    set<T>(key: keyFor<T>, value: T) {
        this.map.set(key, value);
    }

    get<T>(key: keyFor<T>): T {
        return this.map.get(key);
    }
    clearAllCache(): any {
        this.repCache.clear();
    }

    isSignedIn() {
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
        this._dataSource = new RestDataProvider(Context.apiBaseUrl, provider);
        if (!Action.provider)
            Action.provider = provider;
    }

    getCookie(name: string) {
        return '';
    }
    getHost() {
        return '';
    }
    getPathInUrl() {
        return window.location.pathname;
    }


    _dataSource: DataProvider;
    setDataProvider(dataProvider: DataProvider) {
        this._dataSource = dataProvider;
    }
    protected _onServer = false;
    get onServer(): boolean {
        return this._onServer;
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

        if (roles instanceof Role) {
            roles = roles.key;
        }
        if (!this.user)
            return false;
        if (typeof roles === 'string')
            if (this.user.roles.indexOf(roles.toString()) >= 0)
                return true;


        return false;
    }
    repCache = new Map<ClassType<any>, Repository<any>>();
    public for<T>(entity: ClassType<T>): Repository<T> {
        let r = this.repCache.get(entity);
        if (!r) {
            this.repCache.set(entity, r = new RepositoryImplementation(entity, this, this._dataSource));
        }
        return r;

    }

}
export declare type DataProviderFactoryBuilder = (req: Context) => DataProvider;
export class ServerContext extends Context {
    constructor(dp?: DataProvider) {
        super();
        this._onServer = true;
        if (dp)
            this.setDataProvider(dp);


    }
    getHost() {
        if (!this.req)
            return undefined;
        return this.req.getHeader('host');
    }
    getPathInUrl() {
        if (!this.req)
            return undefined;
        return this.req.getBaseUrl();
    }
    getCookie(name: string) {
        if (this.req) {
            let cookie = this.req.getHeader('cookie');
            if (cookie)
                for (const iterator of cookie.split(';')) {
                    let itemInfo = iterator.split('=');
                    if (itemInfo && itemInfo[0].trim() == name) {
                        return itemInfo[1];
                    }
                }
        }
        return undefined;
    }
    private req: DataApiRequest;

    setReq(req: DataApiRequest) {
        this.req = req;
        this._user = req.user ? req.user : undefined;
    }

    getOrigin() {
        if (!this.req)
            return undefined;
        return this.req.getHeader('origin')
    }
}

export const allEntities: ClassType<any>[] = [];
export interface ControllerOptions {
    key: string,
    allowed: Allowed

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


// @dynamic
export class Role {
    constructor(public key: string) {

    }
    static not(allowed: Allowed): Allowed {
        return c => !c.isAllowed(allowed);
    }
}
declare type AllowedRule = string | Role | ((c: Context) => boolean) | boolean;;
export declare type Allowed = AllowedRule | AllowedRule[];
declare type EntityAllowedRule<T> = string | Role | ((c: Context, entity: T) => boolean) | boolean;;
export declare type EntityAllowed<T> = EntityAllowedRule<T> | EntityAllowedRule<T>[];







export interface RoleChecker {
    isAllowed(roles: Allowed): boolean;
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
