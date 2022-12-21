
import { Remult } from "../context";
import { Entity, Field } from "../remult3";
import { KnexDataProvider } from '../../remult-knex';
import * as Knex from 'knex';
import { config } from 'dotenv';
import { testKnexPGSqlImpl, testPostgresImplementation } from "./backend-database-test-setup.backend-spec";
import { entityWithValidations } from "../shared-tests/entityWithValidations";
import { SqlDatabase } from "../data-providers/sql-database";
import { RemultAsyncLocalStorage } from "../../server/expressBridge";
import { initAsyncHooks } from "../../server/initAsyncHooks";
import { remult } from "../remult-proxy";
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
it("test async hooks and static remult", async () => {
    let gotException = true;
    try {
        RemultAsyncLocalStorage.instance.getRemult();
        gotException = false;
    }
    catch { }
    expect(gotException).toBe(true);
    initAsyncHooks();
    expect(RemultAsyncLocalStorage.instance.getRemult()).toBe(undefined);
    RemultAsyncLocalStorage.enable();
    try {
        remult.isAllowed(false);
        gotException = false;
    }
    catch { }
    expect(gotException).toBe(true);
    const promises = [];
    RemultAsyncLocalStorage.instance.run(new Remult(), () => {
        remult.user = { id: 'noam' };
        promises.push(new Promise(res => {
            setTimeout(() => {
                expect(remult.user.id).toBe('noam');
                res({})
            }, 10);
        }))
        RemultAsyncLocalStorage.instance.run(new Remult(), () => {
            remult.user = { id: 'yoni' };
            promises.push(new Promise(res => {
                setTimeout(() => {
                    expect(remult.user.id).toBe('yoni');
                    res({})
                }, 10);
            }))
        });
        promises.push(new Promise(res => {
            setTimeout(() => {
                expect(remult.user.id).toBe('noam');
                res({})
            }, 10);
        }))
    });
    await Promise.all(promises);

});