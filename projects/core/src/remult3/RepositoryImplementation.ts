
import { ColumnDefinitions, ColumnSettings, ValueConverter } from "../column-interfaces";
import { EntityOptions } from "../entity";
import { CompoundIdColumn, LookupColumn, makeTitle, ValueListValueConverter } from '../column';
import { EntityDefinitions, filterOptions, EntityColumn, EntityColumns, EntityWhere, filterOf, FindOptions, ClassType, Repository, sortOf, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy, EntityBase, ColumnDefinitionsOf, supportsContains } from "./remult3";
import { allEntities, Allowed, Context, EntityAllowed, iterateConfig, IterateToArrayOptions, setControllerSettings } from "../context";
import { AndFilter, Filter, OrFilter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { extractWhere, packToRawWhere } from "../filter/filter-consumer-bridge-to-url-builder";
import { Lookup } from "../lookup";
import { DataApiSettings } from "../data-api";
import { RowEvents } from "../__EntityValueProvider";
import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, ErrorInfo } from "../data-interfaces";
import { isFunction } from "util";
import { BoolValueConverter, DateValueConverter, DefaultValueConverter, IntValueConverter } from "../columns/loaders";


export class RepositoryImplementation<T> implements Repository<T>{
    createAfterFilter(orderBy: EntityOrderBy<T>, lastRow: T): EntityWhere<T> {
        let values = new Map<string, any>();

        for (const s of this.translateOrderByToSort(orderBy).Segments) {
            values.set(s.column.key, lastRow[s.column.key]);
        }
        return x => {
            let r: Filter = undefined;
            let equalToColumn: ColumnDefinitions[] = [];
            for (const s of this.translateOrderByToSort(orderBy).Segments) {
                let f: Filter;
                for (const c of equalToColumn) {
                    f = new AndFilter(f, new Filter(x => x.isEqualTo(c, values.get(c.key))));
                }
                equalToColumn.push(s.column);
                if (s.isDescending) {
                    f = new AndFilter(f, new Filter(x => x.isLessThan(s.column, values.get(s.column.key))));
                }
                else
                    f = new AndFilter(f, new Filter(x => x.isGreaterThan(s.column, values.get(s.column.key))));
                r = new OrFilter(r, f);
            }
            return r;
        }
    }
    createAUniqueSort(orderBy: EntityOrderBy<T>): EntityOrderBy<T> {
        if (!orderBy)
            orderBy = this._info.entityInfo.defaultOrderBy;
        if (!orderBy)
            orderBy = x => ({ column: this._info.idColumn })
        return x => {
            let sort = this.translateOrderByToSort(orderBy);
            if (!sort.Segments.find(x => x.column == this.defs.idColumn)) {
                sort.Segments.push({ column: this.defs.idColumn });
            }
            return sort.Segments;
        }
    }
    private _info: EntityFullInfo<T>;
    private _lookup = new Lookup(this);
    private __edp: EntityDataProvider;
    private get edp() {
        return this.__edp ? this.__edp : this.__edp = this.dataProvider.getEntityDataProvider(this.defs);
    }
    constructor(private entity: ClassType<T>, private context: Context, private dataProvider: DataProvider) {
        this._info = createOldEntity(entity, context);
    }
    idCache = new Map<any, any>();
    getCachedById(id: any): T {
        this.getCachedByIdAsync(id);
        let r = this.idCache.get(id);
        if (r instanceof Promise)
            return undefined;
        return r;
    }
    async getCachedByIdAsync(id: any): Promise<T> {

        let r = this.idCache.get(id);
        if (r instanceof Promise)
            return await r;
        if (this.idCache.has(id)) {
            return r;
        }
        this.idCache.set(id, undefined);
        let row = this.findId(id).then(row => {
            if (row === undefined) {
                r = null;
            }
            else
                r = row;
            this.idCache.set(id, r);
            return r;
        });
        this.idCache.set(id, row);
        return await row;
    }
    addToCache(item: T) {
        if (item)
            this.idCache.set(this.getRowHelper(item).columns.idColumn.value, item);
    }
    fromPojo(x: any) {
        throw new Error("Method not implemented.");
    }

    get defs(): EntityDefinitions { return this._info };

