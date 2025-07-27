import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InMemoryDataProvider } from '../../core/src//data-providers/in-memory-database'
import { Entity, EntityBase, Fields, SqlDatabase } from '../../core'
import { describeClass } from '../../core/src/remult3/classDescribers'
import { Remult } from '../../core/src/context'
import { dbNamesOf } from '../../core/src/filter/filter-consumer-bridge-to-sql-request'
import { remult } from '../../core/src/remult-proxy'
import { actionInfo } from '../../core/internals'
import { createId } from '@paralleldrive/cuid2'

describe('test server expression value', () => {
  beforeEach(() => {
    actionInfo.runningOnServer = true
  })
  afterEach(() => {
    actionInfo.runningOnServer = false
  })
  it('test basics create', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    testServerExpression.testVal = 1
    testServerExpression.testVal2 = 11
    let r = c.repo(testServerExpression).create()
    r.code = 5
    await r._.save()
    expect(r.test).toBe(1)
    expect(r.testPromise).toBe(11)
    expect(testServerExpression.testVal).toBe(2)
    expect(testServerExpression.testVal2).toBe(12)
  })
  it('test basics find', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    testServerExpression.testVal = 1
    testServerExpression.testVal2 = 11
    let r = c.repo(testServerExpression).create()
    r.code = 5
    await r._.save()
    testServerExpression.testVal = 1
    testServerExpression.testVal2 = 11
    r = (await c.repo(testServerExpression).find({}))[0]
    expect(r.test).toBe(1)
    expect(r.testPromise).toBe(11)
    expect(testServerExpression.testVal).toBe(2)
    expect(testServerExpression.testVal2).toBe(12)
  })
  it('test doesnt calc on client', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    c.dataProvider.isProxy = true
    testServerExpression.testVal = 1
    testServerExpression.testVal2 = 11
    let r = c.repo(testServerExpression).create()
    r.code = 5
    await r._.save()
    expect(r.test).toBe(undefined)
    expect(r.testPromise).toBe(undefined)
    expect(testServerExpression.testVal).toBe(1)
    expect(testServerExpression.testVal2).toBe(11)
  })
  it('test basics find doesnt calc on client', async () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    c.dataProvider.isProxy = true

    let r = c.repo(testServerExpression).create()
    r.code = 5
    await r._.save()
    testServerExpression.testVal = 1
    testServerExpression.testVal2 = 11
    r = (await c.repo(testServerExpression).find({}))[0]
    expect(r.test).toBe(undefined)
    expect(r.testPromise).toBe(undefined)
    expect(testServerExpression.testVal).toBe(1)
    expect(testServerExpression.testVal2).toBe(11)
  })
  it('test uuid', async () => {
    const e = class {
      id = ''
      num = 0
    }
    describeClass(e, Entity('x'), {
      id: Fields.id(),
      num: Fields.number(),
    })
    const repo = new Remult(new InMemoryDataProvider()).repo(e)
    let item = await repo.insert({ num: 1 })
    expect(item.id.length).to.eq(36, item.id)
    item = await repo.insert({ id: '123', num: 2 })
    expect(item.id).toBe('123')
  })
  it('test cuid', async () => {
    const e = class {
      id = ''
      num = 0
    }
    describeClass(e, Entity('x'), {
      id: Fields.id({ idFactory: () => createId() }),
      num: Fields.number(),
    })
    const repo = new Remult(new InMemoryDataProvider()).repo(e)
    let item = await repo.insert({ num: 1 })
    expect(item.id.length).to.eq(24, item.id)
    item = await repo.insert({ id: '123', num: 2 })
    expect(item.id).toBe('123')
  })
  it('test createdAt', async () => {
    const e = class {
      id = 1
      createdAt!: Date
      updatedAt!: Date
      val = 0
    }
    describeClass(e, Entity('x'), {
      id: Fields.autoIncrement(),
      createdAt: Fields.createdAt(),
      updatedAt: Fields.updatedAt(),
      val: Fields.number(),
    })
    const repo = new Remult(new InMemoryDataProvider()).repo(e)
    let item = await repo.insert({})
    expect(item.createdAt.toDateString()).toBe(new Date().toDateString())
    expect(
      Math.abs(item.updatedAt.valueOf() - item.createdAt.valueOf()),
    ).toBeLessThan(5)
    let c = item.createdAt
    await new Promise((res) =>
      setTimeout(() => {
        res({})
      }, 10),
    )
    item = await repo.save({ ...item, val: 3 })
    expect(item.val).toBe(3)
    expect(item.createdAt).toEqual(c)
    expect(item.createdAt).not.toEqual(item.updatedAt)
  })

  it('test recursive db names', async () => {
    const myClass = class {
      a!: string
      b!: string
      c!: string
      d!: string
      e!: string
      f!: string
    }
    describeClass(
      myClass,
      Entity<InstanceType<typeof myClass>>('test-recursive-db-names'),
      {
        a: Fields.string(),
        b: Fields.string({ dbName: 'bb' }),
        c: Fields.string({ sqlExpression: () => 'cc' }),
        d: Fields.string<InstanceType<typeof myClass>>({
          sqlExpression: async (e) => e.fields.c.dbName + 'dd',
        }),
        e: Fields.string<InstanceType<typeof myClass>>({
          sqlExpression: async (e) => {
            const n = await dbNamesOf(e)
            return n.c + 'ee'
          },
        }),
        f: Fields.string<InstanceType<typeof myClass>>({
          sqlExpression: async (e) => {
            const n = await dbNamesOf(e)
            return n.f + 'ff'
          },
        }),
      },
    )
    const r = await dbNamesOf(remult.repo(myClass))
    expect(r.a).toBe('a')
    expect(r.b).toBe('bb')
    expect(r.c).toBe('cc')
    expect(r.d).toBe('cdd')
    expect(r.e).toBe('ccee')
    expect(r.f).toMatchInlineSnapshot(
      `"recursive sqlExpression call for field 'f'. \0ff"`,
    )
    const z = await dbNamesOf(remult.repo(myClass).metadata)
    expect(z.a).toBe('a')
    const zz = await dbNamesOf(myClass)
    expect(zz.a).toBe('a')
    const zzz = await dbNamesOf(testServerExpression)
    expect(zzz.code).toBe('code')
  })
})

