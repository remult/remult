import { MongoClient, Db, FindOptions } from 'mongodb';
import { CompoundIdField, DataProvider, EntityDataProvider, EntityDataProviderFindOptions, EntityMetadata, FieldMetadata, Filter } from '.';
import { FilterConsumer } from './src/filter/filter-interfaces';

export class MongoDataProvider implements DataProvider {
    constructor(private db: Db, private client: MongoClient) {

    }
    getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider {
        return new MongoEntityDataProvider(this.db, entity);
    }
    async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
        let session = await this.client.startSession();
        session.startTransaction();
        try {
            await action(new MongoDataProvider(this.db, undefined));
            await session.commitTransaction();
        }
        catch {
            await session.abortTransaction();
        }
    }
}
const NULL = { $null: "$null" };
function isNull(x: any) {
    return x?.$null === NULL.$null;
}
class MongoEntityDataProvider implements EntityDataProvider {
    constructor(private db: Db, private entity: EntityMetadata<any>) {

    }
    async translateFromJson(row: any) {
        let result = {};
        for (const col of this.entity.fields) {
            result[col.key] = col.valueConverter.fromDb(row[await col.getDbName()]);
            if (isNull(result[col.key]))
                result[col.key] = null;
        }
        return result;
    }
    async translateToJson(row: any) {
        let result = {};
        for (const col of this.entity.fields) {
            let val = col.valueConverter.toDb(row[col.key]);
            if (val === null)
                val = NULL;
            result[await col.getDbName()] = val;
        }
        return result;
    }
    async count(where: Filter): Promise<number> {
        let x = new FilterConsumerBridgeToKnexMongo();
        where.__applyToConsumer(x);
        let w = await x.resolveWhere();

        return await (await this.collection()).countDocuments(w);
    }
    async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
        let collection = await this.collection()
        let x = new FilterConsumerBridgeToKnexMongo();
        if (options?.where)
            options.where.__applyToConsumer(x);
        let where = await x.resolveWhere();
        let op: FindOptions<any> = {

        };
        if (options.limit) {
            op.limit = options.limit;
            if (options.page) {
                op.skip = (options.page - 1) * options.limit;
            }
        }
        if (options.orderBy) {
            op.sort = {};
            for (const s of options.orderBy.Segments) {
                op.sort[await s.field.getDbName()] = s.isDescending ? -1 : 1;
            }
        }
        return await Promise.all(await collection.find(
            where,
            op
        ).map(x => this.translateFromJson(x)).toArray());
    }
    async update(id: any, data: any): Promise<any> {
        let collection = await this.collection();
        let f = new FilterConsumerBridgeToKnexMongo();
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);
        let resultFilter = this.entity.idMetadata.getIdFilter(id);
        if (data.id != undefined)
            resultFilter = this.entity.idMetadata.getIdFilter(data.id);
        for (const x of this.entity.fields) {
            if (x instanceof CompoundIdField) {
                resultFilter = x.resultIdFilter(id, data);
            }
        }
        let newR = {};
        let keys = Object.keys(data);
        for (const f of this.entity.fields) {
            if (!f.dbReadOnly && !f.isServerExpression && !(f == this.entity.idMetadata.field && this.entity.options.dbAutoIncrementId)) {
                if (keys.includes(f.key)) {
                    newR[f.key] = f.valueConverter.toJson(data[f.key]);
                }
            }
        }
        let r = await collection.updateOne(await f.resolveWhere(), {
            $set: newR
        });
        return this.find({ where: Filter.fromEntityFilter(this.entity, resultFilter) }).then(y => y[0]);

    }
    async delete(id: any): Promise<void> {
        let f = new FilterConsumerBridgeToKnexMongo();
        Filter.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(id)).__applyToConsumer(f);
        (await this.collection()).deleteOne(await f.resolveWhere());
    }
    async insert(data: any): Promise<any> {
        let collection = await this.collection();
        let r = await collection.insertOne(await this.translateToJson(data));
        return await this.translateFromJson(await collection.findOne({ _id: r.insertedId }))
    }

    private async collection() {
        return this.db.collection(await this.entity.getDbName());
    }
}

class FilterConsumerBridgeToKnexMongo implements FilterConsumer {

    _addWhere = true;
    promises: Promise<void>[] = [];
    result = [] as (() => any)[];
    async resolveWhere() {
        while (this.promises.length > 0) {
            let p = this.promises;
            this.promises = [];
            for (const pr of p) {
                await pr;

            }
        } if (this.result.length > 0)

            return { $and: this.result.map(x => x()) };
        else return {}
    }

    constructor() { }

    custom(key: string, customItem: any): void {
        throw new Error("Custom filter should be translated before it gets here");
    }

    or(orElements: Filter[]) {
        this.promises.push((async () => {
            let result = [];
            for (const element of orElements) {

                let f = new FilterConsumerBridgeToKnexMongo();
                f._addWhere = false;
                element.__applyToConsumer(f);
                let where = await f.resolveWhere();
                if (where?.$and.length > 0) {
                    result.push(where);

                }
            }
            this.result.push(() => ({
                $or: result
            }))


        })());

    }
    isNull(col: FieldMetadata): void {

        this.add(col, NULL, "$eq");

    }
    isNotNull(col: FieldMetadata): void {
        this.add(col, NULL, "$ne");
    }
    isIn(col: FieldMetadata, val: any[]): void {
        this.promises.push(
            col.getDbName().then(colName => {
                this.result.push(() => (
                    {
                        [colName]: {
                            $in: val.map(x => col.valueConverter.toDb(x))
                        }
                    }
                ));
            }))
    }
    isEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, "$eq");
    }
    isDifferentFrom(col: FieldMetadata, val: any): void {
        this.add(col, val, "$ne");
    }
    isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, "$gte");
    }
    isGreaterThan(col: FieldMetadata, val: any): void {
        this.add(col, val, "$gt");
    }
    isLessOrEqualTo(col: FieldMetadata, val: any): void {
        this.add(col, val, "$lte");
    }
    isLessThan(col: FieldMetadata, val: any): void {
        this.add(col, val, "$lt");
    }
    public containsCaseInsensitive(col: FieldMetadata, val: any): void {
        throw "error";
        // this.promises.push(col.getDbName().then(colName => {

        //     this.result.push(b => b.whereRaw(
        //         'lower (' + colName + ") like lower ('%" + val.replace(/'/g, '\'\'') + "%')"));
        // }));
        this.promises.push((async () => {

        })());
    }

    private add(col: FieldMetadata, val: any, operator: string) {
        this.promises.push(col.getDbName().then(colName => {
            this.result.push(() => ({
                [colName]: { [operator]: isNull(val) ? val : col.valueConverter.toDb(val) }
            }))
        }));


    }



    databaseCustom(databaseCustom: any): void {
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