    _getApiSettings(): DataApiSettings<T> {
        let options = this._info.entityInfo;
        if (options.allowApiCrud !== undefined) {
            if (options.allowApiDelete === undefined)
                options.allowApiDelete = options.allowApiCrud;
            if (options.allowApiInsert === undefined)
                options.allowApiInsert = options.allowApiCrud;
            if (options.allowApiUpdate === undefined)
                options.allowApiUpdate = options.allowApiCrud;
            if (options.allowApiRead === undefined)
                options.allowApiRead = options.allowApiCrud;
        }

        return {
            name: options.key,
            allowRead: this.context.isAllowed(options.allowApiRead),
            allowUpdate: (e) => checkEntityAllowed(this.context, options.allowApiUpdate, e),
            allowDelete: (e) => checkEntityAllowed(this.context, options.allowApiDelete, e),
            allowInsert: (e) => checkEntityAllowed(this.context, options.allowApiInsert, e),
            requireId: this.context.isAllowed(options.apiRequireId),
            get: {
                where: x => {
                    if (options.apiDataFilter) {
                        return options.apiDataFilter(x, this.context);
                    }
                    return undefined;
                }
            }
        }
    }

    isIdColumn(col: ColumnDefinitions<any>): boolean {
        return col.key == this.defs.idColumn.key;
    }
    getIdFilter(id: any): Filter {
        return new Filter(x => x.isEqualTo(this.defs.idColumn, id));
    }


    iterate(options?: EntityWhere<T> | IterateOptions<T>): IteratableResult<T> {
        let opts: IterateOptions<T> = {};
        if (options) {
            if (typeof options === 'function')
                opts.where = <any>options;
            else
                opts = <any>options;
        }

        let cont = this;
        let _count: number;
        let self = this;
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
                opts.orderBy = self.createAUniqueSort(opts.orderBy);
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
                            where: x => new AndFilter(self.translateWhereToFilter(opts.where),
                                self.translateWhereToFilter(nextPageFilter)),
                            orderBy: opts.orderBy,
                            limit: pageSize
                        });
                        itemIndex = 0;
                        if (items.length == 0) {
                            return { value: <T>undefined, done: true };
                        } else {
                            nextPageFilter = self.createAfterFilter(opts.orderBy, items[items.length - 1]);
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
    async findOrCreate(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {

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
                    this.updateEntityBasedOnWhere(opts.where, r);
                }
            }
            return r;
        }
        return r;
    }
    lookup(filter: EntityWhere<T>): T {
        return this._lookup.get(filter);
    }
    async lookupAsync(filter: EntityWhere<T>): Promise<T> {
        return this._lookup.whenGet(filter);
    }
    getRowHelper(entity: T): rowHelper<T> {
        let x = entity[entityMember];
        if (!x) {
            x = entity[entityMember] = new rowHelperImplementation(this._info, entity, this, this.edp, this.context, true);
            if (entity instanceof EntityBase) {
                entity._ = x;
            }
        }
        return x;
    }

    async delete(entity: T): Promise<void> {
        await this.getRowHelper(entity).delete();
    }
    async save(entity: T): Promise<T> {
        return await this.getRowHelper(entity).save();
    }
    async find(options?: FindOptions<T>): Promise<T[]> {
        let opt: EntityDataProviderFindOptions = {};
        if (!options)
            options = {};

        opt = {};
        if (!options.orderBy) {
            options.orderBy = this._info.entityInfo.defaultOrderBy;
        }
        opt.where = this.translateWhereToFilter(options.where);
        opt.orderBy = this.translateOrderByToSort(options.orderBy);

        opt.limit = options.limit;
        opt.page = options.page;

        let rawRows = await this.edp.find(opt);
        let result = await Promise.all(rawRows.map(async r =>
            await this.mapRawDataToResult(r)
        ));
        return result;

    }

    private async mapRawDataToResult(r: any) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        let helper = new rowHelperImplementation(this._info, x, this, this.edp, this.context, false);
        await helper.loadDataFrom(r);
        helper.saveOriginalData();

        x[entityMember] = helper;
        if (x instanceof EntityBase)
            x._ = x[entityMember];
        return x;
    }

    async count(where?: EntityWhere<T>): Promise<number> {
        return this.edp.count(this.translateWhereToFilter(where));
    }
    async findFirst(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {

        return this.iterate(options).first();
    }


    create(): T {
        let r = new this.entity(this.context);
        let z = this.getRowHelper(r);

        return r;
    }
    findId(id: any): Promise<T> {
        return this.iterate(x => x[this.defs.idColumn.key].isEqualTo(id)).first();
    }

    createIdInFilter(items: T[]): Filter {
        let idColumn = this.defs.idColumn;
        return new Filter(x => x.isIn(idColumn, items.map(i => this.getRowHelper(i).columns[idColumn.key].value)))

    }
    translateOrderByToSort(orderBy: EntityOrderBy<T>): Sort {
        if (!orderBy)
            return undefined;
        let entity = this._info.createSortOf();
        let resultOrder = orderBy(entity);//
        let sort: Sort;
        if (Array.isArray(resultOrder))
            sort = new Sort(...resultOrder);
        else
            sort = new Sort(resultOrder);
        return sort;

    }

    translateWhereToFilter(where: EntityWhere<T>): Filter {
        let entity = this._info.createFilterOf();
        if (this._info.entityInfo.fixedFilter) {
            if (Array.isArray(where))
                where.push(this._info.entityInfo.fixedFilter);
            else
                where = [where, this._info.entityInfo.fixedFilter];
        }
        if (Array.isArray(where)) {
            return new AndFilter(...where.map(x => {
                if (x === undefined)
                    return undefined;
                let r = x(entity);
                if (Array.isArray(r))
                    return new AndFilter(...r);
                return r;
            }));

        }
        else if (typeof where === 'function') {
            let r = where(entity);
            if (Array.isArray(r))
                return new AndFilter(...r);
            return r;
        }
    }
    updateEntityBasedOnWhere(where: EntityWhere<T>, r: T) {
        let w = this.translateWhereToFilter(where);

        if (w) {
            w.__applyToConsumer({
                containsCaseInsensitive: () => { },
                isDifferentFrom: () => { },
                isEqualTo: (col, val) => {
                    r[col.key] = val;
                },
                isGreaterOrEqualTo: () => { },
                isGreaterThan: () => { },
                isIn: () => { },
                isLessOrEqualTo: () => { },
                isLessThan: () => { },
                isNotNull: () => { },
                isNull: () => { },
                startsWith: () => { },
                or: () => { }
            });
        }
    }
    packWhere(where: EntityWhere<T>) {
        if (!where)
            return {};
        return packToRawWhere(this.translateWhereToFilter(where));

    }
    unpackWhere(packed: any): Filter {
        return this.extractWhere({ get: (key: string) => packed[key] });

    }
    extractWhere(filterInfo: { get: (key: string) => any; }): Filter {
        return extractWhere([...this.defs.columns], filterInfo);
    }
}



