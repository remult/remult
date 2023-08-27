import { Remult } from '../context'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { dbNamesOf } from '../filter/filter-consumer-bridge-to-sql-request'
import { remult } from '../remult-proxy'
import { Field, Entity, EntityBase, Fields } from '../remult3'
import { describeClass } from '../remult3/DecoratorReplacer'
import { actionInfo } from '../server-action'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

describe('test server expression value', () => {
  beforeEach(() => {(actionInfo.runningOnServer = true)})
  afterEach(() =>{ (actionInfo.runningOnServer = false)})
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
    actionInfo.runningOnServer = false
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()

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
    actionInfo.runningOnServer = false
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()

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
      id: Fields.uuid(),
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
      id: Fields.cuid(),
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
  if (false)
    it('test recursive db names', async () => {
      const myClass = class {
        a: string
        b: string
        c: string
        d: string
        e: string
        f: string
      }
      describeClass(
        myClass,
        Entity<InstanceType<typeof myClass>>('test-recursive-db-names'),
        {
          a: Fields.string(),
          b: Fields.string({ dbName: 'bb' }),
          c: Fields.string({ sqlExpression: () => 'cc' }),
          d: Fields.string({
            sqlExpression: async (e) => (await e.fields.c.getDbName()) + 'dd',
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
      expect(r.d).toBe('ccdd')
      expect(r.e).toBe('ccee')
      expect(r.f).toBe("Recursive getDbName call for field 'f'. ff")
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
  code: number
  @Fields.integer({ serverExpression: () => testServerExpression.testVal++ })
  test: number
  @Fields.integer({
    serverExpression: () => Promise.resolve(testServerExpression.testVal2++),
  })
  testPromise: number
}
