import { createRequire } from 'node:module'
import { beforeEach, describe, expect, it } from 'vitest'
import { Remult, SqlDatabase } from '../../core'
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

  it('closes the underlying database', async () => {
    await db.end()

    await expect(db.execute('select 1')).rejects.toThrow()
  })
})
