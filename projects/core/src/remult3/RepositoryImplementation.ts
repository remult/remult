
import { ColumnSettings } from "../column-interfaces";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { StringColumn } from "../columns/string-column";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { Column as oldColumn, __isGreaterThan } from '../column';
import { filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper, IterateOptions, IteratableResult, EntityOrderBy } from "./remult3";
import { Context, IterateOptions as oldIterateOptions, SpecificEntityHelper } from "../context";
import * as old from '../data-interfaces';
import { AndFilter, Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";


export class RepositoryImplementation<T> implements Repository<T>{
    private _helper: SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<any>;
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
        let r = this._helper.lookup(translateEntityWhere(this._info, filter));
        if (!r[pojoCacheInEntity]) {
            r[pojoCacheInEntity] = this.mapOldEntityToResult(r);
        }
        return r[pojoCacheInEntity];
    }
    async lookupAsync(filter: EntityWhere<T>): Promise<T> {
        let r = await this._helper.lookupAsync(translateEntityWhere(this._info, filter));
        if (!r[pojoCacheInEntity]) {
            r[pojoCacheInEntity] = this.mapOldEntityToResult(r);
        }
        return r[pojoCacheInEntity];
    }
    entityOf<T>(entity: T) {
        let x = entity[entityMember];
        if (!x) {
            x = entity[entityMember] = this._info.createEntityOf(this._helper.create(), entity);
        }
        return x;
    }

    async delete(entity: T): Promise<T> {
        return await this.entityOf(entity).Delete();
    }
    async save(entity: T): Promise<T> {
        return await this.entityOf(entity).save();
    }
    find(options?: FindOptions<T>): Promise<T[]> {
        let opt: old.FindOptions<any>;
        if (options) {
            opt = {};
            if (options.where)
                opt.where = translateEntityWhere(this._info, options.where);
            if (options.orderBy)
                opt.orderBy = translateEntityOrderBy(this._info, options.orderBy)
        }
        return this._helper.find(opt).then(rows => rows.map(r =>
            this.mapOldEntityToResult(r)
        ));

    }
    private mapOldEntityToResult(r: oldEntity<any>) {
        if (!r)
            return undefined;
        let x = new this.entity(this.context);
        x[entityMember] = this._info.createEntityOf(r, x);
        for (const col of this._info.columns) {
            x[col.key] = r.columns.find(col.key).value;
        }
        return x;
    }

    async count(where?: EntityWhere<T>): Promise<number> {
        return this._helper.count(translateEntityWhere(this._info, where));
    }
    async findFirst(options?: EntityWhere<T> | IterateOptions<T>): Promise<T> {

        return this._helper.findFirst(this.translateIterateOptions(options)).then(r => this.mapOldEntityToResult(r));
    }
    private translateIterateOptions(options: EntityWhere<T> | IterateOptions<T>) {
        let opt: oldIterateOptions<any>;
        if (options) {
            opt = {};
            if (typeof options === "function") {
                opt.where = translateEntityWhere(this._info, options);
            } else {
                let o = options as IterateOptions<T>;
                if (o.where) {
                    opt.where = translateEntityWhere(this._info, o.where);
                }
                if (o.orderBy)
                    opt.orderBy = translateEntityOrderBy(this._info, o.orderBy)
                opt.progress = o.progress;
            }
        }
        return opt;
    }

    create(): T {
        let r = new this.entity(this.context);
        r[entityMember] = this._info.createEntityOf(this._helper.create(), r);
        return r;
    }
    findId(id: any): Promise<T> {
        return this._helper.findId(id).then(r => this.mapOldEntityToResult(r));
    }
}
function translateEntityWhere<entityType>(info: EntityFullInfo<entityType>, where: EntityWhere<entityType>): old.EntityWhereItem<oldEntity<any>> {
    if (!where)
        return undefined;
    else
        return (e: oldEntity<any>) => {
            let entity = info.createFilterOf(e);
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
function translateEntityOrderBy<entityType>(info: EntityFullInfo<entityType>, orderBy: EntityOrderBy<entityType>): old.EntityOrderBy<oldEntity<any>> {
    if (!orderBy)
        return undefined;
    else
        return (e: oldEntity<any>) => {
            let entity = info.createSortOf(e);
            let r = orderBy(entity);//
            if (Array.isArray(r))
                return r.map(r => r.__toSegment());
            else
                return [r.__toSegment()];
        }
}

const columnInfo = Symbol("columnInfo");
const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");
const pojoCacheInEntity = Symbol("pojoCacheInEntity");
export function createOldEntity(entity: NewEntity<any>) {
    let r: columnInfo[] = Reflect.getMetadata(columnInfo, entity);

    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);

    return new EntityFullInfo(r, info);
}
class EntityOfImpl<T> implements rowHelper<T>{
    constructor(private oldEntity: oldEntity, private info: EntityFullInfo<T>, private entity: T) {

    }
    async save() {
        this.updateOldEntityBasedOnEntity();
        await this.oldEntity.save();

    }
    private updateOldEntityBasedOnEntity() {
        for (const col of this.info.columns) {
            this.oldEntity.columns.find(col.key).value = this.entity[col.key];
        }
    }

    delete() {
        this.oldEntity.delete();
    }
    isNew() {
        return this.oldEntity.isNew();
    }
    wasChanged() {
        this.updateOldEntityBasedOnEntity();
        return this.oldEntity.wasChanged();
    }
}
export function getEntityOf<T>(item: T): entityOf<T> {
    let x = item[entityMember];
    if (!x)
        throw new Error("item " + item + " was not initialized using a context");
    return x;

}

class EntityFullInfo<T> {
    createEntityOf(e: oldEntity<any>, item: T): entityOf<T> {
        return new EntityOfImpl<T>(e, this, item) as unknown as entityOf<T>;
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
        let names: columnInfo[] = Reflect.getMetadata(columnInfo, target.constructor);
        if (!names) {
            names = [];
            Reflect.defineMetadata(columnInfo, names, target.constructor);
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
    id?: (entity: idOf<T>) => IdDefs[]
}) {
    return target => {

        Reflect.defineMetadata(entityInfo, options, target);
        return target;
    }
}
