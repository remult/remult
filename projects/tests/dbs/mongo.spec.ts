import type { Db } from 'mongodb'
import { MongoClient } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Fields, Remult, dbNamesOf } from '../../core'
import type { ClassType } from '../../core/classType'
import { MongoDataProvider } from '../../core/remult-mongo'
import { entityWithValidations } from './shared-tests/entityWithValidations'
import { allDbTests } from './shared-tests'

const mongoConnectionString = process.env['MONGO_TEST_URL_DISABLE'] //"mongodb://localhost:27017/local"

describe.skipIf(!mongoConnectionString)('mongo with Transaction', () => {
  let db: MongoDataProvider
  let client: MongoClient
  let mongoDb: Db
  let remult: Remult

  async function createEntity(entity: ClassType<any>) {
    let repo = remult.repo(entity)
    await mongoDb
      .collection((await dbNamesOf(repo.metadata)).$entityName)
      .deleteMany({})

    return repo
  }

  beforeAll(async () => {
    client = await new MongoClient(mongoConnectionString!).connect()
    mongoDb = await client.db('test')
    db = new MongoDataProvider(mongoDb, client)
  })
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
      skipAutoIncrement: true,
    },
  )
  it('work with native mongo and condition', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const mongo = MongoDataProvider.getDb(remult.dataProvider)
    const r = await (
      await mongo.db.collection(repo.metadata.dbName!)
    ).countDocuments(
      await MongoDataProvider.filterToRaw(repo, { myId: [1, 2] }),
    )
    expect(r).toBe(2)
  })
  it('work with native mongo', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const mongo = MongoDataProvider.getDb(remult.dataProvider)
    const r = await (
      await mongo.db.collection(repo.metadata.dbName!)
    ).countDocuments()
    expect(r).toBe(4)
  })
})
