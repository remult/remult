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
  it('multi-row insert batches by bind limit', async () => {
    @Entity('batch_ins')
    class BatchIns {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    const repo = remult.repo(BatchIns)
    await db.ensureSchema([repo.metadata])
    db._getSourceSql().maxParametersInOneSqlStatement = 7
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: 'n' + i,
    }))
    const inserted = await repo.insert(rows)
    expect(inserted.map((x) => ({ id: x.id, name: x.name }))).toEqual(rows)
    expect(await repo.count()).toBe(10)
  })
  it('multi-row insert unions sparse columns', async () => {
    @Entity('sparse_ins')
    class SparseIns {
      @Fields.integer()
      id = 0
      @Fields.string({ allowNull: true })
      a?: string
      @Fields.string({ allowNull: true })
      b?: string
    }
    const repo = remult.repo(SparseIns)
    await db.ensureSchema([repo.metadata])
    await db.getEntityDataProvider(repo.metadata).insert([
      { id: 1, a: 'x' },
      { id: 2, b: 'y' },
    ])
    const found = await repo.find({ orderBy: { id: 'asc' } })
    expect(found.map((x) => ({ id: x.id, a: x.a, b: x.b }))).toEqual([
      { id: 1, a: 'x', b: null },
      { id: 2, a: null, b: 'y' },
    ])
  })
})
