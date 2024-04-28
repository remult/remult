import { describe, it, expect } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'
import { cast } from '../../core/src/isOfType.js'
import { entity } from '../tests/dynamic-classes.js'
import { Fields } from '../../core/index.js'
import { testMigrationScript } from '../tests/testHelper.js'

describe('Sql Lite', () => {
  knexTests(
    Knex.default({
      client: 'better-sqlite3',
      connection: {
        filename: ':memory:',
      },
    }),
    ({ getDb, createEntity }) => {
      it('test ddl', async () => {
        try {
          await cast(getDb(), 'execute').execute('drop table test')
        } catch {}
        await getDb().transaction(async (db1) => {
          const db = cast(db1, 'execute')

          await db.execute(
            'create table test (id integer primary key, val integer)',
          )
          await db.execute('insert into test (id,val) values (1,2)')
          const result = await db.execute('select * from test')
          expect(result.rows).toMatchInlineSnapshot(`
          [
            {
              "id": 1,
              "val": 2,
            },
          ]
        `)
        })
      })
      it('test primary key on multiple id column entity', async () => {
        const e = await createEntity(
          entity(
            't',
            {
              id: Fields.number(),
              id2: Fields.number(),
              name: Fields.string(),
            },
            {
              id: { id: true, id2: true },
            },
          ),
        )
        expect(
          await testMigrationScript(getDb(), (m) => m.createTable(e.metadata)),
        ).toMatchInlineSnapshot(
          "\"CREATE TABLE [t] ([id] decimal(18, 2) not null CONSTRAINT [t_id_default] DEFAULT '0', [id2] decimal(18, 2) not null CONSTRAINT [t_id2_default] DEFAULT '0', [name] nvarchar(255) not null CONSTRAINT [t_name_default] DEFAULT '', CONSTRAINT [t_pkey] PRIMARY KEY ([id], [id2]))\"",
        )
      })
    },
  )
})
