import { describe, it, expect } from 'vitest'
import * as Knex from 'knex'
import { knexTests } from './shared-tests/test-knex'
import { entity as createEntityClass, entity } from '../tests/dynamic-classes'
import { Entity, Fields, type DataProvider } from '../../core'
import type {
  CanBuildMigrations,
  MigrationBuilder,
} from '../../core/migrations/migration-types.js'
import { cast } from '../../core/src/isOfType.js'
import { testMigrationScript } from '../tests/testHelper.js'

describe.skipIf(!process.env['TESTS_SQL_SERVER'])('Knex Sql Server', () => {
  knexTests(
    Knex.default({
      client: 'mssql',
      //  debug: true,
      connection: {
        server: '127.0.0.1',
        database: 'test2',
        user: 'sa',
        password: 'MASTERKEY',
        options: {
          enableArithAbort: true,
          encrypt: false,
          // instanceName: 'sqlexpress',
        },
      },
    }),
    ({ createEntity, getDb, getRemult }) => {
      it('test knex storage', async () => {
        @Entity('my')
        class MyEntity {
          @Fields.string()
          name = ''
          @Fields.json()
          json = []
          @Fields.object()
          object = []
        }
        const e = getRemult().repo(MyEntity).metadata

        expect(
          await testMigrationScript(getDb(), (m) =>
            m.addColumn(e, e.fields.object),
          ),
        ).toMatchInlineSnapshot(
          '"ALTER TABLE [my] ADD [object] nvarchar(max) not null CONSTRAINT [my_object_default] DEFAULT \'\'"',
        )
        expect(
          await testMigrationScript(getDb(), (m) =>
            m.addColumn(e, e.fields.name),
          ),
        ).toMatchInlineSnapshot(
          '"ALTER TABLE [my] ADD [name] nvarchar(255) not null CONSTRAINT [my_name_default] DEFAULT \'\'"',
        )
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
      it('test long sql statement', async () => {
        @Entity('longStatement', {
          sqlExpression: () => `(select 1 id) x`,
        })
        class longStatement {
          @Fields.number()
          id = ''
        }
        var r = await createEntity(longStatement)
        expect(await r.find()).toMatchInlineSnapshot(`
          [
            longStatement {
              "id": 1,
            },
          ]
        `)
      })
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
            test {
              "id": 1,
              "val": 123456789,
            },
          ]
        `)
      })
    },
  )
})
