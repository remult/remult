import { Injectable } from "@angular/core";
import { DataProviderFactory, DataApiRequest, FilterBase, EntitySourceFindOptions, FindOptionsPerEntity } from "../core/dataInterfaces1";
import { RestDataProvider, Action, angularHttpProvider, wrapFetch } from "../core/restDataProvider";
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
        this.cache = {};
        this._lookupCache = [];
    }

    isSignedIn() {
        return !!this.user;
    }
    constructor(http?: HttpClient, private _dialog?: MatDialog) {
        if (http instanceof HttpClient) {
            var prov = new angularHttpProvider(http);
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
   



    protected _dataSource: DataProviderFactory;
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

    public create<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }) {
        let e = new c(this);
        e.setSource(this._dataSource);
        e._setContext(this);
        return e;
    }
    cache: any = {};
    public for<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }) {

        let classType = c as any;

        if (this.cache[classType.__key])
            return this.cache[classType.__key] as SpecificEntityHelper<lookupIdType, T>;
        return this.cache[classType.__key] = new SpecificEntityHelper<lookupIdType, T>(this.create(c), this._lookupCache, this);
    }
    async openDialog<T,C>(component: { new(...args: any[]): C; }, setParameters: (it: C) => void, returnAValue: (it: C) => T) {
        let ref = this._dialog.open(component);
        setParameters(ref.componentInstance);
        await ref.beforeClose().toPromise();
        return returnAValue(ref.componentInstance);
      }

    _lookupCache: LookupCache<any>[] = [];
}
export class ServerContext extends Context {
    constructor() {
        super(undefined);
        this._onServer = true;


    }

    private req: DataApiRequest;

    setReq(req: DataApiRequest) {
        this.req = req;
        this._user = req.user ? req.user : undefined;
    }
    setDataProvider(dataProvider: DataProviderFactory) {
        this._dataSource = dataProvider;
    }
    getOrigin() {
        return this.req.getHeader('origin')
    }
}


export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> {
    constructor(private entity: T, private _lookupCache: LookupCache<any>[], private context: Context) {

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
        let items = await this.entity.source.find(options);
        for (const item of items) {
            await what(item);
        }

    }
    async find(options?: FindOptionsPerEntity<T>) {
        let dl = new DataList(this.entity);
        return await dl.get(options);
    }
    async findFirst(where?: (entity: T) => FilterBase) {
        let r = await this.entity.source.find({ where: where ? where(this.entity) : undefined });
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
        return this.entity.source.createNewItem();
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