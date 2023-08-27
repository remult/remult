import { Remult, RemultAsyncLocalStorage } from '../context'
import { AsyncLocalStorage } from 'async_hooks'
import { KnexDataProvider, KnexSchemaBuilder } from '../../remult-knex'
import * as Knex from 'knex'
import { Db, MongoClient, MongoDBNamespace } from 'mongodb'
import { config } from 'dotenv'
import {
  createPostgresConnection,
  PostgresDataProvider,
  PostgresSchemaBuilder,
} from '../../postgres'
import { ClassType } from '../../classType'
import {
  addDatabaseToTest,
  dbTestWhatSignature,
  itWithFocus,
  testAll,
  TestDbs,
} from '../shared-tests/db-tests-setup'
import { describeClass } from '../remult3/DecoratorReplacer'
import { Entity, Fields } from '../remult3'
import { describe, it, expect, afterAll } from 'vitest'

KnexSchemaBuilder.logToConsole = false
PostgresSchemaBuilder.logToConsole = false
config()
function testKnexSqlImpl(knex: Knex.Knex, name: string) {
  return (key: string, what: dbTestWhatSignature, focus = false) => {
    itWithFocus(
      key + ' ' + name + ' - knex',
      async () => {
        let db = new KnexDataProvider(knex)
        let remult = new Remult(db)
        await what({
          db,
          remult,
          createEntity: async (entity: ClassType<any>) => {
            let repo = remult.repo(entity)
            await knex.schema.dropTableIfExists(await repo.metadata.getDbName())
            await db.ensureSchema([repo.metadata])
            return repo
          },
        })
      },
      focus,
    )
  }
}
const postgresConnection = process.env.DATABASE_URL
export const testKnexPGSqlImpl = postgresConnection
  ? testKnexSqlImpl(
      Knex.default({
        client: 'pg',
        connection: postgresConnection,
        //debug:true
      }),
      'postgres',
    )
  : () => {}

addDatabaseToTest(testKnexPGSqlImpl)
if (process.env['TESTS_SQL_SERVER'])
  addDatabaseToTest(
    testKnexSqlImpl(
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
      'sql server',
    ),
  )
if (process.env['TEST_SQL_LITE']||true)
  addDatabaseToTest(
    testKnexSqlImpl(
      Knex.default({
        client: 'better-sqlite3', // or 'better-sqlite3'
        connection: {
          filename: ':memory:',
        },
        //debug: true
      }),
      'sqlite3',
    ),
  )
if (process.env['TEST_MYSQL2'])
  addDatabaseToTest(
    testKnexSqlImpl(
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
      'mysql2',
    ),
  )

if (process.env['TEST_MYSQL'])
  addDatabaseToTest(
    testKnexSqlImpl(
      Knex.default({
        client: 'mysql',
        connection: {
          user: 'root',
          password: 'MASTERKEY',
          host: '127.0.0.1',
          database: 'test',
          port: 3307,
        },
        //debug: true
      }),
      'mysql',
    ),
  )

let pg = createPostgresConnection()
export function testPostgresImplementation(
  key: string,
  what: dbTestWhatSignature,
  focus = false,
) {
  if (!postgresConnection) return
  itWithFocus(
    key + ' - postgres',
    async () => {
      let db = await pg
      let remult = new Remult(db)

      await what({
        db,
        remult,
        createEntity: async (entity: ClassType<any>) => {
          let repo = remult.repo(entity)
          await db.execute(
            'drop table if exists ' + (await repo.metadata.getDbName()),
          )
          await db.ensureSchema([repo.metadata])
          return repo
        },
      })
    },
    focus,
  )
}
addDatabaseToTest(testPostgresImplementation)

import { Categories } from '../tests/remult-3-entities'
import { MongoDataProvider } from '../../remult-mongo'

export const testMongo = (() => {
  const mongoConnectionString = process.env['MONGO_TEST_URL'] //"mongodb://localhost:27017/local"
  if (!mongoConnectionString) return ()=>{}

  let client = new MongoClient(mongoConnectionString)
  let done: MongoClient
  let mongoDbPromise = client.connect().then((c) => {
    done = c
    return c.db('test')
  })

  afterAll(async () => {
    if (done) done.close()
  })

  return function testMongo(
    key: string,
    what: dbTestWhatSignature,
    focus = false,
  ) {
    itWithFocus(
      key + ' - mongo',
      async () => {
        let mongoDb = await mongoDbPromise
        let db = new MongoDataProvider(mongoDb, client)
        let remult = new Remult(db)
        await what({
          db,
          remult,
          createEntity: async (entity: ClassType<any>) => {
            let repo = remult.repo(entity)
            await mongoDb
              .collection(await repo.metadata.getDbName())
              .deleteMany({})

            return repo
          },
        })
      },
      focus,
    )
  }
})()
const MONGO_NO_TRANS_TEST_URL = process.env['MONGO_NO_TRANS_TEST_URL']

