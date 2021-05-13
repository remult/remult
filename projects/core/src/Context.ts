
import { DataProvider, FindOptions as FindOptions, EntityDataProvider, EntityDataProviderFindOptions, EntityProvider, EntityOrderBy, EntityWhere, entityOrderByToSort, extractSort, translateEntityWhere, updateEntityBasedOnWhere, RestDataProviderHttpProvider } from "./data-interfaces";
import { DataApiRequest, DataApiSettings } from "./data-api";
import { Column, columnBridgeToDefs, CompoundIdColumn, __isGreaterThan, __isLessThan } from "./column";
import { Entity } from "./entity";
import { AndFilter, Filter, OrFilter } from './filter/filter-interfaces';
import { Action } from './server-action';
import { RestDataProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';

import { NewEntity, Repository } from "./remult3";
import { myEntityDefs, RepositoryImplementation } from "./remult3/RepositoryImplementation";
import { columnDefs } from "./column-interfaces";




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


export class Context {
    clearAllCache(): any {
        this.cache.clear();
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
    setUser(info: UserInfo) {
        this._user = info;
        this._userChangeEvent.fire();
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
    repCache = new Map<NewEntity<any>, Repository<any>>();
    public for<T>(entity: NewEntity<T>): Repository<T> {
        let r = this.repCache.get(entity);
        if (!r) {
            this.repCache.set(entity, r = new RepositoryImplementation(entity, this,this._dataSource));
        }
        return r;

    }


    cache = new Map<DataProvider, Map<any, SpecificEntityHelper<any, Entity>>>();
    public for_old<lookupIdType, T extends Entity<lookupIdType>>(c: { new(...args: any[]): T; }, dataSource?: DataProvider) {
        if (!dataSource)
            dataSource = this._dataSource;

        let dsCache = this.cache.get(dataSource);
        if (!dsCache) {
            dsCache = new Map<string, SpecificEntityHelper<any, Entity>>();
            this.cache.set(dataSource, dsCache);
        }


        let r = dsCache.get(c) as SpecificEntityHelper<lookupIdType, T>;
        if (!r) {
            r = new SpecificEntityHelper<lookupIdType, T>(() => {
                let e = new c(this);
                e.__initColumns((<any>e).id);

                return e;
            }, this, dataSource);
            dsCache.set(c, r);
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


export class SpecificEntityHelper<lookupIdType, T extends Entity<lookupIdType>> implements EntityProvider<T>{
    _getApiSettings(forEntity?: Entity): DataApiSettings<T> {
        return (forEntity ? forEntity : this.entity)._getEntityApiSettings(this.context);
    }

    private __entity: T;
    private get entity(): T {
        if (!this.__entity)
            this.__entity = this._factory(false);
        return this.__entity;
    }
    private ___edp: EntityDataProvider;
    private get _edp(): EntityDataProvider {
        if (!this.___edp) {
            //@ts-ignore
            this.___edp = {};
            this.___edp = this.dataSource.getEntityDataProvider(new myEntityDefs(this.entity));
        }
        return this.___edp;
    }
    private _factory: (newRow: boolean) => T;
    constructor(
        /** Creates a new instance of the entity
         * @example
         * let p = this.context.for(Products).create();
         * p.name.value = 'Wine';
         * await p.save();
         */
        public create: () => T
        , private context: Context, private dataSource: DataProvider) {
        this._factory = newRow => {
            let e = create();
            e.__entityData.dataProvider = this._edp;
            e.__entityData.entityProvider = this;
            if (this.context.onServer)
                e.__entityData.initServerExpressions = async (ee) => {
                    await Promise.all(e.columns.toArray().map(async c => {
                        await c.__calcServerExpression(ee);
                    }));
                }
            if (newRow) {
                e.columns.toArray().forEach(c => { c.__setDefaultForNewRow() });
            }
            return e;
        };
        this.create = () => {
            return this._factory(true);
        };

    }

    /** Returns an array of rows for the specific type 
    * @example
    * let products = await context.for(Products).find();
    * for (const p of products) {
    *   console.log(p.name.value);
    * }
    * @example
    * this.products = await this.context.for(Products).find({
    *     orderBy: p => p.name
    *     , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    *     p.availableTo.isGreaterOrEqualTo(new Date()))
    * });
    * @see
    * For all the different options see [FindOptions](ref_findoptions)
    */
    async find(options?: FindOptions<T>) {
        let r = await this._edp.find(this.translateOptions(options));
        return Promise.all(r.map(async i => {
            let r = this._factory(false);
            await r.__entityData.setData(i, r);
            return r;
        }));
    }
    /** returns a single entity based on a filter
     * @example:
     * let p = await this.context.for(Products).findFirst(p => p.id.isEqualTo(7))
     */
    async findFirst(options?: EntityWhere<T> | IterateOptions<T>) {
        return this.iterate(options).first();
    }
    /** returns a single entity based on a filter, if it doesn't not exist, it is created with the default values set by the `isEqualTo` filters that were used
    * @example:
    * let p = await this.context.for(Products).findOrCreate(p => p.id.isEqualTo(7))
    */
    async findOrCreate(options?: EntityWhere<T> | IterateOptions<T>) {
        let r = await this.iterate(options).first();
        if (!r) {
            r = this.create();
            if (options) {
                let opts: IterateOptions<T> = {};
                if (options) {
                    if (typeof options === 'function')
                        opts.where = <any>options;
                    else
                        opts = <any>options;
                }
                if (opts.where) {
                    updateEntityBasedOnWhere(opts.where, r);
                }
            }
            return r;
        }
        return r;
    }
    /** returns a single entity based on it's id 
     * @example
     * let p = await context.for(Products).findId(productId);
    */
    async findId(id: Column<lookupIdType> | lookupIdType) {
        return this.iterate(x => x.columns.idColumn.isEqualTo(id)).first();
    }




    /** returns the number of rows that matches the condition 
     * @example
     * let count = await this.context.for(Products).count(p => p.price.isGreaterOrEqualTo(5))
    */
    async count(where?: EntityWhere<T>) {
        return await this._edp.count(where ? translateEntityWhere(where, this.entity) : undefined);
    }



    private translateOptions(options: FindOptions<T>) {

        let getOptions: EntityDataProviderFindOptions = {};
        if (!options) {
            options = {};
        }
        if (options.where)
            getOptions.where = translateEntityWhere(options.where, this.entity);
        if (options.orderBy)
            getOptions.orderBy = entityOrderByToSort(this.entity, options.orderBy);
        if (options.limit)
            getOptions.limit = options.limit;
        if (options.page)
            getOptions.page = options.page;
        if (options.__customFindData)
            getOptions.__customFindData = options.__customFindData;
        getOptions.where = getOptions.where;
        return getOptions;
    }


    /** Iterate is a more robust version of Find, that is designed to iterate over a large dataset without loading all the data into an array
     * It's safer to use Iterate when working with large datasets of data.
     * 
     * 
     * @example
     * for await (let p of this.context.for(Products).iterate()){
     *   console.log(p.name.value);
     * }
     * @example
     * for await (let p of this.context.for(Products).iterate({
     *     orderBy: p => p.name
     *     , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
     *     p.availableTo.isGreaterOrEqualTo(new Date()))
        })){
     *   console.log(p.name.value);
     * }
    */

    iterate(options?: EntityWhere<T> | IterateOptions<T>) {

        let opts: IterateOptions<T> = {};
        if (options) {
            if (typeof options === 'function')
                opts.where = <any>options;
            else
                opts = <any>options;
        }

        let cont = this;
        let _count: number;
        let r = new class {

            async toArray(options?: IterateToArrayOptions) {
                if (!options) {
                    options = {};
                }


                return cont.find({
                    where: opts.where,
                    orderBy: opts.orderBy,
                    limit: options.limit,
                    page: options.page
                });
            }
            async first() {
                let r = await cont.find({
                    where: opts.where,
                    orderBy: opts.orderBy,
                    limit: 1
                });
                if (r.length == 0)
                    return undefined;
                return r[0];
            }

            async count() {
                if (_count === undefined)
                    _count = await cont.count(opts.where);
                return _count;

            }
            async forEach(what: (item: T) => Promise<any>) {
                let i = 0;
                for await (const x of this) {
                    await what(x);
                    i++;
                }
                return i;
            }

            //@ts-ignore
            [Symbol.asyncIterator]() {

                if (!opts.where) {
                    opts.where = x => undefined;
                }
                if (!opts.orderBy)
                    opts.orderBy = x =>[ {column:new columnBridgeToDefs(x.columns.idColumn)}];
                opts.orderBy = createAUniqueSort(opts.orderBy, cont.entity);
                let pageSize = iterateConfig.pageSize;


                let itemIndex = -1;
                let items: T[];

                let itStrategy: (() => Promise<IteratorResult<T>>);
                let nextPageFilter: EntityWhere<T> = x => undefined;;

                let j = 0;

                itStrategy = async () => {
                    if (opts.progress) {
                        opts.progress.progress(j++ / await this.count());
                    }
                    if (items === undefined || itemIndex == items.length) {
                        if (items && items.length < pageSize)
                            return { value: <T>undefined, done: true };
                        items = await cont.find({
                            where: x => new AndFilter(translateEntityWhere(opts.where, x), translateEntityWhere(nextPageFilter, x)),
                            orderBy: opts.orderBy,
                            limit: pageSize
                        });
                        itemIndex = 0;
                        if (items.length == 0) {
                            return { value: <T>undefined, done: true };
                        } else {
                            nextPageFilter = createAfterFilter(opts.orderBy, items[items.length - 1]);
                        }

                    }
                    if (itemIndex < items.length)
                        return { value: items[itemIndex++], done: false };


                };
                return {
                    next: async () => {
                        let r = itStrategy();
                        return r;
                    }
                };
            }
        }
        return r;
    }
    /** Creates an instance of an entity based on a JSON object */
    async fromPojo(r: any) {
        let f = this._factory(false);
        await f.__entityData.setData(r, f);
        return f;
    }
    /** Creates a JSON object based on an entity */
    toApiPojo(entity: T): any {
        let r = {};
        for (const c of entity.columns) {

            c.__addToPojo(r, this.context)
        }
        return r;

    }
    _updateEntityBasedOnApi(entity: T, body: any) {
        for (const c of entity.columns) {

            c.__loadFromPojo(body, this.context);
        }
        return entity;
    }

    /** creates an array of JSON objects based on an array of Entities  */
    toPojoArray(items: T[]) {
        return items.map(f => this.toApiPojo(f));
    }



}
export interface EntityType<T = any> {
    new(...args: any[]): Entity<T>;
}
export const allEntities: EntityType<any>[] = [];
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

export function EntityClass<T extends EntityType<any>>(theEntityClass: T) {
    let original = theEntityClass;
    let f = original;
    setControllerSettings(theEntityClass, { allowed: false, key: undefined })
    /*f = class extends theEntityClass {
        constructor(...args: any[]) {
            super(...args);
            this.__initColumns((<any>this).id);
            if (!this.__options.name) {
                this.__options.name = original.name;
            }
        }
    }*/
    allEntities.push(f);
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
declare type EntityAllowedRule<T> = string | Role | ((c: Context, entity: T) => boolean) | boolean;;
export declare type EntityAllowed<T> = EntityAllowedRule<T> | EntityAllowedRule<T>[];
export declare type AngularComponent = { new(...args: any[]): any };






export interface RoleChecker {
    isAllowed(roles: Allowed): boolean;
}
export interface IterateOptions<entityType extends Entity> {
    where?: EntityWhere<entityType>;
    orderBy?: EntityOrderBy<entityType>;
    progress?: { progress: (progress: number) => void };
}


export interface IterateToArrayOptions {
    limit?: number;
    page?: number;
}
export const iterateConfig = {
    pageSize: 200
};
export function createAUniqueSort(orderBy: EntityOrderBy<any>, entity: Entity) {
    let s = extractSort(orderBy(entity));
    let criticalColumns = [entity.columns.idColumn];
    if (entity.columns.idColumn instanceof CompoundIdColumn) {
        criticalColumns = entity.columns.idColumn.columns;
    }
    let columnsToAdd: Column[] = [];
    for (const c of criticalColumns) {
        if (!s.Segments.find(x => x.column.key == c.defs.key)) {
            columnsToAdd.push(c);
        }

    }
    if (columnsToAdd.length == 0)
        return orderBy;
    return (e: Entity) => {
        let s = extractSort(orderBy(e));
        for (const c of columnsToAdd) {
            s.Segments.push({ column: new columnBridgeToDefs(e.columns.find(c)) });
        }
        return s;
    }
}
export function createAfterFilter(orderBy: EntityOrderBy<any>, lastRow: Entity): EntityWhere<any> {
    let values = new Map<string, any>();

    for (const s of extractSort(orderBy(lastRow)).Segments) {
        values.set(s.column.key, lastRow.columns.find(s.column.key).value);
    }
    return x => {
        let r: Filter = undefined;
        let equalToColumn: columnDefs[] = [];
        for (const s of extractSort(orderBy(x)).Segments) {
            let f: Filter;
            for (const c of equalToColumn) {
                f = new AndFilter(f, new Filter(x => x.isEqualTo(c, values.get(c.key))));
            }
            equalToColumn.push(s.column);
            if (s.descending) {
                f = new AndFilter(f, __isLessThan(s.column, values.get(s.column.key)));
            }
            else
                f = new AndFilter(f, __isGreaterThan(s.column, values.get(s.column.key)));
            r = new OrFilter(r, f);
        }
        return r;
    }
}
export interface EventDispatcher {
    observe(what: () => any): UnObserve;
}
export declare type UnObserve = () => void;
export class EventSource {
    listeners: (() => {})[] = []
    fire() {
        for (const l of this.listeners) {
            l();
        }
    }
    dispatcher: EventDispatcher = {
        observe: (what) => {
            this.listeners.push(what);
            what();
            return () => {
                this.listeners = this.listeners.filter(x => x != what);
            }
        }
    };

}


