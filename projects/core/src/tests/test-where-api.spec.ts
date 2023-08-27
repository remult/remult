import { testInMemoryDb, testRestDb, testSql } from './testHelper'
import { TestDataApiResponse } from './TestDataApiResponse'
import { Done } from './Done'

import { Remult } from '../context'
import { SqlDatabase } from '../data-providers/sql-database'
import { Categories, CategoriesForTesting } from './remult-3-entities'
import { insertFourRows } from './RowProvider.spec'
import { createData } from './createData'
import {
  Entity,
  EntityBase,
  Field,
  EntityFilter,
  FindOptions,
  Repository,
  Fields,
} from '../remult3'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { customUrlToken, Filter } from '../filter/filter-interfaces'
import { RestDataProvider } from '../data-providers/rest-data-provider'
import { DataApi } from '../data-api'

import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider'
import { ClassType } from '../../classType'
import {
  CustomSqlFilterBuilder,
  dbNamesOf,
} from '../filter/filter-consumer-bridge-to-sql-request'
import { entityForrawFilter } from './entityForCustomFilter'
import { describeClass } from '../remult3/DecoratorReplacer'
import { title } from 'process'
import { describe, it, expect,beforeEach,beforeAll,afterEach } from 'vitest'

describe('test where stuff', () => {
  let repo: Repository<CategoriesForTesting>
  beforeAll(async (done) => {
    ;[repo] = await insertFourRows()
  })
  it('test in statement', async () => {
    expect(await repo.count({ id: [undefined] })).toBe(0)
    expect(await repo.count({ id: [1, undefined, 3] })).toBe(2)
  })

  it('test and', async () => {
    expect(await repo.count({ categoryName: 'yoni' })).toBe(1)
    expect(await repo.count({ categoryName: { $gte: 'yoni' } })).toBe(1)
    expect(await repo.count({ id: 1 })).toBe(1)
    expect(await repo.count({ id: 1, categoryName: 'yoni' })).toBe(0)
    expect(await repo.count({ id: 1, $and: [{ categoryName: 'yoni' }] })).toBe(
      0,
    )
    expect(
      await repo.count({ $and: [{ id: 1 }, { categoryName: 'yoni' }] }),
    ).toBe(0)
  })
  it('test two values', async () => {
    expect(await repo.count({ $and: [{ id: 1 }, { id: 2 }] })).toBe(0)
  })
  it('test two values', async () => {
    const json = await Filter.fromEntityFilter(repo.metadata, {
      $and: [{ id: 1 }, { id: 2 }],
    }).toJson()

    expect(
      await repo.count(Filter.entityFilterFromJson(repo.metadata, json)),
    ).toBe(0)
  })
  it('test in and', async () => {
    const json = await Filter.fromEntityFilter(repo.metadata, {
      $and: [{ id: [1, 2] }, { id: [2] }],
    }).toJson()

    expect(
      await repo.count(Filter.entityFilterFromJson(repo.metadata, json)),
    ).toBe(1)
  })

  it('test basics', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
    expect(await repo.count({ $and: [fo.where], id: { $lte: 3 } })).toBe(2)
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
  })
  it('test basics_2', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { $gte: 2 } },
    }
    expect(
      await repo.count({ id: { $lte: 3 }, $and: [fo.where, undefined] }),
    ).toBe(2)
  })
  it('test basics_2_2', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
  })
  it('test basics_2_3', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
  })
  it('test basics_2_1', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { $gte: 2 } },
    }
    expect(
      await repo.count({ id: { $lte: 3 }, $and: [fo.where, undefined] }),
    ).toBe(2)
  })
  it('test basics_3', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where] })).toBe(2)
  })
})

