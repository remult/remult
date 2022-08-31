
import knex, { Knex } from 'knex';
import { customDatabaseFilterToken, Filter, FilterConsumer } from "../src/filter/filter-interfaces.js";
import { dbNameProvider, getDbNameProvider } from "../src/filter/filter-consumer-bridge-to-sql-request.js";
import { allEntities, Remult } from "../src/context.js";

import { isAutoIncrement, StringFieldOptions, Fields, EntityFilter, EntityMetadata } from "../src/remult3/index.js";
import { ValueConverters } from "../src/valueConverters.js";
import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions } from '../src/data-interfaces.js';
import { FieldMetadata } from '../src/column-interfaces.js';
import { CompoundIdField } from '../src/column.js';
import { Sort } from '../src/sort.js';

export class KnexDataProvider implements DataProvider {
    constructor(public knex: Knex) {

    }
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider {
        return new KnexEntityDataProvider(entity, this.knex);
    }
    async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
        let t = await this.knex.transaction();
        try {
            await action(new KnexDataProvider(t));
            await t.commit();
        }
        catch (err) {
            await t.rollback();
            throw err;
        }


    }
    static customFilter(build: CustomKnexFilterBuilderFunction): EntityFilter<any> {
        return {
            [customDatabaseFilterToken]: {
                buildKnex: build
            }
        }

    }
    supportsCustomFilter?: boolean;

}
export type CustomKnexFilterBuilderFunction = () => Promise<(builder: Knex.QueryBuilder) => void>

class KnexEntityDataProvider implements EntityDataProvider {
    constructor(private entity: EntityMetadata<any>, private knex: Knex) {

    }
    async count(where: Filter): Promise<number> {
        const e = await this.init();
        const br = new FilterConsumerBridgeToKnexRequest(e);
        where.__applyToConsumer(br);
        let r = await br.resolveWhere();
        const result = (
            await this.knex(e.entityName)
                .count().where(b => r.forEach(w => w(b))));
        var row = result[0];
        for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                const element = row[key];
                return +element;
            }
        }
    }
    async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
        const e = await this.init();
        let cols = [] as string[];
        let colKeys: FieldMetadata[] = [];
        for (const x of this.entity.fields) {
            if (x.isServerExpression) {

            }
            else {
                cols.push(e.nameOf(x));
                colKeys.push(x);
            }
        }
        let query = this.knex(e.entityName).select(cols);
        if (options?.where) {
            const br = new FilterConsumerBridgeToKnexRequest(e);
            options.where.__applyToConsumer(br);
            let r = await br.resolveWhere();
            query.where(b => r.forEach(y => y(b)));

        }
        if (!options.orderBy) {
            options.orderBy = Sort.createUniqueSort(this.entity, new Sort());
        }
        if (options.orderBy) {

            query = query.orderBy(options.orderBy.Segments.map(s => ({
                column: e.nameOf(s.field),
                order: s.isDescending ? "desc" : "asc"
            })));
        }
        if (options.limit) {
            query = query.limit(options.limit);
            if (options.page)
                query = query.offset((options.page - 1) * options.limit);
        }
        const r = await query;

        return r.map(y => {
            let result: any = {};

            let i = 0;
            for (let m in y) {
                let field = colKeys[i++];
                try {
                    result[field.key] = field.valueConverter.fromDb(y[m]);

                }
                catch (err) {
                    throw new Error("Failed to load from db:" + field.key + "\r\n" + err);
                }
            }

            return result;
        });



    }
    async init() {
        return await getDbNameProvider(this.entity);
    }
    async update(id: any, data: any): Promise<any> {
        const e = await this.init();
        let f = new FilterConsumerBridgeToKnexRequest(e);
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);

        let resultFilter = this.entity.idMetadata.getIdFilter(id);
        if (data.id != undefined)
            resultFilter = this.entity.idMetadata.getIdFilter(data.id);


        let updateObject = {};
        for (const x of this.entity.fields) {

            if (e.isDbReadonly(x)) { }

            else if (data[x.key] !== undefined) {
                let v = x.valueConverter.toDb(data[x.key]);
                if (v !== undefined) {
                    let key = await e.nameOf(x);
                    updateObject[key] = v;
                }
            }
        }


        let where = await f.resolveWhere();
        await this.knex(e.entityName).update(updateObject).where(b => where.forEach(w => w(b)));
        return this.find({ where: Filter.fromEntityFilter(this.entity, resultFilter) }).then(y => y[0]);
    }
    async delete(id: any): Promise<void> {
        const e = await this.init();
        let f = new FilterConsumerBridgeToKnexRequest(e);
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);
        let where = await f.resolveWhere();
        await this.knex(e.entityName).delete().where(b => where.forEach(w => w(b)));

    }
    async insert(data: any): Promise<any> {
        const e = await this.init();
        let resultFilter: Filter;
        if (this.entity.idMetadata.field instanceof CompoundIdField)
            resultFilter = this.entity.idMetadata.field.resultIdFilter(undefined, data);
        else
            resultFilter = Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(data[this.entity.idMetadata.field.key]));
        let insertObject = {};
        for (const x of this.entity.fields) {

            if (e.isDbReadonly(x)) { }

            else {
                let v = x.valueConverter.toDb(data[x.key]);
                if (v != undefined) {
                    let key = await e.nameOf(x);
                    insertObject[key] = v;
                }
            }
        }

        let insert = this.knex(e.entityName).insert(insertObject);
        if (isAutoIncrement(this.entity.idMetadata.field)) {
            let result = await insert.returning(this.entity.idMetadata.field.key);
            let newId = result[0].id;

            resultFilter = new Filter(x => x.isEqualTo(this.entity.idMetadata.field, newId));
        }
        else await insert;
        return this.find({ where: resultFilter }).then(y => {
            return y[0];
        });
    }

}
export class FilterConsumerBridgeToKnexRequest implements FilterConsumer {

