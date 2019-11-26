import { Injectable } from "@angular/core";
import { DataProvider, DataApiRequest, FilterBase, EntitySourceFindOptions, FindOptionsPerEntity } from "../core/dataInterfaces1";
import { RestDataProvider, Action, AngularHttpProvider, wrapFetch } from "../core/restDataProvider";
import { Entity, EntityOptions, NumberColumn, Column, DataList, ColumnHashSet, IDataSettings, GridSettings, EntitySource, SQLQueryResult, LookupCache, Lookup } from "../core/utils";
import { InMemoryDataProvider } from "../core/inMemoryDatabase";
import { DataApiSettings } from "../server/DataApi";
import { HttpClient } from "@angular/common/http";
import { isFunction, isString, isBoolean } from "util";
import { BusyService } from "../angular-components/wait/busy-service";
import { MatDialog } from '@angular/material/dialog';




@Injectable()
export class Context {
    clearAllCache(): any {
        this.cache.clear();
        this._lookupCache = [];
    }

    isSignedIn() {
        return !!this.user;
    }
    constructor(http?: HttpClient, private _dialog?: MatDialog) {
        if (http instanceof HttpClient) {
            var prov = new AngularHttpProvider(http);
            this._dataSource = new RestDataProvider(Context.apiBaseUrl
                , prov
                //,new restDataProviderHttpProviderUsingFetch()
            );
            Action.provider = prov;
        }
        else {
            this._dataSource = new InMemoryDataProvider();
        }
    }

    getCookie(name: string) {
        return '';
    }
    getHost() {
        return '';
    }
    getPathInUrl(){
        return window.location.pathname;
    }

 
    protected _dataSource: DataProvider;
    protected _onServer = false;
    get onServer(): boolean {
        return this._onServer;
    }
    protected _user: UserInfo;
    get user() { return this._user; }

    _setUser(info: UserInfo) {
        this._user = info;
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

        if (isFunction(roles)) {
            return (<any>roles)(this);
        }
        if (isBoolean(roles))
            return roles;

        if (roles instanceof Role) {
            roles = roles.key;
        }
        if (!this.user)
            return false;
        if (isString(roles))
            if (this.user.roles.indexOf(roles.toString()) >= 0)
                return true;


        return false;
    }

    cache = new Map<DataProvider, Map<string, SpecificEntityHelper<any, Entity<any>>>>();
    public for<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }, dataSource?: DataProvider) {
        if (!dataSource)
            dataSource = this._dataSource;

        let dsCache = this.cache.get(dataSource);
        if (!dsCache) {
            dsCache = new Map<string, SpecificEntityHelper<any, Entity<any>>>();
            this.cache.set(dataSource, dsCache);
        }
        let classType = c as any;
        let classKey = classType.__key;
        let r = dsCache.get(classKey) as SpecificEntityHelper<lookupIdType, T>;
        if (!r) {
            r = new SpecificEntityHelper<lookupIdType, T>(() => {
                let e = new c(this);
                e.setSource(dataSource);
                e._setContext(this);
                return e;
            }, this._lookupCache, this);
            dsCache.set(classKey, r);
        }



        return r;
    }
    async openDialog<T, C>(component: { new(...args: any[]): C; }, setParameters: (it: C) => void, returnAValue?: (it: C) => T) {
        let ref = this._dialog.open(component);
        setParameters(ref.componentInstance);
        await ref.beforeClose().toPromise();
        if (returnAValue)
            return returnAValue(ref.componentInstance);
    }

    _lookupCache: LookupCache<any>[] = [];
}
export declare type DataProviderFactoryBuilder = (req: Context) => DataProvider;
export class ServerContext extends Context {
    constructor() {
        super(undefined);
        this._onServer = true;


    }
    getHost() {
        return this.req.getHeader('host');
    }
    getPathInUrl(){
        return this.req.getBaseUrl();
    }
    getCookie(name: string) {
        let cookie = this.req.getHeader('cookie');
        if (cookie)
            for (const iterator of cookie.split(';')) {
                let itemInfo = iterator.split('=');
                if (itemInfo && itemInfo[0].trim() == name) {
                    return itemInfo[1];
                }
            }
        return undefined;
    }
    private req: DataApiRequest;

    setReq(req: DataApiRequest) {
        this.req = req;
        this._user = req.user ? req.user : undefined;
    }
    setDataProvider(dataProvider: DataProvider) {
        this._dataSource = dataProvider;
    }
    getOrigin() {
        return this.req.getHeader('origin')
    }
}


export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> {
    private entity: T;
    constructor(private factory: () => T, private _lookupCache: LookupCache<any>[], private context: Context) {
        this.entity = this.create();
    }

    lookup(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): T {

        let key = this.entity.__getName();
        let lookup: Lookup<lookupIdType, T>;
        this._lookupCache.forEach(l => {
            if (l.key == key)
                lookup = l.lookup;
        });
        if (!lookup) {
            lookup = new Lookup(this.entity);
            this._lookupCache.push({ key, lookup });
        }
        return lookup.get(filter);

    }
    lookupAsync(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): Promise<T> {

        let key = this.entity.__getName();
        let lookup: Lookup<lookupIdType, T>;
        this._lookupCache.forEach(l => {
            if (l.key == key)
                lookup = l.lookup;
        });
        if (!lookup) {
            lookup = new Lookup(this.entity);
            this._lookupCache.push({ key, lookup });
        }
        return lookup.whenGet(filter);

    }


    async count(where?: (entity: T) => FilterBase) {
        let dl = new DataList(this.entity);
        return await dl.count(where);
    }
    async foreach(where: (entity: T) => FilterBase, what?: (entity: T) => Promise<void>) {

        let options: EntitySourceFindOptions = {};
        if (where) {
            options.where = where(this.entity);
        }
        let items = await this.entity.__killMeSource.find(options);
        for (const item of items) {
            await what(item);
        }

    }
    async find(options?: FindOptionsPerEntity<T>) {
        let dl = new DataList(this.entity);
        return await dl.get(options);
    }
    async findFirst(where?: (entity: T) => FilterBase) {
        let r = await this.entity.__killMeSource.find({ where: where ? where(this.entity) : undefined });
        if (r.length == 0)
            return undefined;
        return r[0];
    }
    toPojoArray(items: T[]) {
        let exc = new ColumnHashSet();

        exc.add(...this.entity._getExcludedColumns(this.entity, this.context));

        return Promise.all(items.map(f => f.__toPojo(exc)));
    }
    create() {
        return this.factory();
    }
    gridSettings(settings?: IDataSettings<T>) {
        return new GridSettings(this.entity, settings);
    }
}
export interface EntityType {
    new(...args: any[]): Entity<any>;
    __key: string;
}
export const allEntities: EntityType[] = [];


export function EntityClass<T extends EntityType>(theEntityClass: T) {
    let original = theEntityClass;
    let f = class extends theEntityClass {
        constructor(...args: any[]) {
            super(...args);
            this._setFactoryClassAndDoInitColumns(f);
            if (!this.__options.name) {
                this.__options.name = original.name;
            }
        }
    }
    allEntities.push(f);
    f.__key = theEntityClass.name + allEntities.indexOf(f);
    return f;
}
export interface UserInfo {
    id: string;
    name: string;
    roles: string[];
}

export abstract class DirectSQL {
    abstract execute(sql: string): Promise<SQLQueryResult>;
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
export declare type AngularComponent = { new(...args: any[]): any };