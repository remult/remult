import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  SqlDatabase,
  dbNamesOf,
  describeClass,
  remult,
} from '../../core'
import {
  PostgresSchemaBuilder,
  createPostgresDataProvider,
} from '../../core/postgres'

//connection string is in a .env file placed in the `tests` folder with key `DATABASE_URL`
// if we don't have this, tests will be skipped
const connectionString = process.env['DATABASE_URL']

let db: SqlDatabase = undefined
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
