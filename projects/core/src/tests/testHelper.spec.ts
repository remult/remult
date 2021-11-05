

import { AllowedForInstance, Remult } from "../context";
import { DataApi, DataApiRequest, DataApiResponse, serializeError } from "../data-api";
import { DataProvider, EntityDataProvider } from "../data-interfaces";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { RestEntityDataProvider } from "../data-providers/rest-data-provider";
import { SqlDatabase } from "../data-providers/sql-database";
import { WebSqlDataProvider } from "../data-providers/web-sql-data-provider";
import { EntityMetadata } from "../remult3";
import { Action, actionInfo, serverActionField } from "../server-action";


jasmine.DEFAULT_TIMEOUT_INTERVAL = 999999;
//actionInfo.runningOnServer = false;




export function itForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>) {
  arrayOfT.forEach(i => {
    it(name + ' - ' + i, (done: DoneFn) => {
      runAsync(i).catch(e => {
        fail(e);
        done();
      }).then(done, e => {
        fail(e);
        done();
      });
    });
  });
}
export function fitForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>) {
  arrayOfT.forEach(i => {
    fit(name + ' - ' + i, (done: DoneFn) => {
      runAsync(i).catch(e => {
        fail(e);
        done();
      }).then(done, e => {
        fail(e);
        done();
      });
    });
  });
}


export class Done {
  happened = false;
  ok() {
    this.happened = true;
  }
  test(message = 'expected to be done') {
    expect(this.happened).toBe(true, message);
  }

}
export const ActionTestConfig = {
  db: new InMemoryDataProvider()
}
Action.provider = {
  delete: undefined,
  get: undefined,
  post: async (urlreq, data) => {
    return await new Promise((res, r) => {
      let found = false;

      actionInfo.allActions.forEach(action => {

        action[serverActionField].
          __register(
            (url: string, queue: boolean,allowed:AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => {

              if (Remult.apiBaseUrl + '/' + url == urlreq) {
                found = true;
                let t = new TestDataApiResponse();
                actionInfo.runningOnServer = true;
                t.success = data => {
                  res(data);
                  actionInfo.runningOnServer = false
                }
                t.error = data => {
                  r(JSON.parse(JSON.stringify(serializeError(data))));
                  actionInfo.runningOnServer = false
                }
                let remult = new Remult();
                remult.setDataProvider(ActionTestConfig.db);


                what(JSON.parse(JSON.stringify(data)), remult, t);
              }
            }
          )
      })
      if (!found) {
        r("did not find " + urlreq);
      }
    });

  },
  put: undefined
}


export async function testSql(runAsync: (db: {
  db: DataProvider,
  remult: Remult
}) => Promise<void>) {
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
  await runAsync({ db: sql, remult });
}
export async function testInMemoryDb(runAsync: (db: {
  db: DataProvider,
  remult: Remult
}) => Promise<void>) {
  let remult = new Remult();
  let db = new InMemoryDataProvider();
  remult.setDataProvider(db);
  await runAsync({ db, remult });
}
export async function testRestDb(runAsync: (db: {
  db: DataProvider,
  remult: Remult
}) => Promise<void>) {
  let r = new Remult();
  r.setDataProvider(new InMemoryDataProvider());

  let remult = new Remult();
  let db = new MockRestDataProvider(r);
  remult.setDataProvider(db);
  await runAsync({ db, remult });
}
export async function testAllDataProviders(runAsync: (db: {
  db: DataProvider,
  remult: Remult
}) => Promise<void>) {
  await testSql(runAsync);
 // await testInMemoryDb(runAsync);
  //await testRestDb(runAsync);
}

export var restDbTestingServer = false;

function urlToReq(url: string) {

  let args = new Map<string, any>();
  let params = url?.split('?')[1]?.split('&');
  if (params)
    for (const p of params) {
      if (!p)
        continue;
      let z = p.split('=');
      let key = decodeURIComponent(z[0]);
      let value = decodeURIComponent(z[1]);
      let x = args.get(key);
      if (x === undefined) {
        args.set(key, value);
      } else if (Array.isArray(x))
        x.push(value);
      else
        args.set(key, [args.get(key), value]);
    }
  let req = {
    get: (key) => {
      let r = args.get(key);
      if (r !== undefined) {
        r.toString();
      }
      return r;
    }
  };
  return req;
}

export class TestDataApiResponse implements DataApiResponse {
  progress(progress: number): void {

  }
  success(data: any): void {
    fail('didnt expect success: ' + JSON.stringify(data));
  }
  forbidden() {
    fail('didnt expect forbidden:');
  }
  created(data: any): void {
    fail('didnt expect created: ' + JSON.stringify(data));
  }
  deleted(): void {
    fail('didnt expect deleted:');
  }
  notFound(): void {
    fail('not found');
  }
  error(data) {
    fail('error: ' + data + " " + JSON.stringify(data));
  }

}
export class MockRestDataProvider implements DataProvider {
  constructor(private remult: Remult) {

  }
  getEntityDataProvider(metadata: EntityMetadata<any>): EntityDataProvider {

    let dataApi = new DataApi(this.remult.repo(metadata.entityType), this.remult);
    return new RestEntityDataProvider("", {
      delete: async url => {


        let urlSplit = url.split('/');
        let r = new TestDataApiResponse();
        let result;
        r.deleted = () => { };
        try {
          restDbTestingServer = true;
          await dataApi.delete(r, urlSplit[urlSplit.length - 1]);
        }
        finally {
          restDbTestingServer = false;
        }
        return result;
      },
      get: async (url) => {
        let r = new TestDataApiResponse();
        let result;


        r.success = data => { result = data };
        try {
          restDbTestingServer = true;
          await dataApi.httpGet(r, urlToReq(url));
        }
        finally {
          restDbTestingServer = false;
        }
        return result;
      },
      post: async (url, data) => {

        let r = new TestDataApiResponse();
        let result;
        r.created = data => { result = data };
        r.success = data => { result = data };
        try {
          restDbTestingServer = true;
          await dataApi.httpPost(r, urlToReq(url), data);
        }
        finally {
          restDbTestingServer = false;
        }
        return result;
      },
      put: async (url, data) => {
        let urlSplit = url.split('/');
        let r = new TestDataApiResponse();
        let result;
        r.success = data => { result = data };
        try {
          restDbTestingServer = true;
          await dataApi.put(r, urlSplit[urlSplit.length - 1], data);
        }
        finally {
          restDbTestingServer = false;
        }
        return result;
      }
    }, metadata);
  }
  transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  supportsCustomFilter = true;

}
