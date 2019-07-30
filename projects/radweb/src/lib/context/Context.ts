import { Injectable } from "@angular/core";
import { DataProviderFactory, DataApiRequest, FilterBase, EntitySourceFindOptions, FindOptionsPerEntity } from "../core/dataInterfaces1";
import { RestDataProvider, Action, angularHttpProvider, wrapFetch } from "../core/restDataProvider";
import { Entity, EntityOptions, NumberColumn, Column, DataList, ColumnHashSet, IDataSettings, GridSettings } from "../core/utils";
import { InMemoryDataProvider } from "../core/inMemoryDatabase";
import { DataApiSettings } from "../server/DataApi";
import { HttpClient } from "@angular/common/http";
import { isFunction, isString, isBoolean } from "util";




@Injectable()
export class Context {
    clearAllCache(): any {
        this.cache = {};
        this._lookupCache = new stamEntity();
    }

    isSignedIn() {
        return !!this.user;
    }
    constructor(http: HttpClient) {
        if (http) {
            var prov = new angularHttpProvider(http);
            this._dataSource = new RestDataProvider(Context.apiBaseUrl
                , prov
                //,new restDataProviderHttpProviderUsingFetch()
            );
            Action.provider = prov;
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
        if (e instanceof ContextEntity) {
            e._setContext(this);
        }
        return e;
    }
    cache: any = {};
    public for<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }) {

        let classType = c as any;

        if (this.cache[classType.__key])
            return this.cache[classType.__key] as SpecificEntityHelper<lookupIdType, T>;
        return this.cache[classType.__key] = new SpecificEntityHelper<lookupIdType, T>(this.create(c), this._lookupCache, this);
    }

    private _lookupCache = new stamEntity();
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

function buildEntityOptions(o: ContextEntityOptions | string): EntityOptions | string {
    if (typeof (o) == 'string')
        return o;
    return {
        name: o.name,
        caption: o.caption,
        dbName: o.dbName,
        onSavingRow: o.onSavingRow,
    }
}

export class ContextEntity<idType> extends Entity<idType>{
    _noContextErrorWithStack: Error;
    constructor(private contextEntityOptions?: ContextEntityOptions | string) {
        super(() => {
            if (!this.__context) {

                throw this._noContextErrorWithStack;
            }
            if (!this.entityType) {
                throw this._noContextErrorWithStack;
            }
            return this.__context.create(this.entityType);

        }, new InMemoryDataProvider(), buildEntityOptions(contextEntityOptions));
        this._noContextErrorWithStack = new Error('@EntityClass not used or context was not set for' + this.constructor.name);
    }
    private __context: Context;
    _setContext(context: Context) {
        this.__context = context;
    }
    private entityType: EntityType;
    _setFactoryClassAndDoInitColumns(entityType: EntityType) {
        this.entityType = entityType;
        this.initColumns((<any>this).id);

    }
    _getExcludedColumns(x: Entity<any>, context: Context) {
        let r = x.__iterateColumns().filter(c => {
            return !context.isAllowed(c.includeInApi);
        });
        return r;
    }
    _getEntityApiSettings(r: Context): DataApiSettings<Entity<any>> {


        let x = r.for(this.entityType).create() as ContextEntity<any>;
        if (typeof (x.contextEntityOptions) == "string") {
            return {}
        }
        else {
            let options = x.contextEntityOptions;
            if (options.allowApiCRUD) {
                options.allowApiDelete = true;
                options.allowApiInsert = true;
                options.allowApiUpdate = true;
            }
            return {
                allowRead: r.isAllowed(options.allowApiRead),
                allowUpdate: r.isAllowed(options.allowApiUpdate),
                allowDelete: r.isAllowed(options.allowApiDelete),
                allowInsert: r.isAllowed(options.allowApiInsert),
                excludeColumns: x =>
                    this._getExcludedColumns(x, r)
                ,
                readonlyColumns: x => {
                    let r = x.__iterateColumns().filter(c => c.readonly);

                    return r;
                },
                get: {
                    where: x => options.apiDataFilter ? options.apiDataFilter() : undefined
                }
            }
        }
    }
}

export interface ContextEntityOptions {
    name: string;//required
    dbName?: string | (() => string);
    caption?: string;
    allowApiRead?: Allowed;
    allowApiUpdate?: Allowed;
    allowApiDelete?: Allowed;
    allowApiInsert?: Allowed;
    allowApiCRUD?: Allowed;
    apiDataFilter?: () => FilterBase;

    onSavingRow?: () => Promise<any>;
}
class stamEntity extends Entity<number> {

    id = new NumberColumn();
    constructor() {
        super(() => new stamEntity(), new InMemoryDataProvider(), "stamEntity");
        this.initColumns();
    }
}
export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> {
    constructor(private entity: T, private _lookupCache: Entity<any>, private context: Context) {

    }
    lookupAsync(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): Promise<T> {
        return this._lookupCache.lookupAsync(this.entity, filter);
    }
    lookup(filter: Column<lookupIdType> | ((entityType: T) => FilterBase)): T {
        let x = wrapFetch.wrap;
        wrapFetch.wrap = () => () => { };
        try {
            return this._lookupCache.lookup(this.entity, filter);
        } finally {
            wrapFetch.wrap = x;
        }
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
        if (this.entity instanceof ContextEntity)
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
}
export const allEntities: EntityType[] = [];


export function EntityClass(theEntityClass: EntityType) {

    var original = theEntityClass;

    // a utility function to generate instances of a class
    function construct(constructor: any, args: any[]) {
        var c: any = function () {
            return constructor.apply(this, args);
        }
        c.prototype = constructor.prototype;
        return new c();
    }
    let newEntityType: any;
    // the new constructor behaviour
    var f: any = function (...args: any[]) {

        let r = construct(original, args);
        if (r instanceof ContextEntity) {
            r._setFactoryClassAndDoInitColumns(newEntityType);

        }
        return r;
    }
    newEntityType = f;

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;
    // copy static methods
    for (let x in original) {
        f[x] = (<any>original)[x];
    }
    allEntities.push(f);
    f.__key = original.name + allEntities.indexOf(f);
    // return new constructor (will override original)
    return f;
}
export interface UserInfo {
    id: string;
    name: string;
    roles: string[];
}

export abstract class DirectSQL {
    abstract execute(sql: string);
}
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