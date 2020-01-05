import { Injectable } from "@angular/core";
import { DataProvider, FindOptions, EntityDataProvider, EntityDataProviderFindOptions, EntityProvider, EntityOrderBy, EntityWhere } from "./data-interfaces";
import { RestDataProvider } from "./data-providers/restDataProvider";
import { AngularHttpProvider } from "./angular/AngularHttpProvider";
import { extractSortFromSettings } from "./utils";
import { InMemoryDataProvider } from "./data-providers/inMemoryDatabase";
import { DataApiRequest } from "./DataApi";
import { HttpClient } from "@angular/common/http";
import { isFunction, isString, isBoolean } from "util";

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Column } from "./column";
import { Entity } from "./entity";
import { Lookup } from "./lookup";
import { IDataSettings, GridSettings } from "./gridSettings";
import { ColumnHashSet } from "./column-hash-set";
import { FilterBase } from './filter/filter-interfaces';
import { Action } from './server-action';
import { DropDownItem } from './column-interfaces';




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

        let ref = this._dialog.open(component, component[dialogConfigMember]);
        setParameters(ref.componentInstance);
        await ref.beforeClose().toPromise();
        if (returnAValue)
            return returnAValue(ref.componentInstance);
    }

    _lookupCache: LookupCache<any>[] = [];
}
export declare type DataProviderFactoryBuilder = (req: Context) => DataProvider;
export class ServerContext extends Context {
    constructor(dp?: DataProvider) {
        super(undefined);
        this._onServer = true;
        if (dp)
            this.setDataProvider(dp);


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
    private _factory: (newRow: boolean) => T;
    constructor(public create: () => T, private _lookupCache: LookupCache<any>[], private context: Context, dataSource: DataProvider) {
        this._factory = newRow => {
            let e = create();
            e.__entityData.dataProvider = this._edp;
            if (this.context.onServer)
                e.__entityData.initServerExpressions = async () => {
                    await Promise.all(e.__iterateColumns().map(async c => {
                        await c.__calcServerExpression();
                    }));
                }
            if (newRow) {
                e.__iterateColumns().forEach(c => { c.__setDefaultForNewRow() });
            }
            return e;
        };
        this.create = () => {
            return this._factory(true);
        };
        this.entity = this._factory(false);
        this._edp = dataSource.getEntityDataProvider(this.entity);
    }


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
    private translateOptions(options: FindOptions<T>) {
        if (!options)
            return undefined;
        let getOptions: EntityDataProviderFindOptions = {};
        if (options.where)
            getOptions.where = options.where(this.entity);
        if (options.orderBy)
            getOptions.orderBy = extractSortFromSettings(this.entity, options);
        if (options.limit)
            getOptions.limit = options.limit;
        if (options.page)
            getOptions.page = options.page;
        if (options.__customFindData)
            getOptions.__customFindData = options.__customFindData;
        return getOptions;
    }

    async find(options?: FindOptions<T>) {
        let r = await this._edp.find(this.translateOptions(options));
        return Promise.all(r.map(async i => {
            let r = this._factory(false);
            await r.__entityData.setData(i, r);
            return r;
        }));
    }
    fromPojo(r: any): T {
        let f = this._factory(false);
        f.__entityData.setData(r, f);
        return f;
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
        return new GridSettings(this, this.context, settings);
    }

    async getDropDownItems(args?: {
        idColumn?: (e: T) => Column<any>,
        captionColumn?: (e: T) => Column<any>,
        orderBy?: EntityOrderBy<T>,
        where?: EntityWhere<T>
    }): Promise<DropDownItem[]> {
        if (!args) {
            args = {};
        }
        if (!args.idColumn) {
            args.idColumn = x => x.__idColumn;
        }
        if (!args.captionColumn) {
            let idCol = args.idColumn(this.entity);
            for (const keyInItem of this.entity.__iterateColumns()) {
                if (keyInItem != idCol) {
                    args.captionColumn = x => x.__getColumn(keyInItem);
                    break;
                }
            }
        }
        return (await this.find({
            where: args.where,
            orderBy: args.orderBy,
            limit:1000
          })).map(x => {
            return {
              id: args.idColumn(x).value,
              caption: args.captionColumn(x).value
            }
          });
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
            this.__initColumns((<any>this).id);
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

export function DialogConfig(config: MatDialogConfig) {
    return function (target) {
        target[dialogConfigMember] = config;
        return target;
    };
}


const dialogConfigMember = Symbol("dialogConfigMember");

interface LookupCache<T extends Entity<any>> {
    key: string;
    lookup: Lookup<any, T>;
}
