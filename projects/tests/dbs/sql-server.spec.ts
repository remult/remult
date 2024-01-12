import { describe, it, expect } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'
import { createEntity as createEntityClass } from '../tests/dynamic-classes'
import { Fields } from '../../core'

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
    ({ createEntity }) => {
      it('test long number', async () => {
        const r = await createEntity(
          createEntityClass('test', {
            id: Fields.integer(),
            val: Fields.number({
              valueConverter: {
                fieldTypeInDb: 'decimal(18,2)',
              },
            }),
          }),
        )
        await r.insert({ id: 1, val: 123456789 })
        expect(await r.find()).toMatchInlineSnapshot(`
          [
            r {
              "id": 1,
              "val": 123456789,
            },
          ]
        `)
      })
    },
  )
})
