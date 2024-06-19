import { it, describe, expect, beforeEach, beforeAll } from 'vitest'
import { Remult, SqlDatabase } from '../../core'

import { SqlDbTests } from './shared-tests/sql-db-tests.js'
import type { DbTestProps } from './shared-tests/db-tests-props.js'

import { allDbTests } from './shared-tests/index.js'
import { Client, createClient } from '@libsql/client'

import { TursoDataProvider } from '../../core/remult-turso.js'

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN
describe.skipIf(!TURSO_DATABASE_URL)('turso', () => {
  let client: Client
  let db: SqlDatabase
  let remult: Remult
  beforeAll(() => {
    client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    })
  })
  beforeEach(async () => {
    db = new SqlDatabase(new TursoDataProvider(client))
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

  allDbTests(props)
  SqlDbTests({ ...props })

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
