/// <reference types="./worker-configuration.d.ts" />

import { it, describe, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { Remult, SqlDatabase } from '../../../core'

import { SqlDbTests } from '../shared-tests/sql-db-tests.js'
import type { DbTestProps } from '../shared-tests/db-tests-props.js'

import { allDbTests } from '../shared-tests/index.js'

import { D1BindingClient, D1DataProvider } from '../../../core/remult-d1.js'
import { getPlatformProxy } from "wrangler"
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'

describe('d1', () => {
  let closePlatformProxy: () => Promise<void>
  let d1DataProvider: D1DataProvider
  let db: SqlDatabase
  let remult: Remult

  beforeAll(async () => {
    const configPath = path.relative(".", path.join(dirname(fileURLToPath(import.meta.url)), "wrangler.jsonc"))
    const { env, dispose } = await getPlatformProxy<Env>({ configPath })
    d1DataProvider = new D1DataProvider(new D1BindingClient(env.D1_TEST_DB))
    closePlatformProxy = dispose
  })

  afterAll(async () => closePlatformProxy())

  beforeEach(async () => {
    db = new SqlDatabase(d1DataProvider)
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
      await db.execute(
        'drop table if exists ' + db.wrapIdentifier(repo.metadata.dbName),
      )
      await db.ensureSchema([repo.metadata])
      return repo
    },
  }

  // as of June2025, D1 does not support transactions
  allDbTests(props, { excludeTransactions: true })
  SqlDbTests({ ...props, skipMigrations: true }) // migration tests use transactions with rollback. D1 doesn't support transactions

  it('start works', async () => {
    await db.execute('drop table if exists x')
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
})
