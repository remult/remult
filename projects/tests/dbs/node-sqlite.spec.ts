import { createRequire } from 'node:module'
import { beforeEach, describe, expect, it } from 'vitest'
import { Entity, Fields, Remult, SqlDatabase } from '../../core'
import {
  NodeSqliteDataProvider,
  type NodeSqliteDatabase,
} from '../../core/remult-node-sqlite.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'
import { allDbTests } from './shared-tests/index.js'
import { SqlDbTests } from './shared-tests/sql-db-tests.js'

const require = createRequire(import.meta.url)
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
const supportsNodeSqlite =
  nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 5)

describe.skipIf(!supportsNodeSqlite)('node:sqlite', () => {
  let db: SqlDatabase
  let remult: Remult
  let provider: NodeSqliteDataProvider

  beforeEach(() => {
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (location: string) => NodeSqliteDatabase
    }
    provider = new NodeSqliteDataProvider(new DatabaseSync(':memory:'))
    db = new SqlDatabase(provider)
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

  it('executes statements and named parameters', async () => {
    await db.execute('create table x (id int)')
    await db.execute('insert into x values (1)')
    expect((await db.execute('select * from x')).rows).toEqual([{ id: 1 }])

    const command = db.createCommand()
    expect(
      (await command.execute(`select * from x where id=${command.param(1)}`))
        .rows,
    ).toEqual([{ id: 1 }])

    const legacyCommand = provider.createCommand()
    const legacyParameter = legacyCommand.addParameterAndReturnSqlToken(1)
    expect(
      (
        await legacyCommand.execute(
          `select * from x where id=${legacyParameter}`,
        )
      ).rows,
    ).toEqual([{ id: 1 }])
  })

  it('round-trips binary values', async () => {
    await db.execute('create table binary_values (id int, value blob)')
    const command = db.createCommand()
    await command.execute(
      `insert into binary_values values (${command.param(1)}, ${command.param(
        new Uint8Array([1, 2, 3]),
      )})`,
    )

    const rows = (await db.execute('select value from binary_values')).rows
    expect(rows[0].value).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('paginator ends when a case insensitive key precedes a nullable one', async () => {
    @Entity('nocase_null_sort')
    class Row {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
      @Fields.integer({ allowNull: true })
      num: number | null = null
    }
    await db.execute(
      'create table nocase_null_sort (id integer primary key, name text collate nocase, num integer)',
    )
    const r = remult.repo(Row)
    await r.insert([
      { id: 1, name: 'smith', num: null },
      { id: 2, name: 'Smith', num: null },
      { id: 3, name: 'Smith', num: 1 },
      { id: 4, name: 'smith', num: 2 },
      { id: 5, name: 'zed', num: 1 },
    ])
    const orderBy = { name: 'asc', num: 'asc', id: 'asc' } as const
    for (let pageSize = 1; pageSize <= 6; pageSize++) {
      const ids: number[] = []
      let page = await r.query({ orderBy, pageSize }).paginator()
      while (true) {
        ids.push(...page.items.map((x) => x.id))
        if (!page.hasNextPage || ids.length > 5) break
        page = await page.nextPage()
      }
      expect(ids, `pageSize ${pageSize}`).toEqual(
        (await r.find({ orderBy })).map((x) => x.id),
      )
    }
  })

  it('closes the underlying database', async () => {
    await db.end()

    await expect(db.execute('select 1')).rejects.toThrow()
  })
})
