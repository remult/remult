import { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, EntityMetadata, FieldMetadata, Filter } from ".."
import { Knex } from 'knex';
import { FilterConsumer } from "../src/filter/filter-interfaces";
import { CustomSqlFilterObject } from "../src/filter/filter-consumer-bridge-to-sql-request";
export class KnexDataProvider implements DataProvider {
    constructor(public knex: Knex) {

    }
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider {
        return new KnexEntityDataProvider(entity, this.knex);
    }
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
    }
    supportsCustomFilter?: boolean;

}
class KnexEntityDataProvider implements EntityDataProvider {
    constructor(private entity: EntityMetadata<any>, private knex: Knex) {

    }
    async count(where: Filter): Promise<number> {
        return +(
            await this.knex(await this.entity.getDbName())
                .count())[0].count;
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
            const br = new FilterConsumerBridgeToKnexRequest(query);
            options.where.__applyToConsumer(br);
            query = (await br.resolveWhere())[0];
            
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
    update(id: any, data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
    delete(id: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    insert(data: any): Promise<any> {
        throw new Error("Method not implemented.");
    }

}
export class FilterConsumerBridgeToKnexRequest implements FilterConsumer {
    private where = "";
    _addWhere = true;
    promises: Promise<void>[] = [];
    async resolveWhere():Promise<Knex.QueryBuilder> {
        while (this.promises.length > 0) {
            let p = this.promises;
            this.promises = [];
            for (const pr of p) {
                await pr;
                
            }
        }
        return [this.knex];
    }

    constructor(private knex: Knex.QueryBuilder) { }

    custom(key: string, customItem: any): void {
        throw new Error("Custom filter should be translated before it gets here");
    }

    or(orElements: Filter[]) {
        let statement = '';
        this.promises.push((async () => {
            for (const element of orElements) {
                let f = new FilterConsumerBridgeToKnexRequest(this.knex);
                f._addWhere = false;
                element.__applyToConsumer(f);
                let where = await f.resolveWhere();
                if (where.length > 0) {
                    if (statement.length > 0) {
                        statement += " or ";
                    }
                    if (orElements.length > 1) {
                        statement += "(" + where + ")";
                    }
                    else
                        statement += where;
                }
            }
            this.addToWhere("(" + statement + ")");
        })());

    }
    isNull(col: FieldMetadata): void {
        this.promises.push((async () => this.addToWhere(await col.getDbName() + ' is null'))());

    }
    isNotNull(col: FieldMetadata): void {
        this.promises.push((async () => this.addToWhere(await col.getDbName() + ' is not null'))());
    }
    isIn(col: FieldMetadata, val: any[]): void {
        throw "not implemented";
        //   this.promises.push((async () => {
        //     if (val && val.length > 0)
        //       this.addToWhere(await col.getDbName() + " in (" + val.map(x => this.knex.addParameterAndReturnSqlToken(col.valueConverter.toDb(x))).join(",") + ")");
        //     else
        //       this.addToWhere('1 = 0 /*isIn with no values*/');
        //   })());
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
        this.promises.push((async () => {
            this.addToWhere('lower (' + await col.getDbName() + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')");
        })());
    }

    private add(col: FieldMetadata, val: any, operator: string) {
        this.promises.push((async () => {
            this.knex = this.knex.where(await col.getDbName(), operator, col.valueConverter.toDb(val));
        })());

    }


    private addToWhere(x: string) {
        if (this.where.length == 0) {
            if (this._addWhere)
                this.where += ' where ';
        }
        else
            this.where += ' and ';
        this.where += x;
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