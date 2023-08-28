import { describe } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'

describe.skipIf(!process.env['TESTS_SQL_SERVER'])('Knex Sql Server', () => {
  knexTests(
    Knex.default({
      client: 'mssql',
      connection: {
        server: '127.0.0.1',
        database: 'test2',
        user: 'sa',
        password: 'MASTERKEY',
        options: {
          enableArithAbort: true,
          encrypt: false,
          instanceName: 'sqlexpress',
        },
      }, //,debug: true
    }),
  )
})
