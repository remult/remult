import { it } from 'vitest'
import { HttpProviderBridgeToRestDataProviderHttpProvider } from '../../core/src/buildRestDataProvider'
import type { AllowedForInstance } from '../../core/src/context'
import { Remult } from '../../core/src/context'
import type { DataApiResponse } from '../../core/src/data-api'
import { DataApi, serializeError } from '../../core/src/data-api'
import type {
  DataProvider,
  EntityDataProvider,
  RestDataProviderHttpProvider,
} from '../../core/src/data-interfaces'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database'
import { RestEntityDataProvider } from '../../core/src/data-providers/rest-data-provider'
import { SqlDatabase } from '../../core/src/data-providers/sql-database'
import { WebSqlDataProvider } from '../../core/src/data-providers/web-sql-data-provider'
import { remult } from '../../core/src/remult-proxy'
import type { EntityMetadata } from '../../core'
import {
  actionInfo,
  serverActionField,
} from '../../core/src/server-action-info'
import { testConfiguration } from '../dbs/shared-tests/entityWithValidations'
import { TestDataApiResponse } from './TestDataApiResponse'

//actionInfo.runningOnServer = false;

export async function testAsIfOnBackend(what: () => Promise<any>) {
  try {
    actionInfo.runningOnServer = true
    await what()
  } finally {
    actionInfo.runningOnServer = false
  }
}

export const ActionTestConfig = {
  db: new InMemoryDataProvider(),
}
remult.apiClient.httpClient = {
  delete: () => undefined,
  get: () => undefined,
  post: async (urlreq, data) => {
    return await new Promise((res, r) => {
      let found = false

      actionInfo.allActions.forEach((action) => {
        action[serverActionField].__register(
          (
            url: string,
            queue: boolean,
            allowed: AllowedForInstance<any>,
            what: (data: any, req: Remult, res: DataApiResponse) => void,
          ) => {
            if ('/api/' + url == urlreq) {
              found = true
              let t = new TestDataApiResponse()
              actionInfo.runningOnServer = true
              t.success = (data) => {
                res(data)
                actionInfo.runningOnServer = false
              }
              t.error = (data) => {
                r(JSON.parse(JSON.stringify(serializeError(data))))
                actionInfo.runningOnServer = false
              }
              t.forbidden = () => {
                r({ status: 403, message: 'forbidden' })
                actionInfo.runningOnServer = false
              }
              let remult = new Remult()
              remult.dataProvider = ActionTestConfig.db

              what(JSON.parse(JSON.stringify(data)), remult, t)
            }
          },
        )
      })
      if (!found) {
        r('did not find ' + urlreq)
      }
    })
  },
  put: () => undefined,
}

export async function testSql(
  runAsync: (db: { db: DataProvider; remult: Remult }) => Promise<void>,
) {
  let webSql = new WebSqlDataProvider('test')
  const sql = new SqlDatabase(webSql)
  for (const r of await (
    await sql.execute("select name from sqlite_master where type='table'")
  ).rows) {
    switch (r.name) {
      case '__WebKitDatabaseInfoTable__':
        break
      default:
        await sql.execute('drop table if exists ' + r.name)
    }
  }
  let remult = new Remult()
  remult.dataProvider = sql
  await runAsync({ db: sql, remult })
}
export async function testInMemoryDb(
  runAsync: (db: { db: DataProvider; remult: Remult }) => Promise<void>,
) {
  let db = new InMemoryDataProvider()
  remult.dataProvider = db
  await runAsync({ db, remult })
}

export async function testRestDb(
  runAsync: (db: { db: DataProvider; remult: Remult }) => Promise<void>,
) {
  let r = new Remult()
  r.dataProvider = new InMemoryDataProvider()

  let remult = new Remult()
  let db = new MockRestDataProvider(r)
  remult.dataProvider = db
  await runAsync({ db, remult })
}
export async function testAllDataProviders(
  runAsync: (db: { db: DataProvider; remult: Remult }) => Promise<void>,
) {
  await testSql(runAsync)
  await testInMemoryDb(runAsync)
  await testRestDb(runAsync)
}

function urlToReq(url: string) {
  let args = new Map<string, any>()
  let params = url?.split('?')[1]?.split('&')
  if (params)
    for (const p of params) {
      if (!p) continue
      let z = p.split('=')
      let key = decodeURIComponent(z[0])
      let value = decodeURIComponent(z[1])
      let x = args.get(key)
      if (x === undefined) {
        args.set(key, value)
      } else if (Array.isArray(x)) x.push(value)
      else args.set(key, [args.get(key), value])
    }
  let req = {
    get: (key) => {
      let r = args.get(key)
      if (r !== undefined) {
        r
      }
      return r
    },
  }
  return req
}

export class MockRestDataProvider implements DataProvider {
  constructor(private remult: Remult) {}
  getEntityDataProvider(metadata: EntityMetadata<any>): EntityDataProvider {
    let dataApi = new DataApi(
      this.remult.repo(metadata.entityType),
      this.remult,
    )
    return new RestEntityDataProvider(
      () => '',
      () => createMockHttpDataProvider(dataApi),
      metadata,
    )
  }
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  isProxy = true
}
export function createMockHttpDataProvider(
  dataApi: DataApi<any>,
): RestDataProviderHttpProvider {
  return new HttpProviderBridgeToRestDataProviderHttpProvider({
    delete: async (url) => {
      let urlSplit = url.split('/')
      let r = new TestDataApiResponse()
      let result
      r.deleted = () => {}
      try {
        testConfiguration.restDbRunningOnServer = true
        await dataApi.delete(r, urlSplit[urlSplit.length - 1])
      } finally {
        testConfiguration.restDbRunningOnServer = false
      }
      return result
    },
    get: async (url) => {
      let r = new TestDataApiResponse()
      let result

      r.success = (data) => {
        result = data
      }
      try {
        testConfiguration.restDbRunningOnServer = true
        await dataApi.httpGet(r, urlToReq(url), async () => '')
      } finally {
        testConfiguration.restDbRunningOnServer = false
      }
      return result
    },

    post: async (url, data) => {
      let r = new TestDataApiResponse()
      let result
      r.created = (data) => {
        result = data
      }
      r.success = (data) => {
        result = data
      }
      try {
        testConfiguration.restDbRunningOnServer = true
        await dataApi.httpPost(r, urlToReq(url), data, async () => ({}))
      } finally {
        testConfiguration.restDbRunningOnServer = false
      }
      return result
    },
    put: async (url, data) => {
      let urlSplit = url.split('/')
      let r = new TestDataApiResponse()
      let result
      r.success = (data) => {
        result = data
      }
      try {
        testConfiguration.restDbRunningOnServer = true
        await dataApi.put(r, urlSplit[urlSplit.length - 1], data)
      } finally {
        testConfiguration.restDbRunningOnServer = false
      }
      return result
    },
  })
}
