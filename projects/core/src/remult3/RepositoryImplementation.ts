
import { ColumnSettings } from "../column-interfaces";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { StringColumn } from "../columns/string-column";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { Column as oldColumn, __isGreaterOrEqualTo, __isGreaterThan, __isLessOrEqualTo, __isLessThan } from '../column';
import { filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy, EntityBase } from "./remult3";
import { Context, IterateOptions as oldIterateOptions, SpecificEntityHelper } from "../context";
import * as old from '../data-interfaces';
import { AndFilter, Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { extractWhere, packWhere, unpackWhere } from "../filter/filter-consumer-bridge-to-url-builder";
import { Lookup } from "../lookup";
import { DataApiSettings } from "../data-api";
import { DateTimeColumn } from "../columns/datetime-column";


export class RepositoryImplementation<T> implements Repository<T>{
    private _helper: SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<T>;
    private _lookup = new Lookup(this);
    constructor(private entity: NewEntity<T>, private context: Context) {
        this._info = createOldEntity(entity);

        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => this._info.createOldEntity());
    }
    defs = {
        getName: () => this._helper.create().defs.name,
        getDbName: () => this._helper.create().defs.dbName
    };

    _getApiSettings(): DataApiSettings<T> {
        return this._helper.create()._getEntityApiSettings(this.context);
    }

    isIdColumn(col: oldColumn<any>): boolean {
        let old = this._helper.create();
        return old.columns.find(col) == col;
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
    findOrCreate(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {
        return this._helper.findOrCreate(this.translateIterateOptions(options)).then(r => this.mapOldEntityToResult(r))
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
    private translateEntityOrderBy(orderBy: EntityOrderBy<T>): old.EntityOrderBy<oldEntity<any>> {
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
                    r[col.defs.key] = val;
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
        return packWhere(this._helper.create(), this.bridgeEntityWhereToOldEntity(where));
    }
    unpackWhere(packed: any): Filter {
        return this.extractWhere({ get: (key: string) => packed[key] });

    }
    extractWhere(filterInfo: { get: (key: string) => any; }): Filter {
        return extractWhere(this._helper.create(), filterInfo);
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
    if (info.extends) {

        r.unshift(...columnsOfType.get(info.extends.prototype).filter(x => !r.find(y => y.key == x.key)));
        info.extends = undefined;
    }

    return new EntityFullInfo<T>(r, info);
}
class EntityOfImpl<T> implements rowHelper<T>{
    constructor(private oldEntity: oldEntity, private info: EntityFullInfo<T>, private entity: T, private context: Context, public repository: Repository<T>, private helper: SpecificEntityHelper<any, oldEntity<any>>) {

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
    defs = { name: this.oldEntity.defs.name };
    private _columns: entityOf<T>;
    justUpdateEntityBasedOnOldEntity() {
        for (const col of this.info.columns) {
            this.entity[col.key] = this.oldEntity.columns.find(col.key).value;
        }
    }

    get columns(): entityOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any, T>) => r[c.key]
            };
            for (const c of this.info.columns) {
                r[c.key] = new columnBridge(this.oldEntity.columns.find(c.key), this.entity, this);
            }

            this._columns = r as unknown as entityOf<T>;
        }
        return this._columns;
    }
    async save() {
        this.updateOldEntityBasedOnEntity();
        await this.oldEntity.save(undefined, async (c, validate) => {
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
    get dbName(): string {
        return this.col.defs.dbName;
    }

    get caption(): string { return this.col.defs.caption }
    get inputType(): string { return this.col.defs.inputType }
    get error(): string { return this.col.validationError }
    set error(val: string) { this.col.validationError = val; }
    get displayValue(): string { return this.col.displayValue };
    get inputValue(): string { return this.col.inputValue };
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


    constructor(public columns: columnInfo[], public entityInfo: EntityOptions) {

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
        for (const c of this.columns) {
            r[c.key] = new filterHelper(e.columns.find(c.key));
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
            column: this.col,
            descending: this._descending
        }
    }


}
class filterHelper implements filterOptions<any>, comparableFilterItem<any>  {
    constructor(private col: oldColumn) {

    }
    isLessThan(val: any): Filter {
        return __isLessThan(this.col, val);
    }
    isGreaterOrEqualTo(val: any): Filter {
        return __isGreaterOrEqualTo(this.col, val);
    }
    isNotIn(val: any[]): Filter {
        return this.col.isNotIn(...val);
    }
    isDifferentFrom(val: any) {
        return this.col.isDifferentFrom(val);
    }
    isLessOrEqualTo(val: any): Filter {
        return __isLessOrEqualTo(this.col, val);
    }
    isGreaterThan(val: any): Filter {
        return __isGreaterThan(this.col, val);
    }
    isEqualTo(val: any): Filter {
        return this.col.isEqualTo(val);
    }
    isIn(val: any[]): Filter {
        return this.col.isIn(...val);
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

        let names: columnInfo[] = columnsOfType.get(target);
        if (!names) {
            names = [];
            columnsOfType.set(target, names)
        }

        let type = settings.type;
        if (!type)
            type = Reflect.getMetadata("design:type", target, key);
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

        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}