export const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");
export function getEntityOptions<T>(entity: ClassType<T>, throwError = true) {
    if (entity === undefined)
        if (throwError) {
            throw new Error("Undefined is not an entity :)")
        }
        else return undefined;
    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);
    if (!info && throwError)
        throw new Error(entity.prototype.constructor.name + " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?")

    return info;
}
export const columnsOfType = new Map<any, columnInfo[]>();
export function createOldEntity<T>(entity: ClassType<T>, context: Context) {
    let r: columnInfo[] = columnsOfType.get(entity);
    if (!r)
        columnsOfType.set(entity, r = []);

    let info = getEntityOptions(entity);


    let base = Object.getPrototypeOf(entity);
    while (base != null) {

        let baseCols = columnsOfType.get(base);
        if (baseCols) {
            r.unshift(...baseCols.filter(x => !r.find(y => y.key == x.key)));
        }
        base = Object.getPrototypeOf(base);
    }



    return new EntityFullInfo<T>(r, info, context);
}

class rowHelperBase<T>
{
    error: string;
    constructor(protected columnsInfo: columnInfo[], protected instance: T, protected context: Context) {

    }
    lookups = new Map<string, LookupColumn<any>>();
    async waitLoad() {
        await Promise.all([...this.lookups.values()].map(x => x.waitLoad()));
    }
    errors: { [key: string]: string };
    protected __assertValidity() {
        if (!this.hasErrors()) {
            let error: ErrorInfo = {
                modelState: Object.assign({}, this.errors),
                message: this.error
            }
            if (!error.message) {
                for (const col of this.columnsInfo) {
                    if (this.errors[col.key]) {
                        error.message = col.settings.caption + ": " + this.errors[col.key];
                    }
                }

            }
            throw error;


        }
    }
    catchSaveErrors(err: any): any {
        let e = err;

        if (e instanceof Promise) {
            return e.then(x => this.catchSaveErrors(x));
        }
        if (e.error) {
            e = e.error;
        }

        if (e.message)
            this.error = e.message;
        else if (e.Message)
            this.error = e.Message;
        else this.error = e;
        let s = e.modelState;
        if (!s)
            s = e.ModelState;
        if (s) {
            this.errors = s;
        }
        throw err;

    }
    __clearErrors() {
        this.errors = undefined;
        this.error = undefined;
    }
    hasErrors(): boolean {
        return !!!this.error && this.errors == undefined;

    }
    protected copyDataToObject() {
        let d: any = {};
        for (const col of this.columnsInfo) {
            let lu = this.lookups.get(col.key);
            if (lu)
                d[col.key] = lu.id;
            else
                d[col.key] = this.instance[col.key];
        }
        return d;
    }
    originalValues: any = {};
    saveOriginalData() {
        this.originalValues = this.copyDataToObject();
    }
    async __validateEntity(afterValidationBeforeSaving?: (row: T) => Promise<any> | any) {
        this.__clearErrors();

        await this.__performColumnAndEntityValidations();
        if (afterValidationBeforeSaving)
            await afterValidationBeforeSaving(this.instance);
        this.__assertValidity();
    }
    async __performColumnAndEntityValidations() {

    }
    toApiPojo() {
        let result: any = {};
        for (const col of this.columnsInfo) {
            if (!this.context || col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                let val = this.instance[col.key];
                let lu = this.lookups.get(col.key);
                if (lu)
                    val = lu.id;
                result[col.key] = col.settings.valueConverter(this.context).toJson(val);
            }
        }
        return result;
    }

