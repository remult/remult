import { Remult } from '../../core/src/context'
import { SqlDatabase } from '../../core/src/data-providers/sql-database'
import { WebSqlDataProvider } from '../../core/src/data-providers/web-sql-data-provider'

import { beforeAll, beforeEach, describe } from 'vitest'
import { allDbTests } from './shared-tests'

describe('websql', () => {
  var db: SqlDatabase
  let remult: Remult

  beforeAll(async () => {
    let webSql = new WebSqlDataProvider('test')
    db = new SqlDatabase(webSql)
    for (const r of await (
      await db.execute("select name from sqlite_master where type='table'")
    ).rows) {
      switch (r.name) {
        case '__WebKitDatabaseInfoTable__':
          break
        case 'sqlite_sequence':
          break
        default:
          await db.execute('drop table if exists ' + r.name)
      }
    }
  })

  beforeEach(() => {
    remult = new Remult(db)
  })
  allDbTests(
    {
      getDb() {
        return db
      },
      getRemult() {
        return remult
      },
      createEntity: async (entity) => remult.repo(entity),
    },
    {
      excludeTransactions: true,
      excludeLiveQuery: true,
    },
  )
})
