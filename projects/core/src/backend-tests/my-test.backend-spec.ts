
import { Remult } from "../context";
import { Entity, EntityFilter, Field, Repository } from "../remult3";
import { knexCondition, KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
import { testKnexPGSqlImpl, testMongo, testPostgresImplementation } from "./backend-database-test-setup.backend-spec";
import { entityWithValidations } from "../shared-tests/entityWithValidations";
import { PostgresDataProvider } from "../../postgres";
import { MongoDataProvider, mongoCondition } from "../../remult-mongo";
import { SqlDatabase } from "../data-providers/sql-database";
import { dbNamesOf } from "../filter/filter-consumer-bridge-to-sql-request";
config();


testPostgresImplementation("default order by", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    await s.update(1, { name: "updated name" });
    expect((await s.find()).map(x => x.myId)).toEqual([1, 2, 3, 4]);
}, false);
testKnexPGSqlImpl("default order by", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    await s.update(1, { name: "updated name" });
    expect((await s.find()).map(x => x.myId)).toEqual([1, 2, 3, 4]);
}, false);


testPostgresImplementation("sql filter", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    expect((await s.find({
        where: SqlDatabase.customFilter(async build => {
            build.sql = s.metadata.fields.myId.options.dbName + ' in (1,3)';
        })
    })).length).toBe(2);
}, false);
testPostgresImplementation("sql filter2", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    expect((await s.find({
        where:
        {
            $or: [
                SqlDatabase.customFilter(async build => {
                    build.sql = s.metadata.fields.myId.options.dbName + ' in (1,3)';
                })
                , {
                    myId: 2
                }]
        }
    })).length).toBe(3);
}, false);
testKnexPGSqlImpl("knex filter", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    expect((await s.find({
        where: KnexDataProvider.customFilter(async () => {
            return build => build.whereIn(s.metadata.fields.myId.options.dbName, [1, 3])
        })
    })).length).toBe(2);
}, false);
testKnexPGSqlImpl("knex filter2", async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity);
    expect((await s.find({
        where: {
            $or: [KnexDataProvider.customFilter(async () => {
                return build => build.whereIn(s.metadata.fields.myId.options.dbName, [1, 3])
            }), {
                myId: 4
            }]
        }
    })).length).toBe(3);
}, false);



testPostgresImplementation("work with native sql", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const sql = SqlDatabase.getDb(remult);
    const r =
        await sql.execute("select count(*) as c from " + repo.metadata.options.dbName!);
    expect(r.rows[0].c).toBe('4');
}, false);
testPostgresImplementation("work with native sql2", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const sql = PostgresDataProvider.getDb(remult);
    const r =
        await sql.query("select count(*) as c from " + repo.metadata.options.dbName!);
    expect(r.rows[0].c).toBe('4');
}, false);
testPostgresImplementation("work with native sql3", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    await SqlDatabase.getDb(remult)._getSourceSql().transaction(async x => {
        const sql = PostgresDataProvider.getDb(new Remult(new SqlDatabase(x)));
        const r =
            await sql.query("select count(*) as c from " + repo.metadata.options.dbName!);
        expect(r.rows[0].c).toBe('4');
    });

}, false);

testKnexPGSqlImpl("work with native knex", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const knex = KnexDataProvider.getDb(remult);
    const r = await knex(repo.metadata.options.dbName!).count()
    expect(r[0].count).toBe('4');
}, false);
testKnexPGSqlImpl("work with native knex2", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    await (remult.dataProvider).transaction(async db => {
        const sql = KnexDataProvider.getDb(new Remult(db));
        const r = await sql(repo.metadata.options.dbName!).count()
        expect(r[0].count).toBe('4');
    });

}, false);
testKnexPGSqlImpl("work with native knex3", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const knex = KnexDataProvider.getDb(remult);
    const t =await  dbNamesOf(repo);
    const r = await knex((await t).$entityName).select(t.myId,t.name);
    expect(r.length).toBe(4);
}, false);

testMongo("work with native mongo", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const mongo = MongoDataProvider.getDb(remult);
    const r = await (await mongo.collection(repo.metadata.options.dbName!)).countDocuments();
    expect(r).toBe(4);
}, false);


testKnexPGSqlImpl("knex with filter", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const knex = KnexDataProvider.getDb(remult);
    const e = await dbNamesOf(repo);
    const r = await knex(e.$entityName).count().where(await knexCondition(repo, { myId: [1, 3] }));
    expect(r[0].count).toBe('2');
}, false);

testMongo("work with native mongo and condition", async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity);
    const mongo = MongoDataProvider.getDb(remult);
    const r = await (await mongo.collection(repo.metadata.options.dbName!)).countDocuments(await mongoCondition(repo, { myId: [1, 2] }))
    expect(r).toBe(2);
}, false);