import { it, describe, expect, beforeEach } from 'vitest'
import { Entity, Fields, Remult, SqlDatabase } from '../../core'
import initSqlJs from 'sql.js'
import { SqlJsDataProvider } from '../../core/remult-sql-js.js'
import { allDbTests } from './shared-tests'
import { SqlDbTests } from './shared-tests/sql-db-tests.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'
import { testMigrationScript } from '../tests/testHelper.js'

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
    createEntity: async (entity) => {
      const repo = remult.repo(entity)
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
    expect((await c.execute(`select * from x where id=${c.param(1)}`)).rows)
      .toMatchInlineSnapshot(`
      [
        {
          "id": 1,
        },
      ]
    `)
  })
  it('test knex storage', async () => {
    @Entity('my')
    class MyEntity {
      @Fields.string()
      name = ''
      @Fields.json()
      json = []
      @Fields.object()
      object = []
    }
    const e = remult.repo(MyEntity).metadata

    expect(
      await testMigrationScript(db, (m) => m.addColumn(e, e.fields.object)),
    ).toMatchInlineSnapshot(
      '"alter table `my` add column `object` text default \'\' not null "',
    )
    expect(
      await testMigrationScript(db, (m) => m.addColumn(e, e.fields.name)),
    ).toMatchInlineSnapshot(
      '"alter table `my` add column `name` text default \'\' not null "',
    )
  })
})
