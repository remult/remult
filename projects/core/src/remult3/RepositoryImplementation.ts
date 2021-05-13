
import { columnDefs, ColumnSettings, dbLoader, jsonLoader } from "../column-interfaces";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { BoolColumn, Column as oldColumn, columnBridgeToDefs, ColumnDefs, CompoundIdColumn, DateTimeColumn, makeTitle, NumberColumn, StringColumn, __isGreaterOrEqualTo, __isGreaterThan, __isLessOrEqualTo, __isLessThan } from '../column';
import { EntityDefs, filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy, EntityBase, columnDefsOf, supportsContains } from "./remult3";
import { allEntities, Context, IterateOptions as oldIterateOptions, SpecificEntityHelper } from "../context";
import * as old from '../data-interfaces';
import { AndFilter, Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { extractWhere, FilterSerializer, packToRawWhere } from "../filter/filter-consumer-bridge-to-url-builder";
import { Lookup } from "../lookup";
import { DataApiSettings } from "../data-api";

import { RowEvents } from "../__EntityValueProvider";
import { ObjectColumn } from "../columns/object-column";
import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, ErrorInfo } from "../data-interfaces";


export class RepositoryImplementation<T> implements Repository<T>{
    _helper: SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<T>;
    private _lookup = new Lookup(this);
    private __edp: EntityDataProvider;
    private get edp() {
        return this.__edp ? this.__edp : this.__edp = this.dataProvider.getEntityDataProvider(this.defs);
    }
    constructor(private entity: NewEntity<T>, private context: Context, private dataProvider: DataProvider) {
        this._info = createOldEntity(entity);

        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => this._info.createOldEntity());
    }
    get defs(): EntityDefs { return this._info };

    _getApiSettings(): DataApiSettings<T> {
        return this._helper.create()._getEntityApiSettings(this.context);
    }

    isIdColumn(col: columnDefs<any>): boolean {
        let old = this._helper.create();
        return old.columns.idColumn.defs.key == col.key;
    }
    getIdFilter(id: any): Filter {
        return this._helper.create().columns.idColumn.isEqualTo(id);
    }


    iterate(options?: EntityWhere<T> | IterateOptions<T>): IteratableResult<T> {
        let r = this._helper.iterate(this.translateIterateOptions(options));
        return {
            count: () => r.count(),
            first: () => r.first().then(async r => await this.mapOldEntityToResult(r)),
            toArray: (o) => r.toArray(o).then(r => Promise.all(r.map(r => this.mapOldEntityToResult(r)))),
            forEach: (what: (item: T) => Promise<any>) => r.forEach(async x => {
                await what(await this.mapOldEntityToResult(x));
            }),
            [Symbol.asyncIterator]: () => {
                let i = r[Symbol.asyncIterator]();
                return {
                    next: () => {
                        let z = i.next();
                        return z.then(async y => ({
                            value: await this.mapOldEntityToResult(y.value),
                            done: y.done
                        }))
                    }
                }
            }
        };

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
    private async mapOldEntityToResult(r: oldEntity<any>) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        let helper = new EntityOfImpl(r, this._info, x, this.context, this, this._helper)
        x[entityMember] = helper;
        await helper.updateEntityBasedOnOldEntity();
        if (x instanceof EntityBase)
            x._ = x[entityMember];
        return x;
    }
    private async mapRawDataToResult(r: any) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        let helper = new rowHelperImplementation(this._info, x, this, this.edp, this.context, false);
        helper.loadDataFrom(r);

        x[entityMember] = helper;
        if (x instanceof EntityBase)
            x._ = x[entityMember];
        return x;
    }

    async count(where?: EntityWhere<T>): Promise<number> {
        return this._helper.count(this.bridgeEntityWhereToOldEntity(where));
    }
    async findFirst(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {

        return this._helper.findFirst(this.translateIterateOptions(options)).then(r => this.mapOldEntityToResult(r));
    }
    private translateIterateOptions(options: EntityWhere<T> | IterateOptions<T>) {
        let opt: oldIterateOptions<any> = {};
        if (!options)
            options = {};

        if (typeof options === "function") {
            opt.where = this.bridgeEntityWhereToOldEntity(options);
        } else {
            let o = options as IterateOptions<T>;
            opt.where = this.bridgeEntityWhereToOldEntity(o.where);
            if (!o.orderBy) {
                o.orderBy = this._info.entityInfo.defaultOrderBy;
            }
            if (o.orderBy)
                opt.orderBy = this.translateEntityOrderBy(o.orderBy)
            opt.progress = o.progress;
        }

        return opt;
    }

    create(): T {
        let r = new this.entity(this.context);
        let z = this.getRowHelper(r);

        return r;
    }
    findId(id: any): Promise<T> {
        return this._helper.findId(id).then(r => this.mapOldEntityToResult(r));
    }
    bridgeEntityWhereToOldEntity(where: EntityWhere<T>): (e: oldEntity<any>) => Filter {
        if (this._info.entityInfo.fixedWhereFilter) {
            if (Array.isArray(where))
                where = [this._info.entityInfo.fixedWhereFilter, ...where];
            else
                where = [this._info.entityInfo.fixedWhereFilter, where];
        }
        if (!where)
            return undefined;
        else {

            return (e: oldEntity<any>): Filter => {
                let entity = this._info.createFilterOf();
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
        }
    }
    createIdInFilter(items: T[]): Filter {
        let idColumn = this._helper.create().columns.idColumn;
        return idColumn.isIn(items.map(i => this.getRowHelper(i).columns[idColumn.defs.key].value));
    }
    translateOrderByToSort(orderBy: EntityOrderBy<T>): Sort {
        if (!orderBy)
            return undefined;
        let entity = this._info.createSortOf();
        let r = orderBy(entity);//
        if (Array.isArray(r))
            return new Sort(...r.map(r => r.__toSegment()));
        else
            return new Sort(r.__toSegment());

    }
    private translateEntityOrderBy(orderBy: EntityOrderBy<T>): (e: oldEntity) => SortSegment[] {
        if (!orderBy)
            return undefined;
        else
            return (e: oldEntity<any>) => {
                let entity = this._info.createSortOf();
                let r = orderBy(entity);//
                if (Array.isArray(r))
                    return r.map(r => r.__toSegment());
                else
                    return [r.__toSegment()];
            }
    }
    translateWhereToFilter(where: EntityWhere<T>): Filter {
        let entity = this._info.createFilterOf();
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

export class myEntityDefs<T> implements EntityDefs<T>{

    constructor(private entity: oldEntity) {

    }
    dbAutoIncrementId = this.entity.__options.dbAutoIncrementId;;
    get idColumn(): columnDefs<any> { return new columnBridgeToDefs(this.entity.columns.idColumn); };
    get name(): string {
        return this.entity.defs.name;
    }
    get dbName(): string {
        return this.entity.defs.dbName;
    }
    private _columns: columnDefsOf<T>;
    get columns(): columnDefsOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any, T>) => r[c.key],
                _items: []
            };
            for (const c of this.entity.columns) {
                r._items.push(r[c.defs.key] = new columnBridgeToDefs(c));
            }

            this._columns = r as unknown as entityOf<T>;
        }
        return this._columns;
    }
    get caption() {
        return this.entity.defs.caption;
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
        throw new Error("not yet implemented");

    }

    wasDeleted(): boolean {
        return this._wasDeleted;
    }
    isValid(): boolean {
        return !!!this.validationError && this.errors == undefined;

    }
    undoChanges() {
        throw new Error("not yet implemented");
    }
    async reload(): Promise<void> {
        throw new Error("not yet implemented");
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
    async updateEntityBasedOnOldEntity() {
        throw new Error("not yet implemented");


    }



    justUpdateEntityBasedOnOldEntity() {
        throw new Error("not yet implemented");
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
            this.loadDataFrom(updatedRow);
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
            this.catchSaveErrors(err);
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
    private saveOriginalData() {
        this.originalValues = this.copyDataToObject();
    }



    async delete() {
        this.__clearErrors();
        if (this.info.entityInfo.deleting)
            await this.info.entityInfo.deleting(this.entity);
        this.__assertValidity();


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
    loadDataFrom(data: any) {
        for (const col of this.info.columns._items) {
            this.entity[col.key] = data[col.key];
        }
        if (this.repository.defs.idColumn instanceof CompoundIdColumn) {
            data.columns.idColumn.__addIdToPojo(data);
        }
        this.id = data[this.repository.defs.idColumn.key];
    }
    private id;

    isNew(): boolean {
        return this._isNew;
    }
    wasChanged(): boolean {
        throw new Error("not yet implemented");
    }
}
class columnImpl<T> implements column<any, T> {
    constructor(private settings: ColumnSettings, private defs: columnDefs, private entity: any, private helper: rowHelperImplementation<T>) {

    }
    inputType: string = this.settings.inputType;;
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
    originalValue: any;
    inputValue: string;
    wasChanged(): boolean {
        return this.originalValue != this.value;
    }
    rowHelper: rowHelper<any> = this.helper;
    dbReadOnly: boolean = this.defs.dbReadOnly;
    isVirtual: boolean = this.defs.isVirtual;
    key: string = this.defs.key;
    caption: string = this.defs.caption;
    dbName: string = this.defs.dbName;
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
class EntityOfImpl<T> implements rowHelper<T>{
    constructor(private oldEntity: oldEntity, private info: EntityFullInfo<T>, private entity: T, private context: Context, public repository: Repository<T>, private helper: SpecificEntityHelper<any, oldEntity<any>>) {

    }
    get validationError() {
        return this.oldEntity.validationError;
    }
    set validationError(val: string) {
        this.oldEntity.validationError = val;
    }

    register(listener: RowEvents) {
        this.oldEntity.__entityData.register(listener);
    }
    _updateEntityBasedOnApi(body: any) {
        this.helper._updateEntityBasedOnApi(this.oldEntity, body);
        this.updateEntityBasedOnOldEntity();
    }

    wasDeleted(): boolean {
        return this.oldEntity.__entityData._deleted;
    }
    isValid(): boolean {
        return this.oldEntity.isValid();

    }
    undoChanges() {
        this.oldEntity.undoChanges();
        this.updateOldEntityBasedOnEntity();
    }
    async reload(): Promise<void> {
        let r = await this.oldEntity.reload();
        await this.updateEntityBasedOnOldEntity();

    }
    toApiPojo() {
        this.updateOldEntityBasedOnEntity();

        let r = {};
        for (const c of this.oldEntity.columns) {

            c.__addToPojo(r, this.context)
        }
        return r;


    }
    async updateEntityBasedOnOldEntity() {
        this.justUpdateEntityBasedOnOldEntity();
        await this.oldEntity.__entityData.initServerExpressions(this.entity);
        this.justUpdateEntityBasedOnOldEntity();


    }

    private _columns: entityOf<T>;
    justUpdateEntityBasedOnOldEntity() {
        for (const col of this.info.columns._items) {
            this.entity[col.key] = this.oldEntity.columns.find(col.key).value;
        }
    }

    get columns(): entityOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any, T>) => r[c.key],
                _items: []
            };
            for (const c of this.info.columns._items) {
                r._items.push(r[c.key] = new columnBridge(this.oldEntity.columns.find(c.key), this.entity, this));
            }

            this._columns = r as unknown as entityOf<T>;
        }
        return this._columns;
    }
    async save(afterValidationBeforeSaving?: (row: T) => Promise<any> | any) {
        this.updateOldEntityBasedOnEntity();
        await this.oldEntity.save(!afterValidationBeforeSaving ? undefined : async x => {
            afterValidationBeforeSaving(this.entity)
        }, async (c, validate) => {
            validate(this.columns[c.defs.key], this.entity);
        }, this.entity);
        await this.updateEntityBasedOnOldEntity();
        return this.entity;

    }
    private updateOldEntityBasedOnEntity() {
        for (const col of this.info.columns._items) {
            this.oldEntity.columns.find(col.key).value = this.entity[col.key];
        }
    }

    delete() {
        return this.oldEntity.delete(this.entity);
    }
    isNew() {
        return this.oldEntity.isNew();
    }
    wasChanged() {
        this.updateOldEntityBasedOnEntity();
        return this.oldEntity.wasChanged();
    }
}
export class columnBridge<T, ET> implements column<T, ET>{
    constructor(private col: oldColumn, private item: any, public rowHelper: rowHelper<ET>) {

    }
    type: any;
    dbType?: string;
    get dbReadOnly(): boolean { return this.col.defs.dbReadOnly };
    get isVirtual(): boolean { return this.col.defs.__isVirtual() };
    jsonLoader: jsonLoader<any> = { fromJson: x => this.col.fromRawValue(x), toJson: x => this.col.toRawValue(x) };
    dbLoader: dbLoader<any> = this.col.__getStorage();
    get dbName(): string {
        return this.col.defs.dbName;
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


class EntityFullInfo<T> implements EntityDefs<T> {



    constructor(public columnsInfo: columnInfo[], public entityInfo: EntityOptions) {


        let r = {
            find: (c: column<any, T>) => r[c.key],
            _items: []
        };

        for (const x of columnsInfo) {
            r._items.push(r[x.key] = {
                caption: x.settings.caption,
                dbLoader: x.settings.dbLoader,
                dbName: x.settings.dbName,
                inputType: x.settings.inputType,
                jsonLoader: x.settings.jsonLoader,
                key: x.settings.key,
                dbReadOnly: x.settings.dbReadOnly,
                isVirtual: !!x.settings.serverExpression,
                type: x.settings.type,
                dbType: x.settings.dbType
            });
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
    createOldEntity() {
        let x = new oldEntity(this.entityInfo);

        let firstCol: oldColumn;
        for (const col of this.columnsInfo) {
            let c: oldColumn;
            if (col.type == String)
                c = new StringColumn(col.settings);
            else if (col.type == Boolean)
                c = new BoolColumn(col.settings);
            else if (col.type == Number)
                c = new NumberColumn(col.settings);
            else if (col.type == Date)
                c = new DateTimeColumn(col.settings);
            else
                c = new oldColumn(col.settings);
            x.__applyColumn(c);
            if (firstCol)
                firstCol = c;
        }
        if (!x.__idColumn) {
            x.__idColumn = firstCol;
        }
        return x;
    }
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



export function Column<T = any, colType = any>(settings?: ColumnSettings<colType, T> & {
    allowApiUpdate1?: ((x: entityOf<T>) => boolean),
}) {
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
export function Entity<T>(options: EntityOptions<T> & {
    allowApiCRUD1?: (context: Context, entity: T) => boolean,
    allowApiUpdate1?: (context: Context, entity: T) => boolean,
    allowApiDelete1?: (context: Context, entity: T) => boolean,
    saving1?: (entity: T, context: Context) => Promise<any>,
    validating1?: (entity: T) => Promise<any>,

    apiDataFilter1?: EntityWhere<T>,



}) {
    if (!options.dbName)
        options.dbName = options.name;
    return target => {
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