describe('custom filter', () => {
  it('test that it works', async () => {
    let c = new Remult().repo(entityForrawFilter, new InMemoryDataProvider())
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    expect(
      await c.count(entityForrawFilter.filter({ oneAndThree: true })),
    ).toBe(2)
  })
  it('works with serialize filter', async () => {
    let z = entityForrawFilter.oneAndThree()
    let c = new Remult().repo(entityForrawFilter, new InMemoryDataProvider())

    let json = (
      await Filter.fromEntityFilter(
        c.metadata,
        entityForrawFilter.oneAndThree(),
      )
    ).toJson()

    expect(json).toEqual({
      $custom$oneAndThree: {},
    })
    let json3 = Filter.entityFilterToJson(
      c.metadata,
      Filter.entityFilterFromJson(c.metadata, json),
    )
    expect(json3).toEqual(json)
  })

  it('test that it works', () =>
    testRestDb(async ({ remult }) => {
      let c = remult.repo(entityForrawFilter)
      for (let id = 0; id < 5; id++) {
        await c.create({ id }).save()
      }
      expect(await c.count(entityForrawFilter.oneAndThree())).toBe(2)
      expect(
        (await c.findFirst(entityForrawFilter.testNumericValue(2))).id,
      ).toBe(2)
      expect(
        (await c.findFirst(entityForrawFilter.testObjectValue({ val: 2 }))).id,
      ).toBe(2)
    }))
  
  it('test that it works with arrayFilter', async () => {
    let c = new Remult().repo(entityForrawFilter, new InMemoryDataProvider())
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    expect(
      await c.count(
        ArrayEntityDataProvider.rawFilter((x) => x.id == 1 || x.id == 3),
      ),
    ).toBe(2)
    expect(
      await c.count(entityForrawFilter.filter({ dbOneOrThree: true })),
    ).toBe(2)
  })
  it('test or and promise in translate', async () => {
    let c = new Remult().repo(entityForrawFilter, new InMemoryDataProvider())
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    ''.toString()
    expect(
      await c.count({
        $or: [entityForrawFilter.filter({ dbOneOrThree: true }), { id: 4 }],
      }),
    ).toBe(3)
  })
  it('test sent in api', async () => {
    let ok = new Done()
    let z = new RestDataProvider(() => ({
      httpClient: {
        delete: () => undefined,
        get: async (url) => {
          ok.ok()
          expect(url).toBe(
            '/entityForrawFilter?%24custom%24filter=%7B%22oneAndThree%22%3Atrue%7D&__action=count',
          )
          return { count: 0 }
        },
        post: () => undefined,
        put: () => undefined,
      },
      url: '',
    }))
    let c = new Remult()
    c.dataProvider = z
    await c
      .repo(entityForrawFilter)
      .count(entityForrawFilter.filter({ oneAndThree: true }))
    ok.test()
  })
  it('test order by on rest request', async () => {
    let ok = new Done()
    let c = new Remult(
      new RestDataProvider(() => ({
        httpClient: {
          delete: () => undefined,
          get: async (url) => {
            ok.ok()
            expect(url).toBe('/Categories?_sort=categoryName%2Cid')
            return []
          },
          post: () => undefined,
          put: () => undefined,
        },
        url: '',
      })),
    )
    await c.repo(Categories).find({
      orderBy: {
        categoryName: 'asc',
        id: 'asc',
      },
    })
    ok.test()
  })
  it('test order by on rest request', async () => {
    let ok = new Done()
    let c = new Remult(
      new RestDataProvider(() => ({
        httpClient: {
          delete: () => undefined,
          get: async (url) => {
            ok.ok()
            expect(url).toBe(
              '/Categories?_sort=categoryName%2Cid&_order=asc%2Cdesc',
            )
            return []
          },
          post: () => undefined,
          put: () => undefined,
        },
        url: '',
      })),
    )
    await c.repo(Categories).find({
      orderBy: {
        categoryName: 'asc',
        id: 'desc',
      },
    })
    ok.test()
  })
  it('test find id on api', async () => {
    let myEntity = class {
      id = 0
      title = ''
    }
    describeClass(
      myEntity,
      Entity('test', {
        defaultOrderBy: {
          title: 'asc',
        },
      }),
      {
        id: Fields.integer(),
        title: Fields.string(),
      },
    )

    let ok = new Done()
    let z = new RestDataProvider(() => ({
      httpClient: {
        delete: () => undefined,
        get: async (url) => {
          ok.ok()
          expect(url).toBe('/test?id=8')
          return []
        },
        post: () => undefined,
        put: () => undefined,
      },
      url: '',
    }))
    let c = new Remult()
    c.dataProvider = z
    await c.repo(myEntity).findId(8)
    ok.test()
  })

  it('test that api reads custom correctly', async () => {
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(entityForrawFilter)
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.count).toBe(2)
      d.ok()
    }
    await api.count(t, {
      get: (x) => {
        if (x == customUrlToken + 'filter') return '{"oneAndThree":true}'
        return undefined
      },
    })
    d.test()
  })
  it('test that api reads custom correctly 2', async () => {
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(entityForrawFilter)
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.count).toBe(2)
      d.ok()
    }
    await api.count(
      t,
      {
        get: (x) => {
          if (x == customUrlToken) return
          return undefined
        },
      },
      {
        $custom$filter: {
          oneAndThree: true,
        },
      },
    )
    d.test()
  })
  it('test that api reads custom correctly 3', async () => {
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(entityForrawFilter)
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.count).toBe(2)
      d.ok()
    }
    await api.count(
      t,
      {
        get: (x) => {
          if (x == customUrlToken) return
          return undefined
        },
      },
      {
        $custom$filter: {
          oneAndThree: true,
        },
      },
    )
    d.test()
  })
  it('test that api reads custom correctly and translates to db', async () => {
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let c = remult.repo(entityForrawFilter)
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.count).toBe(2)
      d.ok()
    }
    await api.count(t, {
      get: (x) => {
        if (x == customUrlToken + 'filter') return '{"dbOneOrThree":true}'
        return undefined
      },
    })
    d.test()
  })
})

