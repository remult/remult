
import { ColumnSettings } from "../column-interfaces";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { StringColumn } from "../columns/string-column";
import { Entity as oldEntity, EntityOptions } from "../entity";
import { Column as oldColumn } from '../column';
import { column, entityOf, EntityWhere, FindOptions, IdDefs, idOf, NewEntity, Repository, sortOf, TheSort } from "./remult3";
import { Context } from "../context";


export class RepositoryImplementation<T> implements Repository<T>{
    private _helper: import("c:/repos/radweb/projects/core/src/context").SpecificEntityHelper<any, oldEntity<any>>;
    constructor(private entity: NewEntity<T>, private context: Context) {
        //@ts-ignore
        this._helper = context.for_old<any, oldEntity>((...args: any[]) => createOldEntity(entity));
    }

    delete(entity: T): Promise<T> {
        throw new Error("Method not implemented.");
    }
    async save(entity: T): Promise<T> {
        let e = await this._helper.fromPojo(entity);
        await e.save();
        return entity;

    }
    find(options?: FindOptions<T>): Promise<T[]> {
        throw new Error("Method not implemented.");
    }
    async count(where?: EntityWhere<T>): Promise<number> {
        return this._helper.count();
    }
    findFirst(where: EntityWhere<T>): Promise<T> {
        throw new Error("Method not implemented.");
    }
    create(): T {
        return new this.entity();
    }
    findId(id: any): Promise<T> {
        throw new Error("Method not implemented.");
    }


}

const columnInfo = Symbol("columnInfo");
const entityInfo = Symbol("entityInfo");
export function createOldEntity(entity: NewEntity<any>) {
    let r: columnInfo[] = Reflect.getMetadata(columnInfo, entity);

    let info: EntityOptions = Reflect.getMetadata(entityInfo, entity);

    let x = new oldEntity(info);
    let firstCol: oldColumn;
    for (const col of r) {
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