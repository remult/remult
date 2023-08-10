import { Remult } from '../context'
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

export const testKnexPGSqlImpl = testKnexSqlImpl(
  Knex.default({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    //debug:true
  }),
  'postgres',
)

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
if (true)
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
export const mySqlTest = addDatabaseToTest(
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

if (false)
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
export const testMongoNoTrans = (() => {
  const mongoConnectionString = 'mongodb://localhost:27017/local'

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
  const client = new MongoClient('mongodb://localhost:27017/local')
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
