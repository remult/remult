import { Remult } from '../context'
import { Entity, EntityFilter, Field, Fields, Repository } from '../remult3'
import { KnexDataProvider } from '../../remult-knex'
import * as Knex from 'knex'
import { config } from 'dotenv'
import {
  testKnexPGSqlImpl,
  testMongo,
  testPostgresImplementation,
} from './backend-database-test-setup.backend-spec'
import { entityWithValidations } from '../shared-tests/entityWithValidations'
import { PostgresDataProvider } from '../../postgres'
import { MongoDataProvider } from '../../remult-mongo'
import { SqlDatabase } from '../data-providers/sql-database'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request'
import { RemultAsyncLocalStorage } from '../../src/context'
import { initAsyncHooks } from '../../server/initAsyncHooks'
import { remult } from '../remult-proxy'
import { describeClass } from '../remult3/DecoratorReplacer'
import { AsyncLocalStorage } from 'async_hooks'
config()

testPostgresImplementation(
  'default order by',
  async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    await s.update(1, { name: 'updated name' })
    expect((await s.find()).map((x) => x.myId)).toEqual([1, 2, 3, 4])
  },
  false,
)
testKnexPGSqlImpl(
  'default order by',
  async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    await s.update(1, { name: 'updated name' })
    expect((await s.find()).map((x) => x.myId)).toEqual([1, 2, 3, 4])
  },
  false,
)

testPostgresImplementation(
  'sql filter',
  async ({ createEntity }) => {
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
  },
  false,
)
testPostgresImplementation(
  'sql filter2',
  async ({ createEntity }) => {
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
  },
  false,
)
testKnexPGSqlImpl(
  'knex filter',
  async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: KnexDataProvider.rawFilter(async () => {
            return (build) =>
              build.whereIn(s.metadata.fields.myId.options.dbName, [1, 3])
          }),
        })
      ).length,
    ).toBe(2)
  },
  false,
)
testKnexPGSqlImpl(
  'knex filter2',
  async ({ createEntity }) => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            $or: [
              KnexDataProvider.rawFilter(async () => {
                return (build) =>
                  build.whereIn(s.metadata.fields.myId.options.dbName, [1, 3])
              }),
              {
                myId: 4,
              },
            ],
          },
        })
      ).length,
    ).toBe(3)
  },
  false,
)

testPostgresImplementation(
  'ensure schema with dbNames that have quotes',
  async ({ remult }) => {
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
  },
  false,
)

testPostgresImplementation(
  'work with native sql',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = SqlDatabase.getDb(remult)
    const r = await sql.execute(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe('4')
  },
  false,
)
testPostgresImplementation(
  'work with native sql2',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const sql = PostgresDataProvider.getDb(remult)
    const r = await sql.query(
      'select count(*) as c from ' + repo.metadata.options.dbName!,
    )
    expect(r.rows[0].c).toBe('4')
  },
  false,
)
testPostgresImplementation(
  'work with native sql3',
  async ({ remult, createEntity }) => {
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
  },
  false,
)

testKnexPGSqlImpl(
  'work with native knex',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult)
    const r = await knex(repo.metadata.options.dbName!).count()
    expect(r[0].count).toBe('4')
  },
  false,
)
testKnexPGSqlImpl(
  'work with native knex2',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    await remult.dataProvider.transaction(async (db) => {
      const sql = KnexDataProvider.getDb(new Remult(db))
      const r = await sql(repo.metadata.options.dbName!).count()
      expect(r[0].count).toBe('4')
    })
  },
  false,
)
testKnexPGSqlImpl(
  'work with native knex3',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult)
    const t = await dbNamesOf(repo)
    const r = await knex((await t).$entityName).select(t.myId, t.name)
    expect(r.length).toBe(4)
  },
  false,
)

testMongo(
  'work with native mongo',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const mongo = MongoDataProvider.getDb(remult)
    const r = await (
      await mongo.db.collection(repo.metadata.options.dbName!)
    ).countDocuments()
    expect(r).toBe(4)
  },
  false,
)

testKnexPGSqlImpl(
  'knex with filter',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult)
    const e = await dbNamesOf(repo)
    const r = await knex(e.$entityName)
      .count()
      .where(await KnexDataProvider.filterToRaw(repo, { myId: [1, 3] }))
    expect(r[0].count).toBe('2')
  },
  false,
)

testMongo(
  'work with native mongo and condition',
  async ({ remult, createEntity }) => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const mongo = MongoDataProvider.getDb(remult)
    const r = await (
      await mongo.db.collection(repo.metadata.options.dbName!)
    ).countDocuments(
      await MongoDataProvider.filterToRaw(repo, { myId: [1, 2] }),
    )
    expect(r).toBe(2)
  },
  false,
)

it('test async hooks and static remult', async () => {
  let gotException = true
  try {
    RemultAsyncLocalStorage.instance.getRemult()
    gotException = false
  } catch {}
  expect(gotException).toBe(true)
  RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(
    new AsyncLocalStorage(),
  )
  try {
    expect(RemultAsyncLocalStorage.instance.getRemult()).toBe(undefined)
    RemultAsyncLocalStorage.enable()
    try {
      remult.isAllowed(false)
      gotException = false
    } catch {}
    expect(gotException).toBe(true)
    const promises = []
    RemultAsyncLocalStorage.instance.run(new Remult(), () => {
      remult.user = { id: 'noam' }
      promises.push(
        new Promise((res) => {
          setTimeout(() => {
            expect(remult.user.id).toBe('noam')
            res({})
          }, 10)
        }),
      )
      RemultAsyncLocalStorage.instance.run(new Remult(), () => {
        remult.user = { id: 'yoni' }
        promises.push(
          new Promise((res) => {
            setTimeout(() => {
              expect(remult.user.id).toBe('yoni')
              res({})
            }, 10)
          }),
        )
      })
      promises.push(
        new Promise((res) => {
          setTimeout(() => {
            expect(remult.user.id).toBe('noam')
            res({})
          }, 10)
        }),
      )
    })
    await Promise.all(promises)
  } finally {
    RemultAsyncLocalStorage.disable()
    RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined)
  }
})
