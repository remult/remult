
import { ColumnSettings } from "../column-interfaces";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { StringColumn } from "../columns/string-column";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { Column as oldColumn, __isGreaterThan } from '../column';
import { filterOptions, column, entityOf, EntityWhere, filterOf, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort, comparableFilterItem, rowHelper } from "./remult3";
import { Context } from "../context";
import { EntityWhereItem as oldEntityWhereItem } from '../data-interfaces';
import { AndFilter, Filter } from "../filter/filter-interfaces";


export class RepositoryImplementation<T> implements Repository<T>{
    private _helper: import("c:/repos/radweb/projects/core/src/context").SpecificEntityHelper<any, oldEntity<any>>;
    private _info: EntityFullInfo<any>;
    constructor(private entity: NewEntity<T>, private context: Context) {
        this._info = createOldEntity(entity);

        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => this._info.createOldEntity());
    }
    entityOf<T>(entity: T) {
        let x = entity[entityMember];
        if (!x) {
            x = entity[entityMember] = this._info.createEntityOf(this._helper.create(), entity);
        }
        return x;
    }

    delete(entity: T): Promise<T> {
        throw new Error("Method not implemented.");
    }
    async save(entity: T): Promise<T> {
        let e = await this._helper.create();
        for (const col of this._info.columns) {
            e.columns.find(col.key).value = entity[col.key];
        }
        await e.save();
        return entity;

    }
    find(options?: FindOptions<T>): Promise<T[]> {
        throw new Error("Method not implemented.");
    }
    async count(where?: EntityWhere<T>): Promise<number> {


        return this._helper.count(translateEntityWhere(this._info, where));
    }
    findFirst(where: EntityWhere<T>): Promise<T> {
        throw new Error("Method not implemented.");
    }
    create(): T {
        let r = new this.entity();
        r[entityMember] = this._info.createEntityOf(this._helper.create(), r);
        return r;
    }
    findId(id: any): Promise<T> {
        throw new Error("Method not implemented.");
    }//
}
export function translateEntityWhere<entityType>(info: EntityFullInfo<entityType>, where: EntityWhere<entityType>): oldEntityWhereItem<any> {
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

const columnInfo = Symbol("columnInfo");
const entityInfo = Symbol("entityInfo");
const entityMember = Symbol("entityMember");
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
export function getEntityOf<T>(item: T):entityOf<T> {
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



export function Column<T = any>(settings?: ColumnSettings & {
    allowApiUpdate1?: ((x: entityOf<T>) => boolean),
    validate1?: (x: column<any>) => void,
    defaultValue1?: (x: T) => void,
    serverExpression1?: (x: T) => any
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