    _updateEntityBasedOnApi(body: any) {
        for (const col of this.columnsInfo) {
            if (body[col.key] !== undefined)
                if (col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                    if (!this.context || col.settings.allowApiUpdate === undefined || checkEntityAllowed(this.context, col.settings.allowApiUpdate, this.instance)) {
                        this.instance[col.key] = col.settings.valueConverter(this.context).fromJson(body[col.key]);
                    }

                }
        }

    }
}
export class rowHelperImplementation<T> extends rowHelperBase<T> implements rowHelper<T> {



    constructor(private info: EntityFullInfo<T>, instance: T, public repository: Repository<T>, private edp: EntityDataProvider, context: Context, private _isNew: boolean) {
        super(info.columnsInfo, instance, context);
        for (const col of info.columnsInfo) {
            let ei = getEntityOptions(col.settings.dataType, false);

            if (ei) {
                let lookup = new LookupColumn(context.for(col.settings.dataType), undefined);
                this.lookups.set(col.key, lookup);
                Object.defineProperty(instance, col.key, {
                    get: () =>
                        lookup.item,
                    set: (val) =>
                        lookup.set(val),
                });
            }
        }
        if (_isNew) {
            for (const col of info.columnsInfo) {

                if (col.settings.defaultValue) {
                    if (typeof col.settings.defaultValue === "function") {
                        instance[col.key] = col.settings.defaultValue(instance, context);
                    }
                    else if (!instance[col.key])
                        instance[col.key] = col.settings.defaultValue;
                }

            }
        }
    }

    private _wasDeleted = false;

    listeners: RowEvents[];
    register(listener: RowEvents) {
        if (!this.listeners)
            this.listeners = []
        this.listeners.push(listener);
    }



    wasDeleted(): boolean {
        return this._wasDeleted;
    }

    undoChanges() {
        this.loadDataFrom(this.originalValues);
        this.__clearErrors();
    }
    async reload(): Promise<void> {
        return this.edp.find({ where: this.repository.getIdFilter(this.id) }).then(async newData => {
            await this.loadDataFrom(newData[0]);
        });
    }

    private _columns: EntityColumns<T>;

