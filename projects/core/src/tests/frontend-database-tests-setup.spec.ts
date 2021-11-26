
import { addDatabaseToTest, dbTestWhatSignature, itWithFocus } from "../shared-tests/db-tests-setup";
import { InMemoryDataProvider } from "../..";
import { Remult } from "../context";
import { SqlDatabase } from "../data-providers/sql-database";
import { WebSqlDataProvider } from "../data-providers/web-sql-data-provider";

import { MockRestDataProvider } from "./testHelper.spec";

export function testWebSqlImpl(key: string, what: dbTestWhatSignature, focus = false) {
  itWithFocus(key + " - WebSql", async () => {
    let webSql = new WebSqlDataProvider('test');
    const sql = new SqlDatabase(webSql);
    for (const r of await (await sql.execute("select name from sqlite_master where type='table'")).rows) {
      switch (r.name) {
        case "__WebKitDatabaseInfoTable__":
          break;
        default:
          await sql.execute("drop table if exists " + r.name);
      }
    }
    let remult = new Remult();
    remult.setDataProvider(sql);
    await what({ db: sql, remult, createEntity: async (x) => remult.repo(x) });
  }, focus);
}
addDatabaseToTest(testWebSqlImpl);


export function testRest(key: string, what: dbTestWhatSignature, focus = false) {
  itWithFocus(key + " - Rest Provider", async () => {
    let r = new Remult();
    r.setDataProvider(new InMemoryDataProvider());

    let remult = new Remult();
    let db = new MockRestDataProvider(r);
    remult.setDataProvider(db);
    await what({ db, remult, createEntity: async (x) => remult.repo(x) });
  }, focus);
}
addDatabaseToTest(testRest);


import '../shared-tests/';
