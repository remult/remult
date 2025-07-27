import type * as Knex from 'knex'
import { beforeAll, beforeEach, expect, it } from 'vitest'
import { allDbTests } from '.'
import { Entity, Fields, Remult, SqlDatabase, dbNamesOf } from '../../../core'
import type { ClassType } from '../../../core/classType'
import { KnexDataProvider, KnexSchemaBuilder } from '../../../core/remult-knex'
import { entityWithValidations } from './entityWithValidations'
import { DbTestProps } from './db-tests-props'
import { SqlDbTests } from './sql-db-tests'
import { DbTestOptions } from './db-tests.js'
KnexSchemaBuilder.logToConsole = false
export function knexTests(
  knex: Knex.Knex,
  otherTests?: (props: DbTestProps) => void,
  options?: DbTestOptions,
) {
  var db: KnexDataProvider
  let remult: Remult
  beforeAll(async () => {})
  beforeEach(() => {
    db = new KnexDataProvider(knex)
    remult = new Remult(db)
  })
  async function createEntity(entity: ClassType<any>) {
    let repo = remult.repo(entity)

    await knex.schema.dropTableIfExists(repo.metadata.dbName!)
    await db.ensureSchema([repo.metadata])
    return repo
  }
  allDbTests(
    {
      getDb() {
        return db
      },
      getRemult() {
        return remult
      },
      createEntity,
    },
    options,
  )
  SqlDbTests({
    doesNotSupportDdlTransactions:
      knex.client.config.client.startsWith('mysql'),
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity,
  })
  otherTests?.({
    getDb() {
      return db
    },
    getRemult() {
      return remult
    },
    createEntity,
  })
  function getKnexCount(r: any[]) {
    for (const key in r[0]) {
      if (Object.prototype.hasOwnProperty.call(r[0], key)) {
        const element = r[0][key]
        return +element
      }
    }
    return r[0]['']
  }

  it('knex with filter', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult.dataProvider)
    const e = await dbNamesOf(repo)
    expect(
      getKnexCount(
        await knex(e.$entityName)
          .count()
          .where(await KnexDataProvider.filterToRaw(repo, { myId: [1, 3] })),
      ),
    ).toBe(2)
  })
  it('work with native knex3', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult.dataProvider)
    const t = await dbNamesOf(repo)
    const r = await knex((await t).$entityName).select(t.myId, t.name)
    expect(r.length).toBe(4)
  })

  it('work with native knex', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const knex = KnexDataProvider.getDb(remult.dataProvider)
    const r = await knex(repo.metadata.dbName!).count()
    expect(getKnexCount(r)).toBe(4)
  })
  it('work with native knex2', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    await remult.dataProvider.transaction(async (db) => {
      const sql = KnexDataProvider.getDb(db)
      const r = await sql(repo.metadata.dbName!).count()
      expect(getKnexCount(r)).toBe(4)
    })
  })
  it('knex filter', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: KnexDataProvider.rawFilter(async () => {
            return (build) =>
              build.whereIn(s.metadata.fields.myId.dbName, [1, 3])
          }),
        })
      ).length,
    ).toBe(2)
  })
  it('knex filter2', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            $or: [
              KnexDataProvider.rawFilter(async () => {
                return (build) =>
                  build.whereIn(s.metadata.fields.myId.dbName, [1, 3])
              }),
              {
                myId: 4,
              },
            ],
          },
        })
      ).length,
    ).toBe(3)
  })
  it('default order by', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    await s.update(1, { name: 'updated name' })
    expect((await s.find()).map((x) => x.myId)).toEqual([1, 2, 3, 4])
  })
  it('test sql expression', async () => {
    let knex = KnexDataProvider.getDb(remult.dataProvider)

    @Entity('testSqlExpression')
    class testSqlExpression {
      @Fields.integer()
      a = 0
      @Fields.integer()
      b = 0
      @Fields.integer({
        sqlExpression: () => knex.ref('a') + '+' + knex.ref('b'),
      })
      c = 0
    }
    const r = await createEntity(testSqlExpression)
    const t = await r.insert([
      { a: 1, b: 5 },
      { a: 2, b: 1 },
    ])
    expect(t[0].c).toBe(6)
    expect(await r.count({ c: 3 })).toBe(1)
    expect((await r.find({ orderBy: { c: 'desc' } }))[0].c).toBe(6)
  })
}
