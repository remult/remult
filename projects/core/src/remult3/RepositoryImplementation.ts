
import { columnDefs, ColumnSettings, dbLoader, jsonLoader } from "../column-interfaces";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { BoolColumn, Column as oldColumn, columnBridgeToDefs, DateTimeColumn, makeTitle, NumberColumn, StringColumn, __isGreaterOrEqualTo, __isGreaterThan, __isLessOrEqualTo, __isLessThan } from '../column';
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


export class RepositoryImplementation<T> implements Repository<T>{
    _helper: SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<T>;
    private _lookup = new Lookup(this);
    constructor(private entity: NewEntity<T>, private context: Context) {
        this._info = createOldEntity(entity);
        this.defs = new myEntityDefs(this._info.createOldEntity());
        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => this._info.createOldEntity());
    }
    defs: EntityDefs;

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
            x = entity[entityMember] = new EntityOfImpl(this._helper.create(), this._info, entity, this.context, this, this._helper);
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
    find(options?: FindOptions<T>): Promise<T[]> {
        let opt: old.FindOptions<any> = {};
        if (!options)
            options = {};

        opt = {};
        opt.where = this.bridgeEntityWhereToOldEntity(options.where);
        if (!options.orderBy) {
            options.orderBy = this._info.entityInfo.defaultOrderBy;
        }
        if (options.orderBy)
            opt.orderBy = this.translateEntityOrderBy(options.orderBy)
        opt.limit = options.limit;
        opt.page = options.page;

        return this._helper.find(opt).then(rows => Promise.all(rows.map(r =>
            this.mapOldEntityToResult(r)
        )));

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
        let z = this.getRowHelper(r) as EntityOfImpl<T>;
        z.justUpdateEntityBasedOnOldEntity();
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
                let entity = this._info.createFilterOf(e);
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
        let r = this.translateEntityOrderBy(orderBy)(this._helper.create());
        return new Sort(...r);
    }
    private translateEntityOrderBy(orderBy: EntityOrderBy<T>): (e: oldEntity) => SortSegment[] {
        if (!orderBy)
            return undefined;
        else
            return (e: oldEntity<any>) => {
                let entity = this._info.createSortOf(e);
                let r = orderBy(entity);//
                if (Array.isArray(r))
                    return r.map(r => r.__toSegment());
                else
                    return [r.__toSegment()];
            }
    }
    translateWhereToFilter(where: EntityWhere<T>): Filter {
        return this.bridgeEntityWhereToOldEntity(where)(this._helper.create());
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
        for (const col of this.info.columns) {
            this.entity[col.key] = this.oldEntity.columns.find(col.key).value;
        }
    }

    get columns(): entityOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any, T>) => r[c.key],
                _items: []
            };
            for (const c of this.info.columns) {
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
        for (const col of this.info.columns) {
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

class EntityFullInfo<T> {

    private defs: columnDefs<any>[];
    constructor(public columns: columnInfo[], public entityInfo: EntityOptions) {
        this.defs = columns.map(x => ({
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
        }));
    }
    createOldEntity() {
        let x = new oldEntity(this.entityInfo);

        let firstCol: oldColumn;
        for (const col of this.columns) {
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
    createFilterOf(e: oldEntity): filterOf<T> {
        let r = {};
        for (const c of this.defs) {
            r[c.key] = new filterHelper(c);
        }
        return r as filterOf<T>;
    }
    createSortOf(e: oldEntity): sortOf<T> {
        let r = {};
        for (const c of this.columns) {
            r[c.key] = new sortHelper(e.columns.find(c.key));
        }
        return r as sortOf<T>;
    }
}
class sortHelper implements TheSort {
    constructor(private col: oldColumn, private _descending = false) {

    }
    get descending(): TheSort {
        return new sortHelper(this.col, !this._descending);
    }
    __toSegment(): SortSegment {
        return {
            column: new columnBridgeToDefs(this.col),
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
        if (!type)
            type = Reflect.getMetadata("design:type", target, key);
        if (!settings.dbLoader) {
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
            } else
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

    id?: (entity: idOf<T>) => IdDefs[],

}) {
    return target => {
        allEntities.push(target);
        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}
