import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { allDbTests } from './shared-tests'
import { MongoDataProvider } from '../../core/remult-mongo'
import type { Db } from 'mongodb'
import { MongoClient } from 'mongodb'
import { Entity, Fields, Remult, describeClass } from '../../core'
import type { ClassType } from '../../core/classType'
import { Categories } from '../tests/remult-3-entities'

const mongoConnectionStringWithoutTransaction =
  process.env['MONGO_NO_TRANS_TEST_URL'] //"mongodb://localhost:27017/local"
describe.skipIf(!mongoConnectionStringWithoutTransaction)(
  'mongo without Transaction',
  () => {
    let db: MongoDataProvider
    let client: MongoClient
    let mongoDb: Db
    let remult: Remult
    beforeAll(async () => {
      client = await new MongoClient(
        mongoConnectionStringWithoutTransaction,
      ).connect()
      mongoDb = await client.db('test')
      db = new MongoDataProvider(mongoDb, client, {
        disableTransactions: true,
      })
    })
    async function createEntity(entity: ClassType<any>) {
      let repo = remult.repo(entity)
      await mongoDb.collection(await repo.metadata.getDbName()).deleteMany({})

      return repo
    }
    afterAll(async () => {
      if (client) await client.close()
    })
    beforeEach(() => {
      remult = new Remult(db)
    })
    allDbTests(
      {
        getDb: () => db,
        getRemult: () => remult,
        createEntity,
      },
      {
        excludeTransactions: true,
        doesNotWorkForMongoNeedToInvestigate: true,
      },
    )
    it('test mongo without transaction', async () => {
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
          await new Remult(dbWithTrans)
            .repo(entity)
            .insert({ id: 2, title: 'b' })
          throw 'Error'
        })
      } catch (err) {
        expect(err).toBe('Error')
      }
      expect(await repo.count()).toBe(2)
    })

    it('transactions mongo no trans', async () => {
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
    })
    it('test Dates', async () => {
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
    })
  },
)
