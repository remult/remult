import { Remult } from "../context";
import { KnexDataProvider, KnexSchemaBuilder } from '../../remult-knex';
import * as Knex from 'knex';
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { createPostgresConnection, PostgresSchemaBuilder } from "../../postgres";
import { ClassType } from "../../classType";
import { addDatabaseToTest, dbTestWhatSignature, itWithFocus, testAll } from "../shared-tests/db-tests-setup";
config();
function testKnexSqlImpl(knex: Knex.Knex, name: string) {
    return (key: string, what: dbTestWhatSignature, focus = false) => {
        itWithFocus(key + " " + name + " - knex", async () => {
            let db = new KnexDataProvider(knex);
            let remult = new Remult(db);
            await what({
                db, remult,
                createEntity:
                    async (entity: ClassType<any>) => {

                        let repo = remult.repo(entity);
                        let sb = new KnexSchemaBuilder(knex);
                        await knex.schema.dropTableIfExists(await repo.metadata.getDbName());
                        await sb.createIfNotExist(repo.metadata);
                        await sb.verifyAllColumns(repo.metadata);
                        await knex(await repo.metadata.getDbName()).delete();
                        return repo;
                    }
            });
        }, focus);
    }
}

export const testKnexPGSqlImpl = testKnexSqlImpl(Knex.default({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    //debug:true
}), "postgres");


addDatabaseToTest(testKnexPGSqlImpl);
if (process.env['TESTS_SQL_SERVER'])
    addDatabaseToTest(testKnexSqlImpl(Knex.default({
        client: 'mssql',
        connection: {
            server: '127.0.0.1',
            database: 'test2',
            user: 'sa',
            password: 'MASTERKEY',
            options: {
                enableArithAbort: true,
                encrypt: false,
                instanceName: 'sqlexpress'
            }
        }//,debug: true
    }), "sql server"));
if (true)
    addDatabaseToTest(testKnexSqlImpl(Knex.default({
        client: 'better-sqlite3', // or 'better-sqlite3'
        connection: {
            filename: ":memory:"
        },
        //debug: true
    }), "sqlite3"));
export const mySqlTest =
    addDatabaseToTest(testKnexSqlImpl(Knex.default({
        client: 'mysql2',
        connection: {
            user: 'root',
            password: 'MASTERKEY',
            host: '127.0.0.1',
            database: 'test'
        }
        //debug: true
    }), "mysql2"));



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
let done: MongoClient;
let mongoDbPromise = client.connect().then(c => {
    done = c;
    return c.db("test");

});

afterAll(async () => {
    if (done)
        done.close();
});


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


import '../shared-tests'