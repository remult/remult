
import { columnDefs, ColumnSettings, dbLoader, inputLoader, jsonLoader } from "../column-interfaces";
import { EntityOptions } from "../entity";
import { BoolColumn, Column as oldColumn, columnBridgeToDefs, ColumnDefs, CompoundIdColumn, DateTimeColumn, makeTitle, NumberColumn, StringColumn, __isGreaterOrEqualTo, __isGreaterThan, __isLessOrEqualTo, __isLessThan } from '../column';
import { EntityDefs, filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy, EntityBase, columnDefsOf, supportsContains } from "./remult3";
import { allEntities, Allowed, Context, EntityAllowed, iterateConfig, IterateToArrayOptions } from "../context";
import * as old from '../data-interfaces';
import { AndFilter, Filter, OrFilter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { extractWhere, FilterSerializer, packToRawWhere } from "../filter/filter-consumer-bridge-to-url-builder";
import { Lookup } from "../lookup";
import { DataApiSettings } from "../data-api";

import { RowEvents } from "../__EntityValueProvider";
import { ObjectColumn } from "../columns/object-column";
import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, ErrorInfo } from "../data-interfaces";
import { isFunction } from "util";


export class RepositoryImplementation<T> implements Repository<T>{
    createAfterFilter(orderBy: EntityOrderBy<T>, lastRow: T): EntityWhere<T> {
        let values = new Map<string, any>();

        for (const s of this.translateOrderByToSort(orderBy).Segments) {
            values.set(s.column.key, lastRow[s.column.key]);
        }
        return x => {
            let r: Filter = undefined;
            let equalToColumn: columnDefs[] = [];
            for (const s of this.translateOrderByToSort(orderBy).Segments) {
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
    createAUniqueSort(orderBy: EntityOrderBy<T>): EntityOrderBy<T> {
        if (!orderBy)
            orderBy = this._info.entityInfo.defaultOrderBy;
        if (!orderBy)
            orderBy = x => ({ __toSegment: () => ({ column: this._info.idColumn }), descending: undefined })
        return x => {
            let sort = this.translateOrderByToSort(orderBy);
            if (!sort.Segments.find(x => x.column == this.defs.idColumn)) {
                sort.Segments.push({ column: this.defs.idColumn });
            }
            return sort.Segments.map(s => ({ __toSegment: () => s, descending: undefined }));
        }
    }
    private _info: EntityFullInfo<T>;
    private _lookup = new Lookup(this);
    private __edp: EntityDataProvider;
    private get edp() {
        return this.__edp ? this.__edp : this.__edp = this.dataProvider.getEntityDataProvider(this.defs);
    }
    constructor(private entity: NewEntity<T>, private context: Context, private dataProvider: DataProvider) {
        this._info = createOldEntity(entity);
    }
    get defs(): EntityDefs { return this._info };

    _getApiSettings(): DataApiSettings<T> {
        let options = this._info.entityInfo;
        if (options.allowApiCRUD !== undefined) {
            if (options.allowApiDelete === undefined)
                options.allowApiDelete = options.allowApiCRUD;
            if (options.allowApiInsert === undefined)
                options.allowApiInsert = options.allowApiCRUD;
            if (options.allowApiUpdate === undefined)
                options.allowApiUpdate = options.allowApiCRUD;
            if (options.allowApiRead === undefined)
                options.allowApiRead = options.allowApiCRUD;
        }
        let checkAllowed = (x: EntityAllowed<any>, entity: any) => {
            if (Array.isArray(x)) {
                {
                    for (const item of x) {
                        if (checkAllowed(item, entity))
                            return true;
                    }
                }
            }
            else if (typeof (x) === "function") {
                return x(this.context, entity)
            } else return this.context.isAllowed(x as Allowed);
        }
        return {
            name: options.name,
            allowRead: this.context.isAllowed(options.allowApiRead),
            allowUpdate: (e) => checkAllowed(options.allowApiUpdate, e),
            allowDelete: (e) => checkAllowed(options.allowApiDelete, e),
            allowInsert: (e) => checkAllowed(options.allowApiInsert, e),
            requireId: this.context.isAllowed(options.apiRequireId),
            get: {
                where: options.apiDataFilter
            }
        }
    }

    isIdColumn(col: columnDefs<any>): boolean {
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
            sort = new Sort(...resultOrder.map(r => r.__toSegment()));
        else
            sort = new Sort(resultOrder.__toSegment());
        return sort;

    }

    translateWhereToFilter(where: EntityWhere<T>): Filter {
        let entity = this._info.createFilterOf();
        if (this._info.entityInfo.fixedWhereFilter) {
            if (Array.isArray(where))
                where.push(this._info.entityInfo.fixedWhereFilter);
            else
                where = [where, this._info.entityInfo.fixedWhereFilter];
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
        return extractWhere(this.defs.columns._items, filterInfo);
    }
}



export const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");

export const columnsOfType = new Map<any, columnInfo[]>();
export function createOldEntity<T>(entity: NewEntity<T>) {
    let r: columnInfo[] = columnsOfType.get(entity.prototype);
    if (!r)
        columnsOfType.set(entity.prototype, r = []);

    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);
    if (!info)
        throw new Error(entity.prototype.constructor.name + " is not a known entity, did you forget to set @Entity()?")
    if (info.extends) {

        r.unshift(...columnsOfType.get(info.extends.prototype).filter(x => !r.find(y => y.key == x.key)));
        info.extends = undefined;
    }

    return new EntityFullInfo<T>(r, info);
}
class rowHelperImplementation<T> implements rowHelper<T>{


    constructor(private info: EntityFullInfo<T>, private entity: T, public repository: Repository<T>, private edp: EntityDataProvider, private context: Context, private _isNew: boolean) {
        if (_isNew) {
            for (const col of info.columnsInfo) {
                if (col.settings.defaultValue) {
                    if (typeof col.settings.defaultValue === "function") {
                        entity[col.key] = col.settings.defaultValue(entity);
                    }
                    else if (!entity[col.key])
                        entity[col.key] = col.settings.defaultValue;
                }
            }
        }
    }
    validationError: string;
    private _wasDeleted = false;

    listeners: RowEvents[];
    register(listener: RowEvents) {
        if (!this.listeners)
            this.listeners = []
        this.listeners.push(listener);
    }

    _updateEntityBasedOnApi(body: any) {
        for (const col of this.info.columnsInfo) {
            if (body[col.key])
                if (col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                    if (col.settings.allowApiUpdate === undefined || this.context.isAllowed(col.settings.allowApiUpdate)) {
                        this.entity[col.key] = col.settings.jsonLoader.fromJson(body[col.key]);
                    }

                }
        }

    }

    wasDeleted(): boolean {
        return this._wasDeleted;
    }
    isValid(): boolean {
        return !!!this.validationError && this.errors == undefined;

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
    toApiPojo() {
        let result: any = {};
        for (const col of this.info.columnsInfo) {
            if (col.settings.includeInApi === undefined || this.context.isAllowed(col.settings.includeInApi)) {
                result[col.key] = col.settings.jsonLoader.toJson(this.entity[col.key]);
            }
        }
        return result;
    }

    private _columns: entityOf<T>;

    get columns(): entityOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any, T>) => r[c.key],
                _items: []
            };
            for (const c of this.info.columnsInfo) {
                r._items.push(r[c.key] = new columnImpl(c.settings, this.info.columns[c.key], this.entity, this));
            }

            this._columns = r as unknown as entityOf<T>;
        }
        return this._columns;

    }
    async __validateEntity(afterValidationBeforeSaving: (row: T) => Promise<any> | any) {
        this.__clearErrors();

        for (const c of this.info.columnsInfo) {
            if (c.settings.validate) {
                let col = new columnImpl(c.settings, this.info.columns[c.key], this.entity, this);
                await col.__performValidation();
            }
        }

        if (this.info.entityInfo.validation)
            await this.info.entityInfo.validation(this.entity);
        if (afterValidationBeforeSaving)
            await afterValidationBeforeSaving(this.entity);
        this.__assertValidity();
    }
    async save(afterValidationBeforeSaving?: (row: T) => Promise<any> | any): Promise<T> {
        await this.__validateEntity(afterValidationBeforeSaving);
        let doNotSave = false;
        if (this.info.entityInfo.saving) {
            this.info.entityInfo.saving(this.entity, () => doNotSave = true);
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
                await this.info.entityInfo.saved(this.entity);
            if (this.listeners)
                this.listeners.forEach(x => {
                    if (x.rowSaved)
                        x.rowSaved(true);
                });
            this.saveOriginalData();
            this._isNew = false;
            return this.entity;
        }
        catch (err) {
            await this.catchSaveErrors(err);
        }

    }