    _addWhere = true;
    promises: Promise<void>[] = [];
    result = [] as ((builder: Knex.QueryBuilder) => void)[];
    async resolveWhere() {
        while (this.promises.length > 0) {
            let p = this.promises;
            this.promises = [];
            for (const pr of p) {
                await pr;

            }
        }
        return this.result;
    }

    constructor(private nameProvider: dbNameProvider) { }

    custom(key: string, customItem: any): void {
        throw new Error("Custom filter should be translated before it gets here");
    }

    or(orElements: Filter[]) {
        this.promises.push((async () => {
            const result = [] as ((builder: Knex.QueryBuilder) => void)[];
            for (const element of orElements) {

                let f = new FilterConsumerBridgeToKnexRequest(this.nameProvider);
                f._addWhere = false;
                element.__applyToConsumer(f);
                let where = await f.resolveWhere();
                if (where.length > 0) {
                    result.push(b => {
                        b.orWhere(b => {
                            where.forEach(x => x(b));
                        });
                    })
                }
                else
                    return;//empty or means all rows
            }
            if (result.length > 0) {
                this.result.push(b => b.where(x => result.find(y => y(x))));
            }
        })());
    }
    isNull(col: FieldMetadata): void {
        this.result.push(b => b.whereNull(this.nameProvider.nameOf(col)));
    }
    isNotNull(col: FieldMetadata): void {
        this.result.push(b => b.whereNotNull(this.nameProvider.nameOf(col)));
    }
    isIn(col: FieldMetadata, val: any[]): void {
        this.result.push(knex =>
            knex.whereIn(this.nameProvider.nameOf(col), val.map(x => col.valueConverter.toDb(x))))
    }
    isEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, "=");
    }
    isDifferentFrom(col: FieldMetadata, val: any): void {
        this.add(col, val, "<>");
    }
    isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, ">=");
    }
    isGreaterThan(col: FieldMetadata, val: any): void {
        this.add(col, val, ">");
    }
    isLessOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, "<=");
    }
    isLessThan(col: FieldMetadata, val: any): void {
        this.add(col, val, "<");
    }
    public containsCaseInsensitive(col: FieldMetadata, val: any): void {


        this.result.push(b => b.whereRaw(
            'lower (' + this.nameProvider.nameOf(col) + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')"));
        this.promises.push((async () => {

        })());
    }

    private add(col: FieldMetadata, val: any, operator: string) {

        this.result.push(b => b.where(this.nameProvider.nameOf(col), operator, col.valueConverter.toDb(val)))



    }



    databaseCustom(databaseCustom: {
        buildKnex: CustomKnexFilterBuilderFunction
    }): void {
        this.promises.push((async () => {
            if (databaseCustom?.buildKnex) {
                this.result.push(await databaseCustom.buildKnex());
            }
        })());
    }
}


export class KnexSchemaBuilder {
    async verifyStructureOfAllEntities(remult: Remult) {
        console.log("start verify structure");
        for (const entity of allEntities) {
            let metadata = remult.repo(entity).metadata;

            try {
                if (!metadata.options.sqlExpression) {
                    if ((await metadata.getDbName()).toLowerCase().indexOf('from ') < 0) {
                        await this.createIfNotExist(metadata);
                        await this.verifyAllColumns(metadata);
                    }
                }
            }
            catch (err) {
                console.log("failed verify structure of " + await metadata.getDbName() + " ", err);
            }
        }
    }
    async createIfNotExist(entity: EntityMetadata): Promise<void> {
        const e = await getDbNameProvider(entity);
        if (! await this.knex.schema.hasTable(e.entityName)) {
            let cols = new Map<FieldMetadata, { name: string, readonly: boolean }>();
            for (const f of entity.fields) {
                cols.set(f, {
                    name: e.nameOf(f),
                    readonly: e.isDbReadonly(f)
                });
            }
            await logSql(this.knex.schema.createTable(e.entityName,
                b => {
                    for (const x of entity.fields) {
                        if (!cols.get(x).readonly || isAutoIncrement(x)) {


                            if (isAutoIncrement(x))
                                b.increments(cols.get(x).name);
                            else {
                                buildColumn(x, cols.get(x).name, b);
                                if (x == entity.idMetadata.field)
                                    b.primary([cols.get(x).name]);
                            }
                        }
                    }

                }));

        }
    }


    async addColumnIfNotExist<T extends EntityMetadata>(entity: T, c: ((e: T) => FieldMetadata)) {
        let e = await getDbNameProvider(entity);
        if (e.isDbReadonly(c(entity)))
            return;


        let col = c(entity);
        let colName = e.nameOf(col);

        if (!await this.knex.schema.hasColumn(e.entityName, colName)) {
            await this.knex.schema.alterTable(e.entityName, b => {
                buildColumn(col, colName, b);
            });
        }



    }
    async verifyAllColumns<T extends EntityMetadata>(entity: T) {
        let e = await getDbNameProvider(entity);
        try {
            for (const col of entity.fields) {
                if (!e.isDbReadonly(col)) {
                    await this.addColumnIfNotExist(entity, () => col);
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    additionalWhere = '';
    constructor(private knex: Knex) {

    }
}

export function buildColumn(x: FieldMetadata, dbName: string, b: Knex.CreateTableBuilder) {


    if (x.valueType == Number) {
        if (!x.valueConverter.fieldTypeInDb) {
            let c = b.decimal(dbName);
            if (!x.allowNull) {
                c.defaultTo(0).notNullable();
            }
        }
        else if (x.valueConverter.fieldTypeInDb == "integer") {
            let c = b.integer(dbName);
            if (!x.allowNull) {
                c.defaultTo(0).notNullable();
            }
        }

        else b.specificType(dbName, x.valueConverter.fieldTypeInDb);
    }
    else if (x.valueType == Date) {
        if (!x.valueConverter.fieldTypeInDb)
            if (x.valueConverter == ValueConverters.DateOnly)
                b.date(dbName);
            else
                b.dateTime(dbName)
        else if (x.valueConverter.fieldTypeInDb == "date")
            b.date(dbName);
        else b.specificType(dbName, x.valueConverter.fieldTypeInDb);
    }
    else if (x.valueType == Boolean) {
        let c = b.boolean(dbName);
        if (!x.allowNull)
            c.defaultTo(false).notNullable();
    }

    else if (x.valueConverter.fieldTypeInDb) {
        if (x.valueConverter.fieldTypeInDb == "integer") {
            let c = b.integer(dbName);
            if (!x.allowNull) {
                c.defaultTo(0).notNullable();
            }
        }
        else b.specificType(dbName, x.valueConverter.fieldTypeInDb);
    }
    else {

        let c = b.string(dbName, (<StringFieldOptions>x.options).maxLength);
        if (!x.allowNull)
            c.defaultTo('').notNullable();
    }
}
function logSql<T extends {
    toSQL(): {
        sql: string
    };
}>(who: T) {
    //console.log(who.toSQL().sql);
    return who;
}

export async function createKnexDataProvider(config: Knex.Config, autoCreateTables = true) {
    let k = knex(config)
    let result = new KnexDataProvider(k);
    if (autoCreateTables)
        await new KnexSchemaBuilder(k).verifyStructureOfAllEntities(new Remult(result));
    return result;
}