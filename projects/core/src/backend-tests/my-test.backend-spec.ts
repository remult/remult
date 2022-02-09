import { IdEntity, SqlDatabase } from "../..";
import { Remult } from "../context";
import { Entity, Field } from "../remult3";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
import { testKnexPGSqlImpl, testPostgresImplementation } from "./backend-database-test-setup.backend-spec";
import { entityWithValidations } from "../shared-tests/entityWithValidations";
config();

describe("test", () => {
    let remult: Remult;
    let knex: Knex.Knex;
    beforeAll(async () => {
        knex =
            Knex.default({
                client: 'pg',
                connection: process.env.DATABASE_URL
            });
        remult = new Remult(new KnexDataProvider(knex));

    });
  

});



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

