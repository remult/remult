import { CompoundIdField, DataProvider, EntityDataProvider, EntityDataProviderFindOptions, EntityMetadata, FieldMetadata, Filter, Remult } from ".."
import knex, { Knex } from 'knex';

import { FilterConsumer } from "../src/filter/filter-interfaces";
import { CustomSqlFilterObject } from "../src/filter/filter-consumer-bridge-to-sql-request";
import { isDbReadonly } from "../src/data-providers/sql-database";
import { allEntities } from "../src/context";
import { DateOnlyValueConverter } from "../valueConverters";
import { jitOnlyGuardedExpression } from "@angular/compiler/src/render3/util";

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
        catch {
            await t.rollback();
        }


    }
    supportsCustomFilter?: boolean;

}
class KnexEntityDataProvider implements EntityDataProvider {
    constructor(private entity: EntityMetadata<any>, private knex: Knex) {

    }
    async count(where: Filter): Promise<number> {
        const br = new FilterConsumerBridgeToKnexRequest();
        where.__applyToConsumer(br);
        let r = await br.resolveWhere();
        return +(
            await this.knex(await this.entity.getDbName())
                .count().where(b => r.forEach(w => w(b))))[0].count;
    }
    async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
        let cols = [] as string[];
        let colKeys: FieldMetadata[] = [];
        for (const x of this.entity.fields) {
            if (x.isServerExpression) {

            }
            else {
                cols.push(await x.getDbName());
                colKeys.push(x);
            }
        }
        let query = this.knex(await this.entity.getDbName()).select(cols);
        if (options?.where) {
            const br = new FilterConsumerBridgeToKnexRequest();
            options.where.__applyToConsumer(br);
            let r = await br.resolveWhere();
            query.where(b => r.forEach(y => y(b)));

        }
        if (options.orderBy) {

            query = query.orderBy(await Promise.all(options.orderBy.Segments.map(async s => ({
                column: await s.field.getDbName(),
                order: s.isDescending ? "desc" : "asc"
            }))));
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
    async update(id: any, data: any): Promise<any> {

        let f = new FilterConsumerBridgeToKnexRequest();
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);

        let resultFilter = this.entity.idMetadata.getIdFilter(id);
        if (data.id != undefined)
            resultFilter = this.entity.idMetadata.getIdFilter(data.id);


        let updateObject = {};
        for (const x of this.entity.fields) {

            if (await isDbReadonly(x)) { }

            else if (data[x.key] !== undefined) {
                let v = x.valueConverter.toDb(data[x.key]);
                if (v !== undefined) {


                    let key = await x.getDbName();
                    updateObject[key] = v;
                }
            }
        }


        let where = await f.resolveWhere();
        await this.knex(await this.entity.getDbName()).update(updateObject).where(b => where.forEach(w => w(b)));
        return this.find({ where: Filter.fromEntityFilter(this.entity, resultFilter) }).then(y => y[0]);
    }
    async delete(id: any): Promise<void> {

        let f = new FilterConsumerBridgeToKnexRequest();
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);
        let where = await f.resolveWhere();
        await this.knex(await this.entity.getDbName()).delete().where(b => where.forEach(w => w(b)));

    }
    async insert(data: any): Promise<any> {

        let resultFilter: Filter;
        if (this.entity.idMetadata.field instanceof CompoundIdField)
            resultFilter = this.entity.idMetadata.field.resultIdFilter(undefined, data);
        else
            resultFilter = Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(data[this.entity.idMetadata.field.key]));
        let insertObject = {};
        for (const x of this.entity.fields) {

            if (await isDbReadonly(x)) { }

            else {
                let v = x.valueConverter.toDb(data[x.key]);
                if (v != undefined) {


                    let key = await x.getDbName();
                    insertObject[key] = v;
                }
            }
        }

        let insert = this.knex(await this.entity.getDbName()).insert(insertObject);
        if (this.entity.options.dbAutoIncrementId) {
            let newId = await insert.returning(this.entity.idMetadata.field.key);
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

    constructor() { }

    custom(key: string, customItem: any): void {
        throw new Error("Custom filter should be translated before it gets here");
    }

    or(orElements: Filter[]) {
        let statement = '';
        this.promises.push((async () => {
            for (const element of orElements) {

                let f = new FilterConsumerBridgeToKnexRequest();
                f._addWhere = false;
                element.__applyToConsumer(f);
                let where = await f.resolveWhere();
                if (where.length > 0) {
                    this.result.push(b => {
                        b.orWhere(b => {
                            where.forEach(x => x(b));
                        });
                    })
                }
            }


        })());

    }
    isNull(col: FieldMetadata): void {
        this.promises.push(col.getDbName().then(col => { this.result.push(b => b.whereNull(col)) }));

    }
    isNotNull(col: FieldMetadata): void {
        this.promises.push(col.getDbName().then(col => { this.result.push(b => b.whereNotNull(col)) }));
    }
    isIn(col: FieldMetadata, val: any[]): void {
        this.promises.push(
            col.getDbName().then(colName => {
                this.result.push(knex =>
                    knex.whereIn(colName, val.map(x => col.valueConverter.toDb(x))))
            }));
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
        this.promises.push(col.getDbName().then(colName => {

            this.result.push(b => b.whereRaw(
                'lower (' + colName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')"));
        }));
        this.promises.push((async () => {

        })());
    }

    private add(col: FieldMetadata, val: any, operator: string) {
        this.promises.push(col.getDbName().then(colName => {
            this.result.push(b => b.where(colName, operator, col.valueConverter.toDb(val)))
        }));


    }



    databaseCustom(databaseCustom: CustomSqlFilterObject): void {
        throw "error";
        //   this.promises.push((async () => {
        //     if (databaseCustom?.buildSql) {
        //       let item = new CustomSqlFilterBuilder(this.knex);
        //       await databaseCustom.buildSql(item);
        //       if (item.sql) {
        //         this.addToWhere("(" + item.sql + ")");
        //       }
        //     }
        //   })());
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
                console.log("failed verify structore of " + await metadata.getDbName() + " ", err);
            }
        }
    }
    async createIfNotExist(e: EntityMetadata): Promise<void> {
        if (! await this.knex.schema.hasTable(await e.getDbName())) {
            let cols = new Map<FieldMetadata, { name: string, readonly: boolean }>();
            for (const f of e.fields) {
                cols.set(f, {
                    name: await f.getDbName(),
                    readonly: await isDbReadonly(f)
                });
            }
            await logSql(this.knex.schema.createTable(await e.getDbName(),
                b => {
                    for (const x of e.fields) {
                        if (!cols.get(x).readonly || x == e.idMetadata.field && e.options.dbAutoIncrementId) {


                            if (x == e.idMetadata.field && e.options.dbAutoIncrementId)
                                b.increments(cols.get(x).name);
                            else {
                                buildColumn(x, cols.get(x).name, b);
                                if (x == e.idMetadata.field)
                                    b.primary([cols.get(x).name]);
                            }
                        }
                    }

                }));

        }
    }


    async addColumnIfNotExist<T extends EntityMetadata>(e: T, c: ((e: T) => FieldMetadata)) {
        if (await isDbReadonly(c(e)))
            return;


        let col = c(e);
        let colName = await col.getDbName();

        if (!await this.knex.schema.hasColumn(await e.getDbName(), colName)) {
            await this.knex.schema.alterTable(await e.getDbName(), b => {
                buildColumn(col, colName, b);
            });
        }



    }
    async verifyAllColumns<T extends EntityMetadata>(e: T) {
        try {
            for (const col of e.fields) {
                if (!await isDbReadonly(col)) {
                    await this.addColumnIfNotExist(e, () => col);
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
            if (x.valueConverter == DateOnlyValueConverter)
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
        let c = b.string(dbName);
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