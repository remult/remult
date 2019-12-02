import { Injectable } from "@angular/core";
import { DataProvider, DataApiRequest, FilterBase,  FindOptionsPerEntity, EntityDataProvider, FindOptions, EntityProvider } from "../core/dataInterfaces1";
import { RestDataProvider, Action, AngularHttpProvider , wrapFetch } from "../core/restDataProvider";
import { Entity, EntityOptions, NumberColumn, Column, DataList, ColumnHashSet, IDataSettings, GridSettings, EntitySource, SQLQueryResult, LookupCache, Lookup, extractSortFromSettings } from "../core/utils";
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
    getPathInUrl() {
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
                return e;
            }, this._lookupCache, this, dataSource);
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
    getPathInUrl() {
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


export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> implements EntityProvider<T>{
    private entity: T;
    private _edp: EntityDataProvider;
    constructor(public create: () => T, private _lookupCache: LookupCache<any>[], private context: Context, dataSource: DataProvider) {
        this.create = () => {
            let e = create();
            e.setSource(dataSource);
            e._setContext(context);
            e.__KillMeEntityProvider = this;
            return e;
        };
        this.entity = this.create();
        this._edp = dataSource.getEntityDataProvider(this.entity);
    }
    __getDataProvider() { return this._edp; }

    lookup(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): T {

        let key = this.entity.__getName();
        let lookup: Lookup<lookupIdType, T>;
        this._lookupCache.forEach(l => {
            if (l.key == key)
                lookup = l.lookup;
        });
        if (!lookup) {
            lookup = new Lookup(this.entity, this);
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
            lookup = new Lookup(this.entity, this);
            this._lookupCache.push({ key, lookup });
        }
        return lookup.whenGet(filter);

    }


    async count(where?: (entity: T) => FilterBase) {
        return await this._edp.count(where ? where(this.entity) : undefined);
    }
    async foreach(where: (entity: T) => FilterBase, what?: (entity: T) => Promise<void>) {
        let items = await this.find({
            where: where
        });
        for (const item of items) {
            await what(item);
        }
    }
    private translateOptions(options: FindOptionsPerEntity<T>) {
        if (!options)
            return undefined;
        let getOptions: FindOptions = {};
        if (options.where)
            getOptions.where = options.where(this.entity);
        if (options.orderBy)
            getOptions.orderBy = extractSortFromSettings(this.entity, options);
        if (options.limit)
            getOptions.limit = options.limit;
        if (options.page)
            getOptions.page = options.page;
        if (options.additionalUrlParameters)
            getOptions.additionalUrlParameters = options.additionalUrlParameters;
        return getOptions;
    }

    async find(options?: FindOptionsPerEntity<T>) {
        let r = await this._edp.find(this.translateOptions(options));
        return r.map(i => {
            let r = this.create();
            r.__entityData.setData(i, r);
            r.__killMeSource = this.entity.__killMeSource;
            return r;
        });
    }
    async findFirst(where?: (entity: T) => FilterBase) {
        let r = await this.find({ where });
        if (r.length == 0)
            return undefined;
        return r[0];
    }
    toPojoArray(items: T[]) {
        let exc = new ColumnHashSet();

        exc.add(...this.entity._getExcludedColumns(this.entity, this.context));

        return Promise.all(items.map(f => f.__toPojo(exc)));
    }

    gridSettings(settings?: IDataSettings<T>) {
        return new GridSettings(this, settings);
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