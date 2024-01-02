import { it, describe, expect, beforeEach } from 'vitest'
import { Remult, SqlDatabase } from '../../core'
import initSqlJs from 'sql.js'
import { SqlJsDataProvider } from '../../core/remult-sql-js.js'
import { allDbTests } from './shared-tests'

describe('Sql JS', () => {
  let db: SqlDatabase
  let remult: Remult
  beforeEach(async () => {
    db = new SqlDatabase(
      new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())),
    )
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
    },
  )
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