    get columns(): EntityColumns<T> {
        if (!this._columns) {
            let _items = [];
            let r = {
                find: (c: ColumnDefinitions<T>) => r[c.key],
                [Symbol.iterator]: () => _items[Symbol.iterator]()
            };
            for (const c of this.info.columnsInfo) {
                _items.push(r[c.key] = new columnImpl(c.settings, this.info.columns[c.key], this.instance, this, this));
            }
            r["idColumn"] = r.find(this.info.idColumn);

            this._columns = r as unknown as EntityColumns<T>;
        }
        return this._columns;

    }

    async save(afterValidationBeforeSaving?: (row: T) => Promise<any> | any): Promise<T> {
        await this.__validateEntity(afterValidationBeforeSaving);
        let doNotSave = false;
        if (this.info.entityInfo.saving) {
            await this.info.entityInfo.saving(this.instance, () => doNotSave = true);
        }

        this.__assertValidity();

        let d = this.copyDataToObject();
        if (this.info.idColumn instanceof CompoundIdColumn)
            d.id = undefined;
        let updatedRow: any;
        try {
            if (this.isNew()) {
                updatedRow = await this.edp.insert(d);
            }
            else {
                if (doNotSave) {
                    updatedRow = (await this.edp.find({ where: this.repository.getIdFilter(this.id) }))[0];
                }
                else
                    updatedRow = await this.edp.update(this.id, d);
            }
            await this.loadDataFrom(updatedRow);
            if (this.info.entityInfo.saved)
                await this.info.entityInfo.saved(this.instance);
            if (this.listeners)
                this.listeners.forEach(x => {
                    if (x.rowSaved)
                        x.rowSaved(true);
                });
            this.saveOriginalData();
            this._isNew = false;
            return this.instance;
        }
        catch (err) {
            await this.catchSaveErrors(err);
        }

    }





    async delete() {
        this.__clearErrors();
        if (this.info.entityInfo.deleting)
            await this.info.entityInfo.deleting(this.instance);
        this.__assertValidity();

        try {
            await this.edp.delete(this.id);
            if (this.info.entityInfo.deleted)
                await this.info.entityInfo.deleted(this.instance);
            if (this.listeners) {
                for (const l of this.listeners) {
                    if (l.rowDeleted)
                        l.rowDeleted();
                }
            }
            this._wasDeleted = true;
        } catch (err) {
            await this.catchSaveErrors(err);
        }
    }

    async loadDataFrom(data: any) {
        for (const col of this.info.columns) {
            let lu = this.lookups.get(col.key);
            if (lu)
                lu.id = data[col.key];
            else
                this.instance[col.key] = data[col.key];
        }
        await this.calcServerExpression();
        if (this.repository.defs.idColumn instanceof CompoundIdColumn) {
            data.columns.idColumn.__addIdToPojo(data);
        }
        this.id = data[this.repository.defs.idColumn.key];
    }
    private id;

    private async calcServerExpression() {
        if (this.context.onServer)
            for (const col of this.info.columnsInfo) {
                if (col.settings.serverExpression) {
                    this.instance[col.key] = await col.settings.serverExpression(this.instance);
                }
            }
    }

    isNew(): boolean {
        return this._isNew;
    }
    wasChanged(): boolean {
        for (const col of this.info.columns) {
            let val = this.instance[col.key];
            let lu = this.lookups.get(col.key);
            if (lu) {
                val = lu.id;
            }
            if (col.valueConverter.toJson(val) != col.valueConverter.toJson(this.originalValues[col.key]))
                return true;
        }
        return false;
    }

    async __performColumnAndEntityValidations() {
        for (const c of this.columnsInfo) {
            if (c.settings.validate) {
                let col = new columnImpl(c.settings, this.info.columns[c.key], this.instance, this, this);
                await col.__performValidation();
            }
        }

        if (this.info.entityInfo.validation)
            await this.info.entityInfo.validation(this.instance);
    }
}
const controllerColumns = Symbol("controllerColumns");
export function getControllerDefs<T>(controller: T, context?: Context): controllerDefsImpl<T> {

    let result = controller[controllerColumns] as controllerDefsImpl<any>;
    if (!result)
        result = controller[entityMember];
    if (!result) {
        let columnSettings: columnInfo[] = columnsOfType.get(controller.constructor);
        if (!columnSettings)
            columnsOfType.set(controller.constructor, columnSettings = []);
        controller[controllerColumns] = result = new controllerDefsImpl(columnSettings, controller, context);
    }
    return result;
}

