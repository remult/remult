import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Remult, SqlDatabase } from '../../../core'
import { D1DataProvider, D1HttpClient } from '../../../core/remult-d1-http.js'
import type { DbTestProps } from '../shared-tests/db-tests-props.js'
import { allDbTests } from '../shared-tests/index.js'
import { SqlDbTests } from '../shared-tests/sql-db-tests.js'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID

describe.skipIf(
  !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_DATABASE_ID,
)(
  'd1-http',
  () => {
    let d1DataProvider: D1DataProvider
    let db: SqlDatabase
    let remult: Remult

    beforeAll(async () => {
      if (
        !CLOUDFLARE_ACCOUNT_ID ||
        !CLOUDFLARE_API_TOKEN ||
        !CLOUDFLARE_DATABASE_ID
      ) {
        throw new Error(
          'CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_DATABASE_ID not set',
        )
      }

      d1DataProvider = new D1DataProvider(
        new D1HttpClient({
          accountId: CLOUDFLARE_ACCOUNT_ID,
          apiToken: CLOUDFLARE_API_TOKEN,
          databaseId: CLOUDFLARE_DATABASE_ID,
        }),
      )
    })

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
          `drop table if exists ${db.wrapIdentifier(repo.metadata.dbName)}`,
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
  },
  15_000,
)
// NOTE: need to set this because the aggregation test "basic test" needs more time to make the multiple network roundtrips.
// for the array insert. Default vitest timeout is 5000ms. It looks like RepositoryImplementation does not do bulk insert
// unless data provider `isProxy`
