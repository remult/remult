import { Remult } from "../context";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
import { createPostgresConnection, PostgresSchemaBuilder } from "../../postgres";
import { ClassType } from "../../classType";
import { addDatabaseToTest, dbTestWhatSignature, itWithFocus } from "../shared-tests/db-tests-setup";
config();
let myKnex = Knex.default({
    client: 'pg',
    connection: process.env.DATABASE_URL
});
export function testKnexSqlImpl(key: string, what: dbTestWhatSignature, focus = false) {
    itWithFocus(key + " - knex", async () => {
        let db = new KnexDataProvider(myKnex);
        let remult = new Remult(db);
        await what({ db, remult, createEntity: async (x) => remult.repo(x) });
    }, focus);
}
//addDatabaseToTest(testKnexSqlImpl);
let pg = createPostgresConnection({
    autoCreateTables: false
});
export function testPostgresImplementation(key: string, what: dbTestWhatSignature, focus = false) {


    itWithFocus(key + " - postgres", async () => {
        let db = await pg;
        let remult = new Remult(db);

        await what({
            db, remult, createEntity: async (entity: ClassType<any>) => {
                let repo = remult.repo(entity);
                let sb = new PostgresSchemaBuilder(db);
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