export interface controllerDefs<T = any> {
    readonly columns: EntityColumns<T>,
}
export class controllerDefsImpl<T = any> extends rowHelperBase<T> implements controllerDefs<T> {
    constructor(columnsInfo: columnInfo[], instance: any, context: Context) {
        super(columnsInfo, instance, context);


        let _items = [];
        let r = {
            find: (c: EntityColumn<any, T>) => r[c.defs.key],
            [Symbol.iterator]: () => _items[Symbol.iterator]()
        };

        for (const col of columnsInfo) {
            _items.push(r[col.key] = new columnImpl<any, any>(col.settings, new columnDefsImpl(col, undefined, context), instance, undefined, this));
        }

        this.columns = r as unknown as EntityColumns<T>;


    }
    async __performColumnAndEntityValidations() {
        for (const col of this.columns) {
            if (col instanceof columnImpl) {
                await col.__performValidation();
            }
        }
    }
    errors: { [key: string]: string; };
    originalValues: any;
    columns: EntityColumns<T>;

}
export class columnImpl<colType, rowType> implements EntityColumn<colType, rowType> {
    constructor(private settings: ColumnSettings, public defs: ColumnDefinitions, public entity: any, private helper: rowHelper<rowType>, private rowBase: rowHelperBase<rowType>) {

    }
    async load(): Promise<colType> {
        let lu = this.rowBase.lookups.get(this.defs.key);
        if (lu) {
            if (this.wasChanged()) {
                await lu.waitLoadOf(this.rawOriginalValue());
            }
            return await lu.waitLoad();
        }
        return this.value;
    }
    target: ClassType<any> = this.settings.target;


    inputType: string = this.settings.inputType;

    get error(): string {
        if (!this.rowBase.errors)
            return undefined;
        return this.rowBase.errors[this.defs.key];
    }
    set error(error: string) {
        if (!this.rowBase.errors)
            this.rowBase.errors = {};
        this.rowBase.errors[this.defs.key] = error;
    }
    get displayValue(): string {
        if (this.value != undefined) {
            if (this.settings.displayValue)
                return this.settings.displayValue(this.entity, this.value);
            else if (this.defs.valueConverter.displayValue)
                return this.defs.valueConverter.displayValue(this.value);
            else
                return this.value.toString();
        }
        return "";
    };
    get value() { return this.entity[this.defs.key] };
    set value(value: any) { this.entity[this.defs.key] = value };
    get originalValue(): any {
        let lu = this.rowBase.lookups.get(this.defs.key);
        if (lu)
            return lu.get(this.rawOriginalValue());
        return this.rowBase.originalValues[this.defs.key];
    };
    private rawOriginalValue(): any {
        return this.rowBase.originalValues[this.defs.key];
    }

    get inputValue(): string { return this.defs.valueConverter.toInput(this.value, this.settings.inputType); }
    set inputValue(val: string) { this.value = this.defs.valueConverter.fromInput(val, this.settings.inputType); };
    wasChanged(): boolean {
        let val = this.value;
        let lu = this.rowBase.lookups.get(this.defs.key);
        if (lu) {
            val = lu.id;
        }
        return this.defs.valueConverter.toJson(this.rowBase.originalValues[this.defs.key]) != this.defs.valueConverter.toJson(val);
    }
    rowHelper: rowHelper<any> = this.helper;


    async __performValidation() {
        let x = typeof (this.settings.validate);
        if (Array.isArray(this.settings.validate)) {
            for (const v of this.settings.validate) {
                await v(this.entity, this);
            }
        } else if (typeof this.settings.validate === 'function')
            await this.settings.validate(this.entity, this);
    }




}

export function getEntityOf<T>(item: T): rowHelper<T> {
    let x = item[entityMember];
    if (!x)
        throw new Error("item " + item + " was not initialized using a context");
    return x;

}

export class columnDefsImpl implements ColumnDefinitions {
    constructor(private colInfo: columnInfo, private entityDefs: EntityFullInfo<any>, private context: Context) {
        if (colInfo.settings.serverExpression)
            this.isServerExpression = true;
        if (colInfo.settings.sqlExpression)
            this.dbReadOnly = true;
        if (typeof (this.colInfo.settings.allowApiUpdate) === "boolean")
            this.readonly = this.colInfo.settings.allowApiUpdate;
        if (!this.inputType)
            this.inputType = this.valueConverter.inputType;


    }
    evilOriginalSettings: ColumnSettings<any, any> = this.colInfo.settings;
    target: ClassType<any> = this.colInfo.settings.target;
    readonly: boolean;

