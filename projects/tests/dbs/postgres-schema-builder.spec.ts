import { beforeEach, describe, expect, it } from 'vitest'
import * as Knex from 'knex'
import {
  Entity,
  Field,
  Fields,
  Relations,
  Remult,
  SqlDatabase,
  ValueListFieldType,
  dbNamesOf,
  describeClass,
  remult,
  type FieldMetadata,
} from '../../core'
import {
  PostgresSchemaBuilder,
  createPostgresDataProvider,
  postgresColumnSyntax,
} from '../../core/postgres'
import { buildColumn } from '../../core/remult-knex'
import { SqliteCoreDataProvider } from '../../core/remult-sqlite-core'
import { DuckDBDataProvider } from '../../core/remult-duckdb'

//connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
// if we don't have this, tests will be skipped
const connectionString = process.env['DATABASE_URL']

let db: SqlDatabase = undefined!
PostgresSchemaBuilder.logToConsole = false
SqlDatabase.LogToConsole = false

const schemas = ['public', 'not_public']

describe.skipIf(!connectionString)(
  'Test postgres schema builder with quoted names',
  () => {
    beforeEach(async () => {
      db = await createPostgresDataProvider({
        caseInsensitiveIdentifiers: true,
      }) //connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
      remult.dataProvider = db

      // clean up the test database
      for (const schema of schemas) {
        await db.execute(`DROP SCHEMA if exists ${schema} CASCADE`)
        await db.execute(`CREATE SCHEMA ${schema};`)
      }
    })

    it('create table with capitals', async () => {
      @Entity('task', { dbName: '"Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)

      const t = await dbNamesOf(repo, (x) => x)
      expect(t.$entityName).toBe('"Task"')

      var sb = new PostgresSchemaBuilder(db)
      await sb.createIfNotExist(repo.metadata)
      await repo.insert({ id: '1', name: 'u1' })

      expect(await repo.find()).toMatchInlineSnapshot(`
      [
        Task {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      const result = await db.execute(
        `SELECT table_name, table_schema FROM information_schema.tables WHERE table_name='Task';`,
      )
      expect(result.rows).toMatchInlineSnapshot(`
      [
        {
          "table_name": "Task",
          "table_schema": "public",
        },
      ]
    `)
    })

    it('create 2 tables w and wo schema specification - only one should be created', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: '"Task"' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public."Task"' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'public."Task"',
      )
      await sb.createIfNotExist(repo2.metadata)
      await repo2.insert({ id: '2', name: 'u2' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('Adding column', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: '"Task"' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public."Task"' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
        @Fields.string({ dbName: '"firstName"', allowNull: true })
        firstName = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'public."Task"',
      )
      await sb.ensureSchema([repo1.metadata, repo2.metadata])

      await repo2.insert({ id: '2', name: 'u2', firstName: 'yop' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "firstName": null,
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "firstName": "yop",
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('schema builder with default schema', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')
      @Entity('task', { dbName: '"Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('not_public')
    })

    it('schema builder with default schema & overwritten at entity level', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')

      @Entity('task', { dbName: 'public."Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('public')
    })
  },
)
describe.skipIf(!connectionString)(
  'Test postgres schema builder with auto quoted names',
  () => {
    beforeEach(async () => {
      db = await createPostgresDataProvider() //connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
      remult.dataProvider = db

      // clean up the test database
      for (const schema of schemas) {
        await db.execute(`DROP SCHEMA if exists ${schema} CASCADE`)
        await db.execute(`CREATE SCHEMA ${schema};`)
      }
    })

    it('create table with capitals', async () => {
      @Entity('task', { dbName: 'Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)

      const t = await dbNamesOf(repo, db.wrapIdentifier)
      expect(t.$entityName).toBe('"Task"')

      var sb = new PostgresSchemaBuilder(db)
      await sb.createIfNotExist(repo.metadata)
      await repo.insert({ id: '1', name: 'u1' })

      expect(await repo.find()).toMatchInlineSnapshot(`
      [
        Task {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      const result = await db.execute(
        `SELECT table_name, table_schema FROM information_schema.tables WHERE table_name='Task';`,
      )
      expect(result.rows).toMatchInlineSnapshot(`
      [
        {
          "table_name": "Task",
          "table_schema": "public",
        },
      ]
    `)
    })

    it('create 2 tables w and wo schema specification - only one should be created', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: 'Task' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public.Task' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe('public.Task')
      await sb.createIfNotExist(repo2.metadata)
      await repo2.insert({ id: '2', name: 'u2' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('Adding column', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: 'Task' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public.Task' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
        @Fields.string({ allowNull: true })
        firstName = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe('public.Task')
      await sb.ensureSchema([repo1.metadata, repo2.metadata])

      await repo2.insert({ id: '2', name: 'u2', firstName: 'yop' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "firstName": null,
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "firstName": "yop",
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('schema builder with default schema', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')
      @Entity('task', { dbName: 'Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('not_public')
    })
    it('wrap woks good with schema', () => {
      expect(db.wrapIdentifier('public.Task')).toBe('"public"."Task"')
    })

    it('schema builder with default schema & overwritten at entity level', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')

      @Entity('task', { dbName: 'public.Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('public')
    })
  },
)
describe.skipIf(!connectionString)(
  'Test postgres schema builder with quoted names and auto quoted names',
  () => {
    beforeEach(async () => {
      db = await createPostgresDataProvider({}) //connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
      remult.dataProvider = db

      // clean up the test database
      for (const schema of schemas) {
        await db.execute(`DROP SCHEMA if exists ${schema} CASCADE`)
        await db.execute(`CREATE SCHEMA ${schema};`)
      }
    })

    it('create table with capitals', async () => {
      @Entity('task', { dbName: '"Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)

      const t = await dbNamesOf(repo, (x) => x)
      expect(t.$entityName).toBe('"Task"')

      var sb = new PostgresSchemaBuilder(db)
      await sb.createIfNotExist(repo.metadata)
      await repo.insert({ id: '1', name: 'u1' })

      expect(await repo.find()).toMatchInlineSnapshot(`
      [
        Task {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      const result = await db.execute(
        `SELECT table_name, table_schema FROM information_schema.tables WHERE table_name='Task';`,
      )
      expect(result.rows).toMatchInlineSnapshot(`
      [
        {
          "table_name": "Task",
          "table_schema": "public",
        },
      ]
    `)
    })

    it('create 2 tables w and wo schema specification - only one should be created', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: '"Task"' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public."Task"' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'public."Task"',
      )
      await sb.createIfNotExist(repo2.metadata)
      await repo2.insert({ id: '2', name: 'u2' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('Adding column', async () => {
      var sb = new PostgresSchemaBuilder(db)
      // Task 1
      @Entity('task', { dbName: '"Task"' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'public."Task"' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
        @Fields.string({ dbName: '"firstName"', allowNull: true })
        firstName = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'public."Task"',
      )
      await sb.ensureSchema([repo1.metadata, repo2.metadata])

      await repo2.insert({ id: '2', name: 'u2', firstName: 'yop' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "firstName": null,
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "firstName": "yop",
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('schema builder with default schema', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')
      @Entity('task', { dbName: '"Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('not_public')
    })
    it('test correct wrapping', () =>
      expect(db.wrapIdentifier('public."Task"')).toBe('"public"."Task"'))

    it('schema builder with default schema & overwritten at entity level', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')

      @Entity('task', { dbName: 'public."Task"' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('public')
    })
  },
)
describe.skipIf(!connectionString)(
  'Test postgres schema builder with schema',
  () => {
    beforeEach(async () => {
      db = await createPostgresDataProvider({
        schema: 'test_other_schema',
      }) //connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
      remult.dataProvider = db

      // clean up the test database
      for (const schema of [...schemas, 'test_other_schema']) {
        await db.execute(`DROP SCHEMA if exists ${schema} CASCADE`)
        await db.execute(`CREATE SCHEMA ${schema};`)
      }
    })

    it('create table with capitals', async () => {
      @Entity('task', { dbName: 'Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)

      const t = await dbNamesOf(repo, db.wrapIdentifier)
      expect(t.$entityName).toBe('"Task"')

      var sb = new PostgresSchemaBuilder(db)
      await sb.createIfNotExist(repo.metadata)
      await repo.insert({ id: '1', name: 'u1' })

      expect(await repo.find()).toMatchInlineSnapshot(`
      [
        Task {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      const result = await db.execute(
        `SELECT table_name, table_schema FROM information_schema.tables WHERE table_name='Task';`,
      )
      expect(result.rows).toMatchInlineSnapshot(`
      [
        {
          "table_name": "Task",
          "table_schema": "test_other_schema",
        },
      ]
    `)
    })

    it('create 2 tables w and wo schema specification - only one should be created', async () => {
      var sb = new PostgresSchemaBuilder(db, 'test_other_schema')
      // Task 1
      @Entity('task', { dbName: 'Task' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'test_other_schema.Task' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'test_other_schema.Task',
      )
      await sb.createIfNotExist(repo2.metadata)
      await repo2.insert({ id: '2', name: 'u2' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('Adding column', async () => {
      var sb = new PostgresSchemaBuilder(db, 'test_other_schema')
      // Task 1
      @Entity('task', { dbName: 'Task' })
      class Task1 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo1 = remult.repo(Task1)
      // expect((await dbNamesOf(repo1)).$entityName).toBe('"Task"')
      await sb.createIfNotExist(repo1.metadata)
      await repo1.insert({ id: '1', name: 'u1' })
      expect(await repo1.find()).toMatchInlineSnapshot(`
      [
        Task1 {
          "id": "1",
          "name": "u1",
        },
      ]
    `)

      // Task 2
      @Entity('task', { dbName: 'test_other_schema.Task' })
      class Task2 {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
        @Fields.string({ allowNull: true })
        firstName = ''
      }
      const repo2 = remult.repo(Task2)
      expect((await dbNamesOf(repo2, (x) => x)).$entityName).toBe(
        'test_other_schema.Task',
      )
      await sb.ensureSchema([repo1.metadata, repo2.metadata])

      await repo2.insert({ id: '2', name: 'u2', firstName: 'yop' })
      expect(await repo2.find()).toMatchInlineSnapshot(`
      [
        Task2 {
          "firstName": null,
          "id": "1",
          "name": "u1",
        },
        Task2 {
          "firstName": "yop",
          "id": "2",
          "name": "u2",
        },
      ]
    `)
    })

    it('schema builder with default schema', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')
      @Entity('task', { dbName: 'Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('not_public')
    })
    it('wrap woks good with schema', () => {
      expect(db.wrapIdentifier('public.Task')).toBe('"public"."Task"')
    })

    it('schema builder with default schema & overwritten at entity level', async () => {
      var sb = new PostgresSchemaBuilder(db, 'not_public')

      @Entity('task', { dbName: 'public.Task' })
      class Task {
        @Fields.string()
        id = ''
        @Fields.string()
        name = ''
      }

      const repo = remult.repo(Task)
      await sb.createIfNotExist(repo.metadata)
      const result = await db.execute(
        `SELECT table_schema FROM information_schema.tables WHERE table_name = 'Task';`,
      )
      expect(result.rows[0].table_schema).toBe('public')
    })
  },
)

describe('allowNull by field type', () => {
  @ValueListFieldType()
  class Level {
    static low = new Level('low')
    constructor(public id: string) {}
  }
  @ValueListFieldType()
  class Rank {
    static first = new Rank(1)
    constructor(public id: number) {}
  }
  @Entity('allowNullCat')
  class Cat {
    @Fields.integer()
    id = 0
  }
  @Entity('allowNullKinds', { id: 'code' })
  class Kinds {
    @Fields.string({ valueConverter: { fieldTypeInDb: 'uuid' } })
    code = ''
    @Fields.string()
    s = ''
    @Fields.number()
    n = 0
    @Fields.integer()
    i = 0
    @Fields.number({ valueConverter: { fieldTypeInDb: 'decimal(16,8)' } })
    d = 0
    @Fields.boolean()
    b = false
    @Field(() => Level)
    level = Level.low
    @Field(() => Rank)
    rank = Rank.first
    @Relations.toOne(() => Cat)
    cat?: Cat
    @Fields.object()
    obj = {}
    @Fields.date()
    at?: Date
    @Fields.dateOnly()
    day?: Date
    @Fields.json()
    data?: unknown
    @Fields.string({ valueConverter: { fieldTypeInDb: 'citext' } })
    email = ''
    @Fields.string({ allowNull: true })
    note: string | null = null
    @Fields.date({ allowNull: false })
    strictAt = new Date()
    @Fields.dateOnly({ allowNull: false })
    strictDay = new Date()
    @Fields.json({ allowNull: false })
    strictData = {}
    @Fields.string({
      allowNull: false,
      valueConverter: { fieldTypeInDb: 'citext' },
    })
    strictEmail = ''
  }
  @Entity('allowNullOthers')
  class Others {
    @Fields.id()
    id = ''
    @Fields.autoIncrement()
    seq = 0
    @Fields.string({ valueConverter: { fieldTypeInDb: 'dbid' } })
    ref = ''
  }
  const r = new Remult()
  const meta = r.repo(Kinds).metadata
  const fields = meta.fields.toArray().filter((f) => f !== meta.fields.code)
  const knex = Knex.default({ client: 'pg' })
  const sqlite = new SqliteCoreDataProvider(undefined!, undefined!)
  const duckdb = new DuckDBDataProvider(undefined!)
  const createColumnSql: [string, (f: FieldMetadata) => string][] = [
    ['postgres', (f) => postgresColumnSyntax(f, f.key)],
    [
      'knex',
      (f) =>
        knex.schema
          .createTable('t', (b) => buildColumn(f, f.key, b))
          .toString(),
    ],
    [
      'knex, json as text',
      (f) =>
        knex.schema
          .createTable('t', (b) => buildColumn(f, f.key, b, false))
          .toString(),
    ],
    ['sqlite', (f) => sqlite.addColumnSqlSyntax(f, f.key, false)],
    ['duckdb', (f) => duckdb.addColumnSqlSyntax(f, f.key, false)],
  ]

  it('defaults to true when the type has no default value in the db', () => {
    expect(Object.fromEntries(fields.map((f) => [f.key, f.allowNull]))).toEqual(
      {
        s: false,
        n: false,
        i: false,
        d: false,
        b: false,
        level: false,
        rank: false,
        cat: false,
        obj: false,
        at: true,
        day: true,
        data: true,
        email: true,
        note: true,
        strictAt: false,
        strictDay: false,
        strictData: false,
        strictEmail: false,
      },
    )
  })
  it.each(createColumnSql)(
    'is true exactly when %s creates the column nullable',
    (_, sql) => {
      for (const f of fields)
        expect(sql(f).includes('not null'), f.key).toBe(!f.allowNull)
    },
  )
  it.each([
    ['postgres', (f: FieldMetadata) => postgresColumnSyntax(f, f.key, true)],
    [
      'knex',
      (f: FieldMetadata) =>
        knex.schema
          .alterTable('t', (b) => buildColumn(f, f.key, b, true, true))
          .toString(),
    ],
    ['sqlite', (f: FieldMetadata) => sqlite.addColumnSqlSyntax(f, f.key, true)],
  ])('%s adds a column with no default value nullable', (_, sql) => {
    const { strictAt, strictDay, strictData, strictEmail } = meta.fields
    for (const f of [strictAt, strictDay, strictData, strictEmail])
      expect(sql(f), f.key).not.toContain('not null')
  })
  it('sqlite gives default 0 only to a number', () => {
    const { d, strictDay, strictData, strictEmail } = meta.fields
    expect(sqlite.addColumnSqlSyntax(d, 'd', false)).toContain('default 0')
    for (const f of [strictDay, strictData, strictEmail])
      expect(sqlite.addColumnSqlSyntax(f, f.key, false), f.key).not.toContain(
        'default',
      )
  })
  it('is false on an id, as a primary key rejects NULL', () => {
    expect(meta.fields.code.allowNull).toBe(false)
  })
  it('is false on an autoincrement and on a Mongo dbid', () => {
    const others = r.repo(Others).metadata.fields
    expect([others.seq.allowNull, others.ref.allowNull]).toEqual([false, false])
  })
})
