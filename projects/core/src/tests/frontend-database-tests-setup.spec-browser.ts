import {
  addDatabaseToTest,
  dbTestWhatSignature,
  itWithFocus,
  TestDbs,
} from '../shared-tests/db-tests-setup'
import { InMemoryDataProvider, remult } from '../..'
import { Remult } from '../context'
import { SqlDatabase } from '../data-providers/sql-database'
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider'

import { MockRestDataProvider } from './testHelper'
import { describe, it, expect } from 'vitest'

export function testWebSqlImpl(
  key: string,
  what: dbTestWhatSignature,
  focus = false,
) {
  itWithFocus(
    key + ' - WebSql',
    async () => {
      let webSql = new WebSqlDataProvider('test')
      const sql = new SqlDatabase(webSql)
      for (const r of await (
        await sql.execute("select name from sqlite_master where type='table'")
      ).rows) {
        switch (r.name) {
          case '__WebKitDatabaseInfoTable__':
            break
          case 'sqlite_sequence':
            break
          default:
            await sql.execute('drop table if exists ' + r.name)
        }
      }
      let remult = new Remult()
      remult.dataProvider = sql
      await what({ db: sql, remult, createEntity: async (x) => remult.repo(x) })
    },
    focus,
  )
}
addDatabaseToTest(testWebSqlImpl, TestDbs.webSql)

export function testRest(
  key: string,
  what: dbTestWhatSignature,
  focus = false,
) {
  itWithFocus(
    key + ' - Rest Provider',
    async () => {
      let r = new Remult()
      r.dataProvider = new InMemoryDataProvider()

      let db = new MockRestDataProvider(r)
      remult.dataProvider = db
      await what({ db, remult, createEntity: async (x) => remult.repo(x) })
    },
    focus,
  )
}
addDatabaseToTest(testRest, TestDbs.restDataProvider)

import '../shared-tests'