    valueConverter = this.colInfo.settings.valueConverter(this.context);
    allowNull = !!this.colInfo.settings.allowNull;

    caption = this.colInfo.settings.caption;
    get dbName() {
        let result;
        if (this.colInfo.settings.sqlExpression) {
            if (typeof this.colInfo.settings.sqlExpression === "function") {
                result = this.colInfo.settings.sqlExpression(this.entityDefs, this.context);
            } else
                result = this.colInfo.settings.sqlExpression;
        }
        if (result)
            return result;
        return this.colInfo.settings.dbName;

    }
    inputType = this.colInfo.settings.inputType;
    key = this.colInfo.settings.key;
    dbReadOnly = this.colInfo.settings.dbReadOnly;
    isServerExpression: boolean;
    dataType = this.colInfo.settings.dataType;
}
class EntityFullInfo<T> implements EntityDefinitions<T> {

    evilOriginalSettings = this.entityInfo;

    constructor(public columnsInfo: columnInfo[], public entityInfo: EntityOptions, private context: Context) {


        let _items = [];
        let r = {
            find: (c: ColumnDefinitions<any>) => r[c.key],
            [Symbol.iterator]: () => _items[Symbol.iterator](),
            createFilterOf: () => this.createFilterOf()
        };

        for (const x of columnsInfo) {
            _items.push(r[x.key] = new columnDefsImpl(x, this, context));
        }

        this.columns = r as unknown as ColumnDefinitionsOf<T>;

        this.dbAutoIncrementId = entityInfo.dbAutoIncrementId;
        this.key = entityInfo.key;
        this.caption = entityInfo.caption;
        if (typeof entityInfo.dbName === "string")
            this.dbName = entityInfo.dbName;
        else if (typeof entityInfo.dbName === "function")
            this.dbName = entityInfo.dbName(this.columns, context);
        if (entityInfo.id) {
            this.idColumn = entityInfo.id(this.columns)
        } else {
            if (this.columns["id"])
                this.idColumn = this.columns["id"];
            else
                this.idColumn = [...this.columns][0];
        }
    }

    dbAutoIncrementId: boolean;
    idColumn: ColumnDefinitions<any>;
    columns: ColumnDefinitionsOf<T>;


    key: string;
    dbName: string;
    caption: string;

    createFilterOf(): filterOf<T> {
        let r = {};
        for (const c of this.columns) {
            r[c.key] = new filterHelper(c);
        }
        return r as filterOf<T>;
    }
    createSortOf(): sortOf<T> {
        let r = {};
        for (const c of this.columns) {
            r[c.key] = new sortHelper(c);
        }
        return r as sortOf<T>;
    }
}
class sortHelper implements SortSegment {
    constructor(public column: ColumnDefinitions, public isDescending = false) {

    }
    descending(): SortSegment {
        return new sortHelper(this.column, !this.isDescending);
    }
}
export class filterHelper implements filterOptions<any>, comparableFilterItem<any>, supportsContains<any>  {
    constructor(private col: ColumnDefinitions) {

    }
    processVal(val: any) {
        let ei = getEntityOptions(this.col.dataType, false);
        if (ei) {
            if (!val)
                return null;
            return val.id;
        }
        return val;
    }
    startsWith(val: any): Filter {
        return new Filter(add => add.startsWith(this.col, val));
    }

    contains(val: string): Filter {
        return new Filter(add => add.containsCaseInsensitive(this.col, val));

    }
    isLessThan(val: any): Filter {
        return new Filter(add => add.isLessThan(this.col, val));
    }
    isGreaterOrEqualTo(val: any): Filter {
        return new Filter(add => add.isGreaterOrEqualTo(this.col, val));
    }
    isNotIn(values: any[]): Filter {
        return new Filter(add => {
            for (const v of values) {
                add.isDifferentFrom(this.col, v);
            }
        });
    }
    isDifferentFrom(val: any) {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNotNull(this.col));
        return new Filter(add => add.isDifferentFrom(this.col, val));
    }
    isLessOrEqualTo(val: any): Filter {
        return new Filter(add => add.isLessOrEqualTo(this.col, val));
    }
    isGreaterThan(val: any): Filter {
        return new Filter(add => add.isGreaterThan(this.col, val));
    }
    isEqualTo(val: any): Filter {
        val = this.processVal(val);
        if (val === null && this.col.allowNull)
            return new Filter(add => add.isNull(this.col));
        return new Filter(add => add.isEqualTo(this.col, val));
    }
    isIn(val: any[]): Filter {
        val = val.map(x => this.processVal(x));
        return new Filter(add => add.isIn(this.col, val));
    }

}