declare type Draft<T> = WritableDraft<T>
declare type WritableDraft<T> = {
  -readonly [K in keyof T]: Draft<T[K]>
}
declare type SliceCaseReducers<State> = {
  [K: string]: (state: Draft<State>) => State
}
function x<
  CaseReducers extends SliceCaseReducers<{
    test?: WritableDraft<entityForrawFilter>[]
  }>,
>(what: CaseReducers) {}
//reproduce typescript bug with recursive types
x<{
  addComment: (
    state: WritableDraft<{
      test?: entityForrawFilter[]
    }>,
  ) => {
    test: WritableDraft<entityForrawFilter>[]
  }
}>({} as any)

@Entity('tasks')
class task extends EntityBase {
  @Fields.string()
  title: string = ''
  @Fields.boolean()
  completed: boolean = false
}

@Entity('taskWithNull')
class taskWithNull extends EntityBase {
  @Fields.string()
  title: string = ''
  @Fields.boolean({ allowNull: true })
  completed: boolean
}
describe('missing fields are added in array column', async () => {
  it('not allow null', async () => {
    let db = new InMemoryDataProvider()
    db.rows['tasks'] = [
      {
        title: 't1',
      },
      {
        title: 't2',
        completed: true,
      },
      {
        title: 't3',
      },
    ]
    let r = new Remult()

    r.dataProvider = db
    let rep = r.repo(task)
    expect(
      (await rep.find({ orderBy: { completed: 'asc', title: 'asc' } })).map(
        (x) => x.title,
      ),
    ).toEqual(['t1', 't3', 't2'])
    expect(await rep.count({ completed: false })).toBe(2)
    let t = await rep.findFirst({ title: 't1' })
    expect(t.completed).toBe(false)
    t.completed = undefined
    await t.save()
    expect(t.completed).toBe(false)
    t.completed = null
    await t.save()
    expect(t.completed).toBe(false)
    t = rep.create({ title: '4' })
    await t.save()
    expect(t.completed).toBe(false)
  })
  it('allow  null', async () => {
    let db = new InMemoryDataProvider()
    db.rows['taskWithNull'] = [
      {
        title: 't1',
      },
      {
        title: 't2',
        completed: true,
      },
      {
        title: 't3',
      },
    ]
    let r = new Remult()

    r.dataProvider = db
    let rep = r.repo(taskWithNull)
    expect(
      (await rep.find({ orderBy: { completed: 'asc', title: 'asc' } })).map(
        (x) => x.title,
      ),
    ).toEqual(['t1', 't3', 't2'])
    expect(await rep.count({ completed: false })).toBe(0)
    let t = await rep.findFirst({ title: 't1' })
    expect(t.completed).toBe(null)
    t.completed = undefined
    await t.save()
    expect(t.completed).toBe(null)
    t.completed = null
    await t.save()
    expect(t.completed).toBe(null)
    t = rep.create({ title: '4' })
    await t.save()
    expect(t.completed).toBe(null)
  })
  it('test api with and', () => {
    let x: EntityFilter<taskWithNull> = {
      title: 'abc',
      $and: [],
    }
    x.$and.push({})
    let y: EntityFilter<taskWithNull> = { $and: [x, x] }
  })
  it('test api with and', () => {
    let x: EntityFilter<taskWithNull> = {
      $and: [],
    }
    x.$and.push({})
    let z: EntityFilter<taskWithNull> = x
  })
})