@Entity('testServerExpression')
class testServerExpression extends EntityBase {
  static testVal = 1
  static testVal2 = 10
  @Fields.integer()
  code!: number
  @Fields.integer({ serverExpression: () => testServerExpression.testVal++ })
  test!: number
  @Fields.integer({
    serverExpression: () => Promise.resolve(testServerExpression.testVal2++),
  })
  testPromise!: number
}
describe('test dbnames with table name', () => {
  @Entity('testTableName')
  class testTableName extends EntityBase {
    @Fields.number()
    code!: number
    @Fields.number({ sqlExpression: () => '5' })
    sqlExpression!: number
  }
  it('test without table name', async () => {
    const r = await dbNamesOf(remult.repo(testTableName))
    expect(r.$entityName).toBe('testTableName')
    expect(r.code).toBe('code')
    expect(r.sqlExpression).toBe('5')
  })
  it('test with table name', async () => {
    const r = await dbNamesOf(remult.repo(testTableName), {
      tableName: true,
      wrapIdentifier: (name: string) => `"${name}"`,
    })

    expect(r.$entityName).toBe('"testTableName"')
    expect(r.code).toBe('"testTableName"."code"')
    expect(r.sqlExpression).toBe('5')
    expect(
      await SqlDatabase.filterToRaw(
        testTableName,
        {
          code: 1,
        },
        undefined,
        r,
      ),
    ).toBe('"testTableName"."code" = 1')
  })
  it('test with table name', async () => {
    const r = await dbNamesOf(remult.repo(testTableName), {
      tableName: 'al',
      wrapIdentifier: (name: string) => `"${name}"`,
    })

    expect(r.$entityName).toBe('"testTableName"')
    expect(r.code).toBe('"al"."code"')
    expect(r.sqlExpression).toBe('5')
  })
})