export function Storable<T = any>(settings?: ColumnSettings<T, any>) {
    return target => {
        if (!settings) {
            settings = {};
        }
        if (!settings.dataType)
            settings.dataType = target;
        Reflect.defineMetadata(storableMember, settings, target);
        return target;
    }

}

export function Column<T = any, colType = any>(settings?: ColumnSettings<colType, T>) {
    if (!settings) {
        settings = {};
    }


    return (target, key,c?) => {
        if (!settings.key) {
            settings.key = key;
        }
        
        if (!settings.dbName)
            settings.dbName = settings.key;

        let names: columnInfo[] = columnsOfType.get(target.constructor);
        if (!names) {
            names = [];
            columnsOfType.set(target.constructor, names)
        }

        let type = settings.dataType;
        if (!type) {
            type = Reflect.getMetadata("design:type", target, key);
            settings.dataType = type;
        }
        if (!settings.target)
            settings.target = target;

        settings = decorateColumnSettings(settings);
        names.push({
            key,
            settings,
            type
        });

    }



}
const storableMember = Symbol("storableMember");
export function decorateColumnSettings<T>(settings: ColumnSettings<T>) {
    if (settings.dataType) {
        let settingsOnTypeLevel = Reflect.getMetadata(storableMember, settings.dataType);
        if (settingsOnTypeLevel) {
            settings = {
                ...settingsOnTypeLevel,
                ...settings
            }
        }
    }
    if (!settings.caption) {
        settings.caption = makeTitle(settings.key);
    }
    if (settings.dataType == Number) {
        let x = settings as unknown as ColumnSettings<Number>;
        if (!settings.valueConverter)
            x.valueConverter = () => IntValueConverter;
    }
    if (settings.dataType == Date) {
        let x = settings as unknown as ColumnSettings<Date>;
        if (!settings.valueConverter) {
            x.valueConverter = () => DateValueConverter;
        }
    }

    if (settings.dataType == Boolean) {
        let x = settings as unknown as ColumnSettings<Boolean>;
        if (!x.valueConverter)
            x.valueConverter = () => BoolValueConverter;

    }
    if (!settings.valueConverter) {
        settings.valueConverter = () => DefaultValueConverter;
    }




    return settings;
}

interface columnInfo {
    key: string;
    settings: ColumnSettings,
    type: any
}
export function Entity<T>(options: EntityOptions<T>) {
    return target => {
        if (!options.key || options.key == '')
            options.key = target.name;
        let base = Object.getPrototypeOf(target);
        if (base) {
            let opt = Reflect.getMetadata(entityInfo, target);
            if (opt) {
                options = {
                    ...opt,
                    ...options
                }
            }
        }
        if (!options.dbName)
            options.dbName = options.key;
        allEntities.push(target);
        setControllerSettings(target, { allowed: false, key: undefined })
        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}




export class CompoundId implements ColumnDefinitions<string>{
    constructor(...columns: ColumnDefinitions[]) {
        if (false)
            console.log(columns);
    }
    evilOriginalSettings: ColumnSettings<any, any>;
    valueConverter: ValueConverter<string>;
    target: ClassType<any>;
    readonly: true;

    allowNull: boolean;
    dbReadOnly: boolean;
    isServerExpression: boolean;
    key: string;
    caption: string;
    inputType: string;
    dbName: string;

    dataType: any;


}
function checkEntityAllowed(context: Context, x: EntityAllowed<any>, entity: any) {
    if (Array.isArray(x)) {
        {
            for (const item of x) {
                if (checkEntityAllowed(context, item, entity))
                    return true;
            }
        }
    }
    else if (typeof (x) === "function") {
        return x(context, entity)
    } else return context.isAllowed(x as Allowed);
}