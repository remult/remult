import { it, describe, expect, beforeEach } from 'vitest'
import { Remult, SqlDatabase } from '../../core'
import initSqlJs from 'sql.js'
import { SqlJsDataProvider } from '../../core/remult-sql-js.js'
import { allDbTests } from './shared-tests'
import { SqlDbTests } from './shared-tests/sql-db-tests.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'

describe('Sql JS', () => {
  let db: SqlDatabase
  let remult: Remult
  beforeEach(async () => {
    db = new SqlDatabase(
      new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())),
    )
    remult = new Remult(db)
  })
  const props: DbTestProps = {
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity: async (entity) => remult.repo(entity),
  }
  allDbTests(props, {
    excludeTransactions: true,
  })
  SqlDbTests({ ...props, skipMigrations: true })
  it('start works', async () => {
    await db.execute('create table x (id int)')
    await db.execute('insert into x values (1)')
    const r = await db.execute('select * from x')
    expect(r.rows).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
        },
      ]
    `)
    const c = db.createCommand()
    expect(
      (
        await c.execute(
          `select * from x where id=${c.addParameterAndReturnSqlToken(1)}`,
        )
      ).rows,
    ).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
        },
      ]
    `)
  })
})
