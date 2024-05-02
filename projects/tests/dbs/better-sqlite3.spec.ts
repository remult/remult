import { it, describe, expect, beforeEach } from 'vitest'
import { Remult, SqlDatabase } from '../../core'

import { BetterSqlite3DataProvider } from '../../core/remult-better-sqlite3.js'

import { SqlDbTests } from './shared-tests/sql-db-tests.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'
import Database from 'better-sqlite3'
import { allDbTests } from './shared-tests/index.js'

describe('better-sqlite3', () => {
  let db: SqlDatabase
  let remult: Remult
  beforeEach(async () => {
    db = new SqlDatabase(
      new BetterSqlite3DataProvider(new Database(':memory:')),
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
    createEntity: async (entity) => {
      const repo = remult.repo(entity);
      await db.ensureSchema([repo.metadata])
      return repo
    },
  }
  allDbTests(props)
  SqlDbTests({ ...props })
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
          `select * from x where id=${c.param(1)}`,
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

