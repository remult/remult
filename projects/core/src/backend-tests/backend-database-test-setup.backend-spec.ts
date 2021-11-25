import { Remult } from "../context";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';

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
import '../shared-tests'