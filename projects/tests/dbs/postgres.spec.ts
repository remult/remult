import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Entity,
  Fields,
  Relations,
  Remult,
  SqlDatabase,
  describeClass,
} from '../../core'
import {
  PostgresDataProvider,
  PostgresSchemaBuilder,
  createPostgresConnection,
} from '../../core/postgres'

import * as Knex from 'knex'
import type { ClassType } from '../../core/classType'
import { Categories } from '../tests/remult-3-entities'
import { allDbTests } from './shared-tests'
import { entityWithValidations } from './shared-tests/entityWithValidations'
import { knexTests } from './shared-tests/test-knex'

PostgresSchemaBuilder.logToConsole = false
const postgresConnection = process.env.DATABASE_URL
describe.skipIf(!postgresConnection)('Postgres Tests', () => {
  var db: SqlDatabase
  let remult: Remult
  beforeAll(async () => {
    db = await createPostgresConnection()
  })
  beforeEach(() => {
    remult = new Remult(db)
  })

  async function createEntity(entity: ClassType<any>) {
    let repo = remult.repo(entity)
    await db.execute(
      'drop table if exists ' + (await repo.metadata.getDbName()),
    )
    await db.ensureSchema([repo.metadata])
    return repo
  }
  allDbTests({
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity,
  })

  it('ensure schema with dbNames that have quotes', async () => {
    const db = SqlDatabase.getDb(remult)
    const entityName = 'test_naming'
    await db.execute('Drop table if exists ' + entityName)
    await db.execute(`create table ${entityName}(id int,"createdAt" Date)`)
    const ent = class {
      id = 0
      createdAt = new Date()
      oneMoreColumn = 0
    }
    describeClass(ent, Entity(entityName), {
      id: Fields.integer(),
      createdAt: Fields.createdAt({ dbName: '"createdAt"' }),
      oneMoreColumn: Fields.integer(),
    })
    await db.ensureSchema([remult.repo(ent).metadata])
    await remult.repo(ent).insert({ id: 1, oneMoreColumn: 8 })
    expect((await remult.repo(ent).findFirst()).createdAt.getFullYear()).toBe(
      new Date().getFullYear(),
    )
  })

  it('ensure on not_public schema', async () => {
    const db = SqlDatabase.getDb(remult)
    const entityName = 'auth.test_not_public'
    // reset the state of the database before the test (make sure we don't have the schema and table)
    await db.execute('Drop table if exists ' + entityName)
    await db.execute('DROP SCHEMA IF EXISTS auth')
    // the test is really starting here
    const ent = class {
      id = 0
      createdAt = new Date()
      oneMoreColumn = 0
    }
    describeClass(ent, Entity(entityName), {
      id: Fields.integer(),
      createdAt: Fields.createdAt({ dbName: '"createdAt"' }),
      oneMoreColumn: Fields.integer(),
    })
    await db.ensureSchema([remult.repo(ent).metadata])
    await remult.repo(ent).insert({ id: 1, oneMoreColumn: 8 })
    expect((await remult.repo(ent).findFirst()).createdAt.getFullYear()).toBe(
      new Date().getFullYear(),
    )
  })

  it('ensure constrains toOne', async () => {
    const db = SqlDatabase.getDb(remult)
    const tableTask = '"tasks_constrains_toOne"'
    const tableCategory = '"tasks_constrains_toOne"'
    const entitiesName = [tableTask, tableCategory]
    // reset the state of the database before the test
    for (const entityName of entitiesName) {
      await db.execute('Drop table if exists ' + entityName)
    }
    // the test is really starting here
    const Category = class {
      id = 0
    }
    const Task = class {
      id = 0
      category = new Category()
    }

    describeClass(Task, Entity(tableTask), {
      id: Fields.integer(),
      category: Relations.toOne(() => Category, { defaultIncluded: true }),
    })
    describeClass(Category, Entity(tableCategory), {
      id: Fields.integer(),
    })
    await db.ensureSchema([
      remult.repo(Task).metadata,
      remult.repo(Category).metadata,
    ])
    const cate7 = await remult.repo(Category).insert({ id: 7 })
    await remult.repo(Task).insert({ id: 1, category: cate7 })
    expect(await remult.repo(Task).findFirst()).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "id": 7,
        },
        "id": 1,
      }
    `)
    try {
      await remult.repo(Category).delete(7)
    } catch (error) {
      expect(error.message).toMatchInlineSnapshot(
        '"update or delete on table \\"categories_constrains\\" violates foreign key constraint \\"fk_tasks_constrains_category_categories_constrains_id\\" on table \\"tasks_constrains\\""',
      )
    }
    // all data should still be here, because of the error
    expect(await remult.repo(Task).findFirst()).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "id": 7,
        },
        "id": 1,
      }
    `)
  })

  it('work with native sql', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = SqlDatabase.getDb(remult)
    const r = await sql.execute(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe('4')
  })
  it('work with native sql2', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = PostgresDataProvider.getDb(remult)
    const r = await sql.query(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe('4')
  })
  it('work with native sql3', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    await SqlDatabase.getDb(remult)
      ._getSourceSql()
      .transaction(async (x) => {
        const sql = PostgresDataProvider.getDb(new Remult(new SqlDatabase(x)))
        const r = await sql.query(
          'select count(*) as c from ' + repo.metadata.options.dbName!,
        )
        expect(r.rows[0].c).toBe('4')
      })
  })
  it('default order by', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    await s.update(1, { name: 'updated name' })
    expect((await s.find()).map((x) => x.myId)).toEqual([1, 2, 3, 4])
  })

  it('sql filter', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: SqlDatabase.rawFilter(async (build) => {
            build.sql = s.metadata.fields.myId.options.dbName + ' in (1,3)'
          }),
        })
      ).length,
    ).toBe(2)
  })
  it('sql filter2', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            $or: [
              SqlDatabase.rawFilter(async (build) => {
                build.sql = s.metadata.fields.myId.options.dbName + ' in (1,3)'
              }),
              {
                myId: 2,
              },
            ],
          },
        })
      ).length,
    ).toBe(3)
  })
  it('test column error', async () => {
    const c = await createEntity(Categories)
    await c.insert([{ categoryName: 'a', id: 1 }])
    try {
      await remult.repo(testErrorInFromDb).find()
    } catch (err) {
      expect(err.message).toContain('categoryName')
    }
  })
})

describe.skipIf(!postgresConnection)('Postgres Knex', () => {
  knexTests(
    Knex.default({
      client: 'pg',
      connection: postgresConnection,
      //debug:true
    }),
  )
})

@Entity('Categories')
class testErrorInFromDb {
  @Fields.integer({ dbName: 'CategoryID' })
  id = 0
  @Fields.string({
    valueConverter: {
      fromDb: (x) => {
        throw 'error'
      },
    },
  })
  categoryName = ''
}
