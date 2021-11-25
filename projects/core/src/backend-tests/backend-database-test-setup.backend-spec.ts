import { allEntities, Remult } from "../context";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
import { createPostgresConnection } from "../../postgres";

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
        await what({ db, remult });
    }, focus);
}
addDatabaseToTest(testKnexSqlImpl);
let pg = createPostgresConnection();
export function testPostgresImplementation(key: string, what: dbTestWhatSignature, focus = false) {


    itWithFocus(key + " - postgres", async () => {
        let db = await pg;
        let remult = new Remult(db);
        for (const e of allEntities) {
            try {
                await db.execute("delete from " + await remult.repo(e).metadata.getDbName());
            } catch { }
        }
        await what({ db, remult });
    }, focus);
}
addDatabaseToTest(testPostgresImplementation);
import '../shared-tests'


