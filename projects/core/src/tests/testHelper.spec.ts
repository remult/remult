import { Context } from "../context";
import { DataApiRequest, DataApiResponse } from "../data-api";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Action, actionInfo, serverActionField } from "../server-action";
import { TestDataApiResponse } from "./basicRowFunctionality.spec";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 999999;



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

export interface MDHInterface {
  update?(id: any, data: any): Promise<any>;
  delete?(id: any): Promise<void>;
  insert?(data: any): Promise<any>;
}
export class Done {
  happened = false;
  ok() {
    this.happened = true;
  }
  test(message = 'expected to be done') {
    if (!this.happened)
      fail(message);
  }

}

Action.provider = {
  delete: undefined,
  get: undefined,
  post: async (urlreq, data) => {
    return await new Promise((res, r) => {
      let found = false;
      //   if (false)
      actionInfo.allActions.forEach(action => {

        action[serverActionField].dataProvider = () => new InMemoryDataProvider();

        action[serverActionField].
          __register(
            (url: string, queue: boolean, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => {
              if (Context.apiBaseUrl + '/' + url == urlreq) {
                found = true;
                let t = new TestDataApiResponse();
                t.success = data =>
                  res(data);
                t.error= data => r(data);
                what(data, {
                  get: x => {
                    ;
                    return undefined;
                  }, clientIp: '', user: undefined, getHeader: x => ""
                  , getBaseUrl: () => ''
                }, t);
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