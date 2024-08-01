import { describe, it, expect } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'
import { KnexDataProvider } from '../../core/remult-knex'

describe.skipIf(!process.env['TEST_MYSQL'])('mysql', () => {
  knexTests(
    Knex.default({
      client: 'mysql',
      connection: {
        user: 'root',
        password: 'MASTERKEY',
        host: '127.0.0.1',
        database: 'test',
        //      port: 3307,
      },
      //debug: true
    }),
    (props) => {
      it('test json', async () => {
        const db = props.getDb() as KnexDataProvider
        await db.knex.schema.dropTableIfExists('testJson')

        await db.knex.schema.createTable('testJson', (t) => {
          t.integer('id')
          t.json('js')
        })
        await db.knex('testJson').insert({ id: 1, js: { a: 1, b: 2 } })
        expect(await db.knex('testJson').where({ id: 1 }).first())
          .toMatchInlineSnapshot(`
          RowDataPacket {
            "id": 1,
            "js": "{"a": 1, "b": 2}",
          }
        `)
      })
    },
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
    (props) => {
      it('test json', async () => {
        const db = props.getDb() as KnexDataProvider
        await db.knex.schema.dropTableIfExists('testJson')

        await db.knex.schema.createTable('testJson', (t) => {
          t.integer('id')
          t.json('js')
        })
        await db
          .knex('testJson')
          .insert({ id: 1, js: JSON.stringify({ a: 1, b: 2 }) })
        expect(await db.knex('testJson').where({ id: 1 }).first())
          .toMatchInlineSnapshot(`
            {
              "id": 1,
              "js": {
                "a": 1,
                "b": 2,
              },
            }
          `)
        await db
          .knex('testJson')
          .update({ js: JSON.stringify({ a: 11, b: 22 }) })
          .where({ id: 1 })
        expect(await db.knex('testJson').where({ id: 1 }).first())
          .toMatchInlineSnapshot(`
          {
            "id": 1,
            "js": {
              "a": 11,
              "b": 22,
            },
          }
        `)
      })
    },
  )
})
