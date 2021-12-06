import { Remult } from "../context";
import { KnexDataProvider, KnexSchemaBuilder } from '../../remult-knex';
import * as Knex from 'knex';
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { createPostgresConnection, PostgresSchemaBuilder } from "../../postgres";
import { ClassType } from "../../classType";
import { addDatabaseToTest, dbTestWhatSignature, itWithFocus, testAll } from "../shared-tests/db-tests-setup";
config();
let myKnex = Knex.default({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    //   debug:true
});
export function testKnexSqlImpl(key: string, what: dbTestWhatSignature, focus = false) {
    itWithFocus(key + " - knex", async () => {
        let db = new KnexDataProvider(myKnex);
        let remult = new Remult(db);
        await what({
            db, remult,
            createEntity:
                async (entity: ClassType<any>) => {

                    let repo = remult.repo(entity);
                    let sb = new KnexSchemaBuilder(myKnex);
                    await myKnex.schema.dropTableIfExists(await repo.metadata.getDbName());
                    await sb.createIfNotExist(repo.metadata);
                    await sb.verifyAllColumns(repo.metadata);
                    await myKnex(await repo.metadata.getDbName()).delete();
                    return repo;
                }
        });
    }, focus);
}
addDatabaseToTest(testKnexSqlImpl);
let pg = createPostgresConnection({
    autoCreateTables: false
});
export function testPostgresImplementation(key: string, what: dbTestWhatSignature, focus = false) {


    itWithFocus(key + " - postgres", async () => {
        let db = await pg;
        let remult = new Remult(db);

        await what({
            db, remult,
            createEntity:
                async (entity: ClassType<any>) => {
                    let repo = remult.repo(entity);
                    let sb = new PostgresSchemaBuilder(db);
                    await db.execute("drop table if exists " + await repo.metadata.getDbName());
                    await sb.createIfNotExist(repo.metadata);
                    await sb.verifyAllColumns(repo.metadata);
                    await db.execute("delete from " + await repo.metadata.getDbName());
                    return repo;
                }
        });
    }, focus);
}
addDatabaseToTest(testPostgresImplementation);
import '../shared-tests'
import { Categories } from "../tests/remult-3-entities";
import { MongoDataProvider } from "../../remult-mongo";

testAll("transactions", async ({ db, createEntity }) => {
    let x = await createEntity(Categories);

    await db.transaction(async db => {
        let remult = new Remult(db);
        expect(await remult.repo(Categories).count()).toBe(0);
    });
});


let client = new MongoClient("mongodb://localhost:27017/local");
let mongoDbPromise = client.connect().then(c => c.db("test"));

export function testMongo(key: string, what: dbTestWhatSignature, focus = false) {
    itWithFocus(key + " - mongo", async () => {
        let mongoDb = await mongoDbPromise;
        let db = new MongoDataProvider(mongoDb, client);
        let remult = new Remult(db);
        await what({
            db, remult,
            createEntity:
                async (entity: ClassType<any>) => {

                    let repo = remult.repo(entity);
                    await mongoDb.collection(await repo.metadata.getDbName()).deleteMany({})

                    return repo;
                }
        });
    }, focus);
}
addDatabaseToTest(testMongo);
