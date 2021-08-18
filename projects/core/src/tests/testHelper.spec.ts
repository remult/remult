

import { Context } from "../context";
import { DataApiRequest, DataApiResponse, serializeError } from "../data-api";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Action, actionInfo, serverActionField } from "../server-action";
import { TestDataApiResponse } from "./basicRowFunctionality.spec";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 999999;
//actionInfo.runningOnServer = false;


export function itAsync(name: string, runAsync: () => Promise<any>) {
  it(name, (done: DoneFn) => {
    runAsync().catch(e => {
      fail(e);
      done();
    }).then(done, e => {
      fail(e);
      done();
    });
  });
}
export function fitAsync(name: string, runAsync: () => Promise<any>) {
  fit(name, (done: DoneFn) => {
    runAsync().catch(e => {
      fail(e);
      done();
    }).then(done, e => {
      fail(e);
      done();
    });
  });
}

export function itAsyncForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>) {
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
export function fitAsyncForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>) {
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
            (url: string, queue: boolean, what: ((data: any, req: Context, res: DataApiResponse) => void)) => {

              if (Context.apiBaseUrl + '/' + url == urlreq) {
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
                let context = new Context();
                context.setDataProvider(ActionTestConfig.db);


                what(JSON.parse(JSON.stringify(data)), context, t);
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