export const testMongoNoTrans = (() => {
  const mongoConnectionString = MONGO_NO_TRANS_TEST_URL
  if (!MONGO_NO_TRANS_TEST_URL) return ()=>{}

  let client = new MongoClient(mongoConnectionString)
  let done: MongoClient
  let mongoDbPromise = client.connect().then((c) => {
    done = c
    return c.db('test')
  })

  afterAll(async () => {
    if (done) done.close()
  })

  return function testMongo(
    key: string,
    what: dbTestWhatSignature,
    focus = false,
  ) {
    itWithFocus(
      key + ' - ' + TestDbs.mongoNoTrans,
      async () => {
        let mongoDb = await mongoDbPromise
        let db = new MongoDataProvider(mongoDb, client, {
          disableTransactions: true,
        })
        let remult = new Remult(db)
        await what({
          db,
          remult,
          createEntity: async (entity: ClassType<any>) => {
            let repo = remult.repo(entity)
            await mongoDb
              .collection(await repo.metadata.getDbName())
              .deleteMany({})

            return repo
          },
        })
      },
      focus,
    )
  }
})()
addDatabaseToTest(testMongo, TestDbs.mongo)
addDatabaseToTest(testMongoNoTrans, TestDbs.mongoNoTrans)

it('test mongo without transaction', async () => {
  if (!MONGO_NO_TRANS_TEST_URL) return
  const client = new MongoClient(MONGO_NO_TRANS_TEST_URL)
  await client.connect()
  const mongoDb = client.db('test')
  const db = new MongoDataProvider(mongoDb, client, {
    disableTransactions: true,
  })
  var remult = new Remult(db)
  const entity = class {
    id = 0
    title = ''
  }
  describeClass(entity, Entity('testNoTrans'), {
    id: Fields.number(),
    title: Fields.string(),
  })
  const repo = remult.repo(entity)
  for (const item of await repo.find()) {
    await repo.delete(item)
  }
  await repo.insert({ id: 1, title: 'a' })
  try {
    await db.transaction(async (dbWithTrans) => {
      await new Remult(dbWithTrans).repo(entity).insert({ id: 2, title: 'b' })
      throw 'Error'
    })
  } catch (err) {
    expect(err).toBe('Error')
  }
  expect(await repo.count()).toBe(2)
})

testMongoNoTrans(
  'transactions mongo no trans',
  async ({ db, createEntity }) => {
    let x = await createEntity(Categories)

    try {
      await db.transaction(async (db) => {
        let remult = new Remult(db)
        await remult.repo(Categories).insert({ categoryName: 'testing' })
        expect(await remult.repo(Categories).count()).toBe(1)
        throw 'Fail'
      })
    } catch (err: any) {
      expect(err).toBe('Fail')
    }
    expect(await x.count()).toBe(1)
  },
  false,
)
testMongoNoTrans(
  'test Dates',
  async ({ createEntity }) => {
    const c = class {
      id: number
      date: Date
    }
    describeClass(c, Entity('test_dates_on_mongo'), {
      id: Fields.integer(),
      date: Fields.date(),
    })
    const r = await createEntity(c)
    let x = await r.insert({ id: 1, date: new Date(1976, 5, 16) })
    const client = new MongoClient('mongodb://localhost:27017/local')
    await client.connect()
    const mongoDb = client.db('test')
    expect(
      (await mongoDb.collection(await r.metadata.getDbName()).findOne())
        .date instanceof Date,
    ).toBe(true)
    x.date = new Date(1978, 2, 15)
    await r.save(x)

    expect(
      (await mongoDb.collection(await r.metadata.getDbName()).findOne())
        .date instanceof Date,
    ).toBe(true)

    //let z = await r.save({ ...x, date: new Date(1978, 2, 15) })
  },
  false,
)
import '../shared-tests'
import { remult } from '../remult-proxy'
import { entityWithValidations } from '../shared-tests/entityWithValidations'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request'
import { SqlDatabase } from '../data-providers/sql-database'

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
