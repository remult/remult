import { describe } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'

describe('Sql Lite', () => {
  knexTests(
    Knex.default({
      client: 'better-sqlite3',
      connection: {
        filename: ':memory:',
      },
      //debug: true
    }),
  )
})
