import { describe } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'

describe.skipIf(!process.env['TEST_MYSQL'])('mysql', () => {
  knexTests(
    Knex.default({
      client: 'mysql',
      connection: {
        user: 'root',
        password: 'MASTERKEY',
        host: '127.0.0.1',
        database: 'test',
        port: 36061,
      },
      //debug: true
    }),
  )
})

describe.skipIf(!process.env['TEST_MYSQL2'])('mysql2', () => {
  knexTests(
    Knex.default({
      client: 'mysql2',
      connection: {
        user: 'root',
        password: 'MASTERKEY',
        host: '127.0.0.1',
        database: 'test',
      },
      //debug: true
    }),
  )
})
