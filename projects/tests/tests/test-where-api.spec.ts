import type { EntityFilter, FindOptions, Repository } from '../../core'
import {
  Entity,
  EntityBase,
  Field,
  Fields,
  SqlDatabase,
  remult,
  repo,
} from '../../core'
import { RestDataProvider } from '../../core/src//data-providers/rest-data-provider'
import {
  Filter,
  customUrlToken,
} from '../../core/src//filter/filter-interfaces'
import { DataApi } from '../../core/src/data-api'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database'

import type { CategoriesForTesting } from './remult-3-entities'
import { Categories } from './remult-3-entities'

import { ArrayEntityDataProvider } from '../../core/src//data-providers/array-entity-data-provider'

import { beforeAll, describe, expect, it } from 'vitest'
import { Remult } from '../../core/src//context'
import {
  describeClass,
  describeEntity,
} from '../../core/src/remult3/classDescribers'
import { Done } from './Done'
import { TestDataApiResponse } from './TestDataApiResponse'
import { entityForrawFilter } from './entityForCustomFilter'
import { testRestDb } from './testHelper'
import { entity } from './dynamic-classes'
import { Language, insertFourRows } from './entities-for-tests.js'
import { Relations } from '../../core/index.js'
import { TestApiDataProvider } from '../../core/server/test-api-data-provider.js'

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
  it('test or and And values', async () => {
    const json = await Filter.fromEntityFilter(repo.metadata, {
      $and: [
        {
          $or: [{ categoryName: '1' }, { categoryName: '1' }],
        },
        {
          $or: [{ id: 1 }, { id: 2 }],
        },
      ],
    }).toJson()
    expect(json).toMatchInlineSnapshot(`
      {
        "OR": [
          {
            "categoryName": "1",
          },
          {
            "categoryName": "1",
          },
          [
            {
              "id": 1,
            },
            {
              "id": 2,
            },
          ],
        ],
      }
    `)

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
  it('test or and', async () => {
    const json = await Filter.fromEntityFilter(repo.metadata, {
      $and: [{ id: [2], $or: [{ id: 1 }, { id: 3 }] }],
    }).toJson()

    expect(
      await repo.count(Filter.entityFilterFromJson(repo.metadata, json)),
    ).toBe(0)
  })
  it('test or and json', async () => {
    let json = {
      id: 2,
      OR: [
        {
          id: 1,
        },
        {
          id: 3,
        },
      ],
    }
    expect(Filter.entityFilterFromJson(repo.metadata, json))
      .toMatchInlineSnapshot(`
        {
          "$or": [
            {
              "id": 1,
            },
            {
              "id": 3,
            },
          ],
          "id": 2,
        }
      `)
  })

  it('test basics', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
    expect(await repo.count({ $and: [fo.where!], id: { $lte: 3 } })).toBe(2)
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
  })
  it('test basics_2', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { $gte: 2 } },
    }
    expect(
      await repo.count({ id: { $lte: 3 }, $and: [fo.where!, undefined!] }),
    ).toBe(2)
  })
  it('test basics_2_2', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
  })
  it('test basics_2_3', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
  })
  it('test basics_2_1', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { $gte: 2 } },
    }
    expect(
      await repo.count({ id: { $lte: 3 }, $and: [fo.where!, undefined!] }),
    ).toBe(2)
  })
  it('test basics_3', async () => {
    let fo: FindOptions<CategoriesForTesting> = {
      where: { id: { '>=': 2 } },
    }
    expect(await repo.count({ id: { $lte: 3 }, $and: [fo.where!] })).toBe(2)
  })
  it('test api and & not', async () => {
    remult.dataProvider = TestApiDataProvider({
      dataProvider: new InMemoryDataProvider()
    })

    const r = remult.repo(Categories)
    await r.insert({ id: 1, categoryName: "v1" })
    await r.insert({ id: 2, categoryName: "v2" })
    await r.insert({ id: 3, categoryName: "m1" })

    expect((await r.find({
      where: {
        $and: [
          { $not: { id: 1 } },
          { categoryName: { $contains: "v" } },
        ],
      }
    })).map(c => { return { id: c.id, categoryName: c.categoryName } })).toMatchInlineSnapshot(`
      [
        {
          "categoryName": "v2",
          "id": 2,
        }
      ]
    `)
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
        (await c.findFirst(entityForrawFilter.testNumericValue(2)))!.id,
      ).toBe(2)
      expect(
        (await c.findFirst(entityForrawFilter.testObjectValue({ val: 2 })))!.id,
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
        delete: () => undefined!,
        get: async (url) => {
          ok.ok()
          expect(url).toBe(
            '/entityForrawFilter?%24custom%24filter=%7B%22oneAndThree%22%3Atrue%7D&__action=count',
          )
          return { count: 0 }
        },
        post: () => undefined!,
        put: () => undefined!,
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
          delete: () => undefined!,
          get: async (url) => {
            ok.ok()
            expect(url).toBe('/Categories?_sort=categoryName%2Cid')
            return []
          },
          post: () => undefined!,
          put: () => undefined!,
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
          delete: () => undefined!,
          get: async (url) => {
            ok.ok()
            expect(url).toBe(
              '/Categories?_sort=categoryName%2Cid&_order=asc%2Cdesc',
            )
            return []
          },
          post: () => undefined!,
          put: () => undefined!,
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
    describeEntity(
      myEntity,
      'test',

      {
        id: Fields.integer(),
        title: Fields.string(),
      },
      {
        defaultOrderBy: {
          title: 'asc',
        },
      },
    )

    let ok = new Done()
    let z = new RestDataProvider(() => ({
      httpClient: {
        delete: () => undefined!,
        get: async (url) => {
          ok.ok()
          expect(url).toBe('/test?id=8')
          return []
        },
        post: () => undefined!,
        put: () => undefined!,
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
        where: {
          $custom$filter: {
            oneAndThree: true,
          },
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
        where: {
          $custom$filter: {
            oneAndThree: true,
          },
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
>(what: CaseReducers) { }
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
  completed!: boolean
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
    let t = (await rep.findFirst({ title: 't1' }))!
    expect(t.completed).toBe(false)
    t.completed = null!
    await t.save()
    expect(t.completed).toBe(false)
    t.completed = null!
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
    let t = (await rep.findFirst({ title: 't1' }))!
    expect(t.completed).toBe(null)
    t.completed = null!
    await t.save()
    expect(t.completed).toBe(null)
    t.completed = null!
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
    x.$and!.push({})
    let y: EntityFilter<taskWithNull> = { $and: [x, x] }
  })
  it('test api with and', () => {
    let x: EntityFilter<taskWithNull> = {
      $and: [],
    }
    x.$and!.push({})
    let z: EntityFilter<taskWithNull> = x
  })
  it('test toToRawFilter', async () => {
    const repo = remult.repo(taskWithNull)

    expect(
      await SqlDatabase.filterToRaw(repo, { completed: true }),
    ).toMatchInlineSnapshot('"completed = true"')
  })
  it('test toToRawFilter b', async () => {
    const repo = remult.repo(taskWithNull)

    expect(
      await SqlDatabase.filterToRaw(
        new Remult(new InMemoryDataProvider()).repo(taskWithNull),
        { completed: true },
      ),
    ).toMatchInlineSnapshot('"completed = true"')
  })
  it('test toToRawFilter and api prefilter', async () => {
    const e = entity(
      'tasks',
      {
        id: Fields.number(),
        title: Fields.string(),
        archive: Fields.boolean(),
      },
      {
        backendPrefilter: () => ({ archive: false }),
      },
    )
    var db = remult.dataProvider
    remult.dataProvider = new InMemoryDataProvider()
    try {
      const repo = remult.repo(e)

      expect(
        await SqlDatabase.filterToRaw(repo, { id: [1, 2] }),
      ).toMatchInlineSnapshot('"id in (1,2) and archive = false"')
    } finally {
      remult.dataProvider = db
    }
  })
})

describe('Filter.getPreciseFilterValuesForKey', () => {
  @Entity('category')
  class Category {
    @Fields.string()
    id = ''
    @Fields.string()
    name = ''
  }
  @Entity('orders')
  class order {
    @Fields.string()
    id = ''
    @Fields.string()
    customerId: string = ''
    @Fields.string()
    status: string = ''
    @Field(() => Language)
    language = Language.Hebrew
    @Relations.toOne(() => order)
    parentOrder?: order
    @Relations.toOne(() => Category)
    category?: Category
  }
  const meta = repo(order).metadata
  it('Should work with value list field type', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      language: Language.Russian,
      parentOrder: { $id: '123' },
    })

    expect(preciseValues.language).toEqual([Language.Russian])
  })
  it('should work with relation 1', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      parentOrder: { $id: '123' },
    })
    expect(preciseValues.parentOrder![0]!.id).toEqual('123')
  })
  it('should work with relation 2', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      category: { $id: '123' },
    })
    expect(preciseValues.category![0]!.id).toEqual('123')
  })
  it('should work with relation with non common id', async () => {
    @Entity('xx')
    class IdThatIsNotId {
      @Fields.integer()
      index = 0
      @Fields.string()
      name = ''
    }
    @Entity('yy')
    class Product {
      @Fields.string()
      id = ''
      @Relations.toOne(() => IdThatIsNotId)
      category?: IdThatIsNotId
    }
    const meta = repo(Product).metadata

    const preciseValues = await Filter.getPreciseValues(meta, {
      category: repo(IdThatIsNotId).create({ index: 3, name: '' }),
    })
    expect(preciseValues.category![0]!.index).toEqual(3)
  })
  it('should work with compound', async () => {
    @Entity<CompoundId>('xx', {
      id: { company: true, index: true },
    })
    class CompoundId {
      @Fields.integer()
      company = 0
      @Fields.integer()
      index = 0
      @Fields.string()
      name = ''
    }
    @Entity('yy')
    class Product {
      @Fields.string()
      id = ''
      @Relations.toOne(() => CompoundId)
      category?: CompoundId
    }
    const meta = repo(Product).metadata

    const preciseValues = await Filter.getPreciseValues(meta, {
      category: repo(CompoundId).create({ company: 7, index: 3, name: '' }),
    })
    expect(preciseValues.category![0]!.index).toEqual(3)
    expect(preciseValues.category![0]!.company).toEqual(7)
  })

  it('should return an array of values for a filter with multiple fields, including the target keys', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      customerId: '123',
      status: 'active',
    })

    expect(preciseValues.customerId).toEqual(['123'])
    expect(preciseValues.status).toEqual(['active'])
  })

  it('should return undefined for a filter with multiple fields, where one of the target keys has a non-equality operator', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      customerId: { $gt: '123' },
      status: 'active',
    })
    expect(preciseValues.customerId).toBeUndefined()
    expect(preciseValues.status).toEqual(['active'])
  })

  it('should return an array of values for an $or filter with multiple fields, including the target keys', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      $or: [
        { customerId: '123', status: 'active' },
        { customerId: '456', status: 'inactive' },
      ],
    })
    expect(preciseValues.customerId).toEqual(['123', '456'])
    expect(preciseValues.status).toEqual(['active', 'inactive'])
  })

  it('should return undefined for an $or filter with multiple fields, where one path does not include one of the target keys', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      $or: [{ customerId: '123', status: 'active' }, { customerId: '456' }],
    })
    expect(preciseValues.customerId).toEqual(['123', '456'])
    expect(preciseValues.status).toBeUndefined()
  })

  it('should return undefined for an $or filter with multiple fields, where one path has a non-equality operator for one of the target keys', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      $or: [
        { customerId: '123', status: 'active' },
        { customerId: { $gt: '200' }, status: 'inactive' },
      ],
    })
    expect(preciseValues.customerId).toBeUndefined()
    expect(preciseValues.status).toEqual(['active', 'inactive'])
  })
  it('doc', async () => {
    const preciseValues = await Filter.getPreciseValues(meta, {
      status: { $ne: 'active' },
      $or: [{ customerId: ['1', '2'] }, { customerId: '3' }],
    })
    expect({ ...preciseValues }).toMatchInlineSnapshot(`
      {
        "customerId": [
          "1",
          "2",
          "3",
        ],
        "status": undefined,
      }
    `)
  })
})
