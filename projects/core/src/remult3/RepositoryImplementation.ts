
import { ColumnSettings } from "../column-interfaces";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { StringColumn } from "../columns/string-column";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { Column as oldColumn, __isGreaterThan, __isLessOrEqualTo } from '../column';
import { filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy, EntityBase } from "./remult3";
import { Context, IterateOptions as oldIterateOptions, SpecificEntityHelper } from "../context";
import * as old from '../data-interfaces';
import { AndFilter, Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { packWhere, unpackWhere } from "../filter/filter-consumer-bridge-to-url-builder";


export class RepositoryImplementation<T> implements Repository<T>{
    private _helper: SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<T>;
    constructor(private entity: NewEntity<T>, private context: Context) {
        this._info = createOldEntity(entity);

        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => this._info.createOldEntity());
    }

    iterate(options?: EntityWhere<T> | IterateOptions<T>): IteratableResult<T> {
        let r = this._helper.iterate(this.translateIterateOptions(options));
        return {
            count: () => r.count(),
            first: () => r.first().then(r => this.mapOldEntityToResult(r)),
            toArray: (o) => r.toArray(o).then(r => r.map(r => this.mapOldEntityToResult(r))),
            forEach: (what: (item: T) => Promise<any>) => r.forEach(async x => {
                await what(this.mapOldEntityToResult(x));
            }),
            [Symbol.asyncIterator]: () => {
                let i = r[Symbol.asyncIterator]();
                return {
                    next: () => {
                        let z = i.next();
                        return z.then(y => ({
                            value: this.mapOldEntityToResult(y.value),
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
        let r = this._helper.lookup(this.translateEntityWhere(filter));
        if (!r[pojoCacheInEntity]) {
            r[pojoCacheInEntity] = this.mapOldEntityToResult(r);
        }
        return r[pojoCacheInEntity];
    }
    async lookupAsync(filter: EntityWhere<T>): Promise<T> {
        let r = await this._helper.lookupAsync(this.translateEntityWhere(filter));
        if (!r[pojoCacheInEntity]) {
            r[pojoCacheInEntity] = this.mapOldEntityToResult(r);
        }
        return r[pojoCacheInEntity];
    }
    entityOf(entity: T): rowHelper<T> {
        let x = entity[entityMember];
        if (!x) {
            x = entity[entityMember] = this._info.createEntityOf(this._helper.create(), entity, this.context);
            if (entity instanceof EntityBase) {
                entity._ = x;
            }
        }
        return x;
    }

    async delete(entity: T): Promise<void> {
        await this.entityOf(entity).delete();
    }
    async save(entity: T): Promise<T> {
        return await this.entityOf(entity).save();
    }
    find(options?: FindOptions<T>): Promise<T[]> {
        let opt: old.FindOptions<any> = {};
        if (!options)
            options = {};

        opt = {};
        opt.where = this.translateEntityWhere(options.where);
        if (options.orderBy)
            opt.orderBy = this.translateEntityOrderBy(options.orderBy)

        return this._helper.find(opt).then(rows => rows.map(r =>
            this.mapOldEntityToResult(r)
        ));

    }
    private mapOldEntityToResult(r: oldEntity<any>) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        x[entityMember] = this._info.createEntityOf(r, x, this.context);
        x[entityMember].updateEntityBasedOnOldEntity();

        if (x instanceof EntityBase)
            x._ = x[entityMember];
        return x;
    }

    async count(where?: EntityWhere<T>): Promise<number> {
        return this._helper.count(this.translateEntityWhere(where));
    }
    async findFirst(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {

        return this._helper.findFirst(this.translateIterateOptions(options)).then(r => this.mapOldEntityToResult(r));
    }
    private translateIterateOptions(options: EntityWhere<T> | IterateOptions<T>) {
        let opt: oldIterateOptions<any> = {};
        if (!options)
            options = {};
        
        if (typeof options === "function") {
            opt.where = this.translateEntityWhere(options);
        } else {
            let o = options as IterateOptions<T>;
            opt.where = this.translateEntityWhere(o.where);
            if (o.orderBy)
                opt.orderBy = this.translateEntityOrderBy(o.orderBy)
            opt.progress = o.progress;
        }

        return opt;
    }

    create(): T {
        let r = new this.entity(this.context);
        this.entityOf(r);
        return r;
    }
    findId(id: any): Promise<T> {
        return this._helper.findId(id).then(r => this.mapOldEntityToResult(r));
    }
    private translateEntityWhere(where: EntityWhere<T>): (e: oldEntity<any>) => Filter {
        if (this._info.entityInfo.fixedWhereFilter1) {
            if (Array.isArray(where))
                where = [this._info.entityInfo.fixedWhereFilter1, ...where];
            else
                where = [this._info.entityInfo.fixedWhereFilter1, where];
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
    updateEntityBasedOnWhere(where: EntityWhere<T>, r: T) {
        let w = this.translateEntityWhere(where)(this._helper.create());

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
        return packWhere(this._helper.create(), this.translateEntityWhere(where));
    }
    unpackWhere(packed: any): Filter {
        return unpackWhere(this._helper.create(), packed);
    }
}



export const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");
const pojoCacheInEntity = Symbol("pojoCacheInEntity");
export const columnsOfType = new Map<any, columnInfo[]>();
export function createOldEntity<T>(entity: NewEntity<T>) {
    let r: columnInfo[] = columnsOfType.get(entity.prototype);
    if (!r)
        columnsOfType.set(entity.prototype, r = []);

    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);
    if (info.extends) {
        r.push(...columnsOfType.get(info.extends.prototype));
        info.extends = undefined;
    }

    return new EntityFullInfo<T>(r, info);
}
class EntityOfImpl<T> implements rowHelper<T>{
    constructor(private oldEntity: oldEntity, private info: EntityFullInfo<T>, private entity: T, private context: Context) {

    }
    async reload(): Promise<void> {
        let r = await this.oldEntity.reload();
        this.updateEntityBasedOnOldEntity();

    }
    toApiPojo() {
        this.updateOldEntityBasedOnEntity();

        let r = {};
        for (const c of this.oldEntity.columns) {

            c.__addToPojo(r, this.context)
        }
        return r;


    }
    updateEntityBasedOnOldEntity() {
        for (const col of this.info.columns) {
            this.entity[col.key] = this.oldEntity.columns.find(col.key).value;
        }
    }
    defs = { name: this.oldEntity.defs.name };
    private _columns: entityOf<T>;
    get columns(): entityOf<T> {
        if (!this._columns) {
            let r = {
                find: (c: column<any>) => r[c.key]
            };
            for (const c of this.info.columns) {
                r[c.key] = new columnBridge(this.oldEntity.columns.find(c.key), this.entity);
            }

            this._columns = r as unknown as entityOf<T>;
        }
        return this._columns;
    }
    async save() {
        this.updateOldEntityBasedOnEntity();
        let r = await this.oldEntity.save();
        return this.entity;

    }
    private updateOldEntityBasedOnEntity() {
        for (const col of this.info.columns) {
            this.oldEntity.columns.find(col.key).value = this.entity[col.key];
        }
    }

    delete() {
        return this.oldEntity.delete();
    }
    isNew() {
        return this.oldEntity.isNew();
    }
    wasChanged() {
        this.updateOldEntityBasedOnEntity();
        return this.oldEntity.wasChanged();
    }
}
export class columnBridge implements column<any>{
    constructor(private col: oldColumn, private item: any) {

    }
    get caption(): string { return this.col.defs.caption }
    get inputType(): string { return this.col.defs.inputType }
    get error(): string { return this.col.validationError }
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
    createEntityOf(e: oldEntity<any>, item: T, context: Context): entityOf<T> {
        return new EntityOfImpl<T>(e, this, item, context) as unknown as entityOf<T>;
    }


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
                c = new DateColumn(col.settings);
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



export function Column<T = any, colType = any>(settings?: ColumnSettings & {
    allowApiUpdate1?: ((x: entityOf<T>) => boolean),
    validate1?: (x: column<any>) => void,
    defaultValue1?: (x: T) => void,
    serverExpression1?: (x: T) => colType | Promise<colType>,
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

        let type = Reflect.getMetadata("design:type", target, key);
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
export function Entity<T>(options: EntityOptions & {
    allowApiCRUD1?: (context: Context, entity: T) => boolean,
    allowApiUpdate1?: (context: Context, entity: T) => boolean,
    allowApiDelete1?: (context: Context, entity: T) => boolean,
    saving1?: (entity: T, context: Context) => Promise<any>,
    validating1?: (entity: T) => Promise<any>,
    defaultOrderBy1?: (entity: sortOf<T>) => TheSort[] | TheSort,
    apiDataFilter1?: EntityWhere<T>,

    id?: (entity: idOf<T>) => IdDefs[],

}) {
    return target => {

        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}
