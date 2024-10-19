//
import { describe, expect, test } from 'vitest'
import {
  Entity,
  Fields,
  Remult,
  remult,
  repo,
  SqlDatabase,
} from '../core/index.js'
import { TestApiDataProvider } from '../core/server/test-api-data-provider.js'
import { createSqlite3DataProvider } from '../core/remult-sqlite3.js'

declare module 'remult' {
  export interface RemultContext {
    test?: string
  }
}

describe('test api data provider', () => {
  test("test different isolation doesn't affect the original", async () => {
    let userOnServer: string = undefined!,
      testOnServer: string = undefined!
    @Entity('test', {
      allowApiCrud: true,
      apiPrefilter: () => {
        userOnServer = remult.user!.name!
        testOnServer = remult.context.test!
        return undefined
      },
    })
    class Person {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    remult.context.test = 'test'
    remult.user = {
      id: '1',
      name: 'Noam',
    }
    remult.dataProvider = TestApiDataProvider()
    expect(await repo(Person).count()).toBe(0)
    expect(userOnServer).toBe('Noam')
    expect(testOnServer).toBe(undefined)
  })
  test('test sqlite', async () => {
    @Entity('test', {
      allowApiCrud: true,
      apiPrefilter: () => {
        return SqlDatabase.rawFilter((x) =>
          x.filterToRaw(repo(Person), { id: 1 }),
        )
      },
    })
    class Person {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    remult.context.test = 'test'
    remult.user = {
      id: '1',
      name: 'Noam',
    }
    remult.dataProvider = TestApiDataProvider({
      dataProvider: createSqlite3DataProvider(),
    })
    await repo(Person).insert([
      { id: 1, name: 'Noam' },
      { id: 2, name: 'Yoni' },
    ])
    expect(await repo(Person).count()).toBe(1)
  })
  test('test error', async () => {
    @Entity('test', {
      allowApiCrud: 'admin',
    })
    class Person {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    remult.dataProvider = TestApiDataProvider()
    await expect(() => repo(Person).count()).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 403,
        "message": "Forbidden",
      }
    `)
  })
})