    private copyDataToObject() {
        let d: any = {};
        for (const col of this.info.columns._items) {
            d[col.key] = this.entity[col.key];
        }
        return d;
    }
    originalValues: any = {};
    saveOriginalData() {
        this.originalValues = this.copyDataToObject();
    }



    async delete() {
        this.__clearErrors();
        if (this.info.entityInfo.deleting)
            await this.info.entityInfo.deleting(this.entity);
        this.__assertValidity();

        try {
            await this.edp.delete(this.id);
            if (this.info.entityInfo.deleted)
                await this.info.entityInfo.deleted(this.entity);
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
    errors: { [key: string]: string };
    private __assertValidity() {
        if (!this.isValid()) {
            let error: ErrorInfo = {
                modelState: Object.assign({}, this.errors),
                message: this.validationError
            }
            if (!error.message) {
                for (const col of this.info.columns._items) {
                    if (this.errors[col.key]) {
                        error.message = col.caption + ": " + this.errors[col.key];
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
            this.validationError = e.message;
        else if (e.Message)
            this.validationError = e.Message;
        else this.validationError = e;
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
        this.validationError = undefined;
    }
    async loadDataFrom(data: any) {
        for (const col of this.info.columns._items) {
            this.entity[col.key] = data[col.key];
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
                    this.entity[col.key] = await col.settings.serverExpression(this.entity);
                }
            }
    }

    isNew(): boolean {
        return this._isNew;
    }
    wasChanged(): boolean {
        for (const col of this.info.columns._items) {
            if (this.entity[col.key] != this.originalValues[col.key])
                return true;
        }
        return false;
    }
}
class columnImpl<T> implements column<any, T> {
    constructor(private settings: ColumnSettings, private defs: columnDefs, private entity: any, private helper: rowHelperImplementation<T>) {

    }
    allowNull = this.defs.allowNull;
    inputType: string = this.settings.inputType;
    inputLoader = this.settings.inputLoader;
    get error(): string {
        if (!this.helper.errors)
            return undefined;
        return this.helper.errors[this.key];
    }
    set error(error: string) {
        if (!this.helper.errors)
            this.helper.errors = {};
        this.helper.errors[this.key] = error;
    }
    get displayValue(): string {
        if (this.value != undefined) {
            if (this.settings.displayValue)
                return this.settings.displayValue(this.value, this.entity);
            else
                return this.value.toString();
        }
        return "";
    };
    get value() { return this.entity[this.key] };
    set value(value: any) { this.entity[this.key] = value };
    get originalValue(): any { return this.helper.originalValues[this.key] };
    get inputValue(): string { return this.settings.inputLoader.toInput(this.value); }
    set inputValue(val: string) { this.value = this.settings.inputLoader.fromInput(val); };
    wasChanged(): boolean {
        return this.originalValue != this.value;
    }
    rowHelper: rowHelper<any> = this.helper;
    dbReadOnly: boolean = this.defs.dbReadOnly;
    isVirtual: boolean = this.defs.isVirtual;
    key: string = this.defs.key;
    caption: string = this.defs.caption;
    get dbName(): string { return this.defs.dbName };
    dbLoader: dbLoader<any> = this.defs.dbLoader;
    jsonLoader: jsonLoader<any> = this.defs.jsonLoader;
    type: any = this.defs.type;
    dbType?: string = this.defs.dbType;

    async __performValidation() {
        let x = typeof (this.settings.validate);
        if (Array.isArray(this.settings.validate)) {
            for (const v of this.settings.validate) {
                await v(this, this.entity);
            }
        } else if (typeof this.settings.validate === 'function')
            await this.settings.validate(this, this.entity);
    }




}

export class columnBridge<T, ET> implements column<T, ET>{
    constructor(private col: oldColumn, private item: any, public rowHelper: rowHelper<ET>) {

    }
    allowNull = this.col.defs.allowNull;
    type: any;
    dbType?: string;
    get dbReadOnly(): boolean { return this.col.defs.dbReadOnly };
    get isVirtual(): boolean { return this.col.defs.__isVirtual() };
    jsonLoader: jsonLoader<any> = { fromJson: x => this.col.fromRawValue(x), toJson: x => this.col.toRawValue(x) };
    dbLoader: dbLoader<any> = this.col.__getStorage();
    get dbName(): string {
        return this.col.defs.dbName;
    }
    inputLoader: inputLoader<any> = {
        fromInput: x => this.jsonLoader.fromJson(x),
        toInput: x => this.jsonLoader.toJson(x)
    }

    get caption(): string { return this.col.defs.caption }
    get inputType(): string { return this.col.defs.inputType }
    get error(): string { return this.col.validationError }
    set error(val: string) { this.col.validationError = val; }
    get displayValue(): string { return this.col.displayValue };
    get inputValue(): string { return this.col.inputValue };
    set inputValue(val: string) {
        this.col.inputValue = val
        this.item[this.col.defs.key] = this.col.value;
    };
    get value(): any { return this.item[this.col.defs.key] };
    get originalValue(): any { return this.col.originalValue };
    get key(): string { return this.col.defs.key };
    wasChanged(): boolean {
        return this.col.wasChanged();
    }

}
export function getEntityOf<T>(item: T): rowHelper<T> {
    let x = item[entityMember];
    if (!x)
        throw new Error("item " + item + " was not initialized using a context");
    return x;

}

class columnDefsImpl implements columnDefs {
    constructor(private colInfo: columnInfo, private entityDefs: EntityFullInfo<any>) {
        if (colInfo.settings.serverExpression)
            this.isVirtual = true;
        if (colInfo.settings.sqlExpression)
            this.dbReadOnly = true;

    }
    inputLoader = this.colInfo.settings.inputLoader;
    allowNull = !!this.colInfo.settings.allowNull;

    caption = this.colInfo.settings.caption;
    dbLoader = this.colInfo.settings.dbLoader;
    get dbName() {
        if (this.colInfo.settings.sqlExpression) {
            if (typeof this.colInfo.settings.sqlExpression === "function") {
                return this.colInfo.settings.sqlExpression(this.entityDefs.columns);
            } else
                return this.colInfo.settings.sqlExpression;
        }
        return this.colInfo.settings.dbName;

    }
    inputType = this.colInfo.settings.inputType;
    jsonLoader = this.colInfo.settings.jsonLoader;
    key = this.colInfo.settings.key;
    dbReadOnly = this.colInfo.settings.dbReadOnly;
    isVirtual: boolean;
    type = this.colInfo.settings.type;
    dbType = this.colInfo.settings.dbType;
}
class EntityFullInfo<T> implements EntityDefs<T> {



    constructor(public columnsInfo: columnInfo[], public entityInfo: EntityOptions) {


        let r = {
            find: (c: column<any, T>) => r[c.key],
            _items: []
        };

        for (const x of columnsInfo) {
            r._items.push(r[x.key] = new columnDefsImpl(x, this));
        }

        this.columns = r as unknown as entityOf<T>;

        this.dbAutoIncrementId = entityInfo.dbAutoIncrementId;
        this.name = entityInfo.name;
        this.caption = entityInfo.caption;
        if (typeof entityInfo.dbName === "string")
            this.dbName = entityInfo.dbName;
        else if (typeof entityInfo.dbName === "function")
            this.dbName = entityInfo.dbName(this.columns);
        if (entityInfo.id) {
            this.idColumn = entityInfo.id(this.columns)
        } else {
            if (this.columns["id"])
                this.idColumn = this.columns["id"];
            else
                this.idColumn = this.columns._items[0];
        }
    }

    dbAutoIncrementId: boolean;
    idColumn: columnDefs<any>;
    columns: columnDefsOf<T>;


    name: string;
    dbName: string;
    caption: string;

    createFilterOf(): filterOf<T> {
        let r = {};
        for (const c of this.columns._items) {
            r[c.key] = new filterHelper(c);
        }
        return r as filterOf<T>;
    }
    createSortOf(): sortOf<T> {
        let r = {};
        for (const c of this.columns._items) {
            r[c.key] = new sortHelper(c);
        }
        return r as sortOf<T>;
    }
}
class sortHelper implements TheSort {
    constructor(private col: columnDefs, private _descending = false) {

    }
    get descending(): TheSort {
        return new sortHelper(this.col, !this._descending);
    }
    __toSegment(): SortSegment {
        return {
            column: this.col,
            descending: this._descending
        }
    }


}
export class filterHelper implements filterOptions<any>, comparableFilterItem<any>, supportsContains<any>  {
    constructor(private col: columnDefs) {

    }
    startsWith(val: any): Filter {
        return new Filter(add => add.startsWith(this.col, val));
    }

    contains(val: string): Filter {
        return new Filter(add => add.containsCaseInsensitive(this.col, val));

    }
    isLessThan(val: any): Filter {
        return __isLessThan(this.col, val);
    }
    isGreaterOrEqualTo(val: any): Filter {
        return __isGreaterOrEqualTo(this.col, val);
    }
    isNotIn(values: any[]): Filter {
        return new Filter(add => {
            for (const v of values) {
                add.isDifferentFrom(this.col, v);
            }
        });
    }
    isDifferentFrom(val: any) {
        return new Filter(add => add.isDifferentFrom(this.col, val));
    }
    isLessOrEqualTo(val: any): Filter {
        return __isLessOrEqualTo(this.col, val);
    }
    isGreaterThan(val: any): Filter {
        return __isGreaterThan(this.col, val);
    }
    isEqualTo(val: any): Filter {
        return new Filter(add => add.isEqualTo(this.col, val));
    }
    isIn(val: any[]): Filter {
        return new Filter(add => add.isIn(this.col, val));
    }

}



export function Column<T = any, colType = any>(settings?: ColumnSettings<colType, T>) {
    if (!settings) {
        settings = {};
    }


    return (target, key) => {
        if (!settings.key) {
            settings.key = key;
        }
        if (!settings.caption) {
            settings.caption = makeTitle(settings.key);
        }
        if (!settings.dbName)
            settings.dbName = settings.key;

        let names: columnInfo[] = columnsOfType.get(target);
        if (!names) {
            names = [];
            columnsOfType.set(target, names)
        }

        let type = settings.type;
        if (!type) {
            type = Reflect.getMetadata("design:type", target, key);
            settings.type = type;
        }

        if (!settings.dbLoader) {
            if (settings.type == Number) {
                settings.dbLoader = {
                    //@ts-ignore
                    fromDb: value => {
                        if (value !== undefined)
                            return +value;
                        return undefined;
                    },
                    toDb: value => value

                }
            } else
                settings.dbLoader = {
                    fromDb: x => x,
                    toDb: x => x
                }
        }
        if (!settings.inputLoader) {
            settings.inputLoader = {
                fromInput: x => settings.jsonLoader.fromJson(x),
                toInput: x => settings.jsonLoader.toJson(x)
            }
        }
        if (!settings.jsonLoader) {
            if (settings.type == Boolean) {
                settings.jsonLoader = {
                    //@ts-ignore
                    fromJson: value => {
                        if (typeof value === "boolean")
                            return value;
                        if (value !== undefined) {
                            return value.toString().trim().toLowerCase() == 'true';
                        }
                        return undefined;
                    },
                    toJson: x => x
                }
            }

            else
                settings.jsonLoader = {
                    fromJson: x => x,
                    toJson: x => x
                }
        }
        names.push({
            key,
            settings,
            type
        });

    }

}

interface columnInfo {
    key: string;
    settings: ColumnSettings,
    type: any
}
export function Entity<T>(options: EntityOptions<T>) {
    return target => {
        if (!options.name || options.name == '')
            options.name = target.constructor.name;
        if (!options.dbName)
            options.dbName = options.name;
        allEntities.push(target);
        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}




export class CompoundId implements columnDefs<string>{
    constructor(...columns: columnDefs[]) {
        if (false)
            console.log(columns);
    }
    inputLoader: inputLoader<string>;
    allowNull: boolean;
    dbReadOnly: boolean;
    isVirtual: boolean;
    key: string;
    caption: string;
    inputType: string;
    dbName: string;
    dbLoader: dbLoader<string>;
    jsonLoader: jsonLoader<string>;
    type: any;
    dbType?: string;

}