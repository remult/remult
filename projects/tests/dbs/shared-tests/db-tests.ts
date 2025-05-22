import { DataApi } from '../../../core/src/data-api'
import type {
  EntityFilter,
  Repository,
} from '../../../core/src/remult3/remult3'
import {
  Entity,
  EntityBase,
  Field,
  Fields,
  IdEntity,
  Relations,
  SqlDatabase,
  ValueListFieldType,
} from '../../../core'
import { c } from '../../tests/c'

import { v4 as uuid } from 'uuid'
import {
  DataProviderLiveQueryStorage,
  LiveQueryStorageEntity,
} from '../../../core/live-query/data-provider-live-query-storage'
import { Remult } from '../../../core/src/context'
import {
  Filter,
  entityFilterToJson,
} from '../../../core/src/filter/filter-interfaces'
import {
  describeClass,
  describeEntity,
} from '../../../core/src/remult3/classDescribers'
import { Validators } from '../../../core/src/validators'
import { Done } from '../../tests/Done'
import { TestDataApiResponse } from '../../tests/TestDataApiResponse'
import { d } from '../../tests/d'
import { dWithPrefilter } from '../../tests/dWithPrefilter'
import { entityForrawFilter1 } from '../../tests/entityForCustomFilter'
import { entityWithValidationsOnColumn } from './entityWithValidationsOnColumn'
import { h } from '../../tests/h'
import {
  Categories,
  Categories as newCategories,
} from '../../tests/remult-3-entities'
import { tasks } from '../../tests/tasks'
import { Status } from '../../tests/testModel/models'
import type { DbTestProps } from './db-tests-props'

import { entityWithValidations } from './entityWithValidations'
import type { CategoriesForTesting } from '../../tests/remult-3-entities'
import { ValueConverters } from '../../../core/src/valueConverters'
import { it, vi, test, describe, beforeEach, beforeAll } from 'vitest'
import { expect } from 'vitest'
import { entity } from '../../tests/dynamic-classes.js'

export interface DbTestOptions {
  skipAutoIncrement?: boolean
  excludeTransactions?: boolean
  excludeLiveQuery?: boolean
  excludeJsonStorage?: boolean
}

export function commonDbTests(
  { createEntity, getRemult, getDb }: DbTestProps,
  options?: DbTestOptions,
) {
  it('what', async () => {
    const r = await createEntity(stam)
    await r.create({ id: 1, title: 'noam' }).save()
    expect(await r.count()).toBe(1)
  })
  it('data types', async () => {
    let r = await (
      await createEntity(stam)
    )
      .create({
        id: 1,
        //@ts-ignore
        title: 42,
      })
      .save()
    expect(r.title).toEqual('42')
  })
  test('test upsert', async () => {
    const s = await createEntity(stam)
    expect(await s.count()).toBe(0)
    expect(
      await s.upsert({
        where: {
          id: 1,
        },
      }),
    ).toMatchInlineSnapshot(`
      stam {
        "id": 1,
        "title": "",
      }
    `)
    await s.upsert({
      where: {
        id: 1,
      },
    })
    expect(await s.count()).toBe(1)
    expect(
      (await s.upsert({ where: { id: 1 }, set: { title: 'noam' } })).title,
    ).toBe('noam')
    expect(await s.count()).toBe(1)
    expect(
      (await s.upsert({ where: { id: 2 }, set: { title: 'noam' } })).title,
    ).toBe('noam')
    expect(await s.count()).toBe(2)

    expect(
      (
        await s.upsert([
          { where: { id: 3 }, set: { title: 'remult' } },
          { where: { id: 2 }, set: { title: 'remult' } },
        ])
      ).map((x) => x.title),
    ).toEqual(['remult', 'remult'])
    expect(await s.count()).toBe(3)
  })
  it('filter works on all db', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect((await s.find({ where: { myId: [1, 3] } })).length).toBe(2)
  })
  it('filter not works on all db', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (await s.find({ where: { $not: { myId: [1, 2, 3] } } })).length,
    ).toBe(1)
  })
  it('filter not works on all db2', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            $and: [
              { $not: { myId: 1 } },
              { $not: { myId: 3 } },
              { $not: { myId: 2 } },
            ],
          },
        })
      ).length,
    ).toBe(1)
  })

  it('test in statement and ', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    expect(await repo.count({ myId: [1, 3], $and: [{ myId: [3] }] })).toBe(1)
  })
  it('filter with and', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (await s.find({ where: { $and: [{ myId: 1 }, { myId: 3 }] } })).length,
    ).toBe(0)
  })
  it('test empty in', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect((await s.find({ where: { myId: [] } })).length).toBe(0)
  })
  it('filter works on all db or', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (await s.find({ where: { $or: [{ myId: 1 }, { myId: 3 }] } })).length,
    ).toBe(2)
  })
  it('filter works on all db or_1', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect((await s.find({ where: { $or: [{}, {}] } })).length).toBe(4)
  })
  it('filter works on all db or_2', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect((await s.find({ where: { $or: [{}, { myId: 3 }] } })).length).toBe(4)
  })
  it('filter with or and and', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await s.find({
          where: {
            myId: { '<=': 2 },
            $or: [
              {
                myId: 1,
              },
              {
                myId: 3,
              },
            ],
          },
        })
      ).length,
    ).toBe(1)
  })

  it('entity with different id column still works well', async () => {
    let s = await createEntity(entityWithValidations)
    let c = s.create()
    c.myId = 1
    c.name = 'noam'
    await c._.save()
    c.name = 'yael'
    await c._.save()
    expect(c.name).toBe('yael')
    expect((await s.find()).length).toBe(1)
  })

  it('empty find works', async () => {
    let c = (await createEntity(newCategories)).create()
    c.id = 5
    c.categoryName = 'test'
    await c._.save()
    let l = await getRemult().repo(newCategories).find()
    expect(l.length).toBe(1)
    expect(l[0].categoryName).toBe('test')
  })
  it('test descending', async () => {
    const repo = await createEntity(newCategories)
    await repo.create({ id: 1, categoryName: 'a' }).save()
    await repo.create({ id: 2, categoryName: 'b' }).save()

    const rows = await repo.find({
      orderBy: { categoryName: 'desc' },
      page: -1,
    })
    expect(rows[0].id).toBe(2)
  })
  it('test descending 2', async () => {
    const repo = await createEntity(newCategories)
    await repo.insert([
      { id: 1, categoryName: 'a' },
      { id: 2, categoryName: 'b' },
    ])

    const rows = await repo.find({
      orderBy: { categoryName: 'desc' },
      page: -1,
    })
    expect(rows[0].id).toBe(2)
  })
  it('partial updates', async () => {
    let c = (await createEntity(newCategories)).create({
      id: 5,
      categoryName: 'test',
      description: 'desc',
    })
    await c._.save()
    let l = (await getRemult().repo(newCategories).findId(5))!
    c.categoryName = 'newname'
    l.description = 'new desc'
    await c.save()
    await l.save()
    expect(l.categoryName).toBe('newname')
    expect(l.description).toBe('new desc')
  })
  it('put with validations on entity fails', async () => {
    let s = await createEntity(entityWithValidations)
    let c = s.create()
    c.myId = 1
    c.name = 'noam'
    await c._.save()
    let api = new DataApi(s, getRemult())
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.modelState.name).toBe('invalid')
      d.ok()
    }
    await api.put(t, 1, {
      name: '1',
    })
    d.test()
    var x = await s.find({ where: { myId: 1 } })
    expect(x[0].name).toBe('noam')
    x = await s.find({ where: { myId: 1 } })
    expect(x[0].name).toBe('noam')
  })
  it('test date only with null works', async () => {
    let repo = await createEntity(testDateWithNull)
    let r = repo.create({ id: 0 })
    await r.save()
    r = (await repo.findFirst())!
    expect(r.d).toBeNull()
    expect(await repo.count({ d: null! })).toBe(1)
    r.d = new Date(1976, 5, 16)
    await r.save()
    expect(r.d.getFullYear()).toBe(1976)
    r = (await repo.findFirst())!
    expect(r.d!.getFullYear()).toBe(1976)
    r.d = null
    await r.save()
    expect(r.d).toBeNull()
  })
  it('test date with null works', async () => {
    let repo = await createEntity(testDateWithNull)
    let r = repo.create({ id: 0 })
    await r.save()
    r = (await repo.findFirst())!
    expect(r.fullDate).toBeNull()
    expect(await repo.count({ fullDate: null! })).toBe(1)
    r.fullDate = new Date(1976, 5, 16)
    await r.save()
    expect(r.fullDate.getFullYear()).toBe(1976)
    r = (await repo.findFirst())!
    expect(r.fullDate!.getFullYear()).toBe(1976)
    r.fullDate = null
    await r.save()
    expect(r.fullDate).toBeNull()
  })

  it('test original value of date', async () => {
    let r = await (await createEntity(testDateWithNull))
      .create({ id: 1, d: new Date(1976, 6, 16) })
      .save()

    expect(r.$.d.originalValue!.getFullYear()).toBe(1976)
  })

  @Entity('testDateWithNull', { allowApiCrud: true })
  class testDateWithNull extends EntityBase {
    @Fields.integer()
    id: number = 0
    @Fields.dateOnly({ allowNull: true })
    d!: Date | null
    @Fields.date({ allowNull: true })
    fullDate: Date | null = null
  }

  it('test string with null works', async () => {
    let repo = await createEntity(testStringWithNull)
    let r = repo.create({ id: 0 })
    await r.save()
    r = (await repo.findFirst())!
    expect(r.d).toBeNull()
  })

  it('test tasks', async () => {
    let c = await createEntity(tasks)
    let t = c.create()
    t.id = 1
    await t._.save()
    t = c.create()
    t.id = 2
    t.completed = true
    await t._.save()
    t = c.create()
    t.id = 3
    t.completed = true
    await t._.save()
    await c.create({ id: 4, completed: false }).save()

    expect(await c.count({ completed: false })).toBe(2)
    expect(await c.count({ completed: { $ne: true } })).toBe(2)
    expect(await c.count({ completed: true })).toBe(2)
  })
  it("test filtering of null/''", async () => {
    let repo = await createEntity(h)
    let a = await repo.create({ id: 'a' }).save()
    let b = await repo.create({ id: 'b' }).save()
    let c = await repo.create({ id: 'c', refH: b }).save()
    expect(await repo.count({ refH: null })).toBe(2)
    expect(await repo.count({ refH: { '!=': null } })).toBe(1)
  })

  it('test paging with complex object', async () => {
    await createEntity(c)
    await createEntity(p)

    let c1 = await getRemult().repo(c).create({ id: 1, name: 'c1' }).save()
    let c2 = await getRemult().repo(c).create({ id: 2, name: 'c2' }).save()
    let c3 = await getRemult().repo(c).create({ id: 3, name: 'c3' }).save()

    await getRemult().repo(p).create({ id: 1, name: 'p1', c: c1 }).save()
    await getRemult().repo(p).create({ id: 2, name: 'p2', c: c2 }).save()
    await getRemult().repo(p).create({ id: 3, name: 'p3', c: c3 }).save()
    await getRemult().repo(p).create({ id: 4, name: 'p4', c: c3 }).save()
    await getRemult().repo(p).create({ id: 5, name: 'p5', c: c3 }).save()
    let i = 0
    for await (const x of getRemult()
      .repo(p)
      .query({
        orderBy: { c: 'asc', id: 'asc' },
      })) {
      i++
    }
    expect(i).toBe(5)
  })
  it('test paging with complex object_2', async () => {
    let c1 = await (await createEntity(c)).create({ id: 1, name: 'c1' }).save()

    await (await createEntity(p)).create({ id: 1, name: 'p1', c: c1 }).save()
    expect((await getRemult().repo(p).findFirst({ c: c1 }))!.id).toBe(1)
  })

  it("test filter doesn't collapse", async () => {
    let repo = await createEntity(dWithPrefilter)
    let d1 = await repo.create({ id: 1, b: 1 }).save()
    await repo.create({ id: 2, b: 2 }).save()
    let d4 = await repo.create({ id: 4, b: 2 }).save()

    let f: EntityFilter<dWithPrefilter> = { id: 1, $and: [{ id: 2 }] }
    expect(await repo.count(f)).toBe(0)
    expect((await repo.find({ where: f })).length).toBe(0)
    let json = Filter.entityFilterToJson(repo.metadata, f)
    f = Filter.entityFilterFromJson(repo.metadata, json)
    expect(await repo.count(f)).toBe(0)
    expect((await repo.find({ where: f })).length).toBe(0)
  })

  it("test filter doesn't collapse", async () => {
    let repo = await createEntity(d)
    let d1 = await repo.create({ id: 1, b: 1 }).save()
    await repo.create({ id: 2, b: 2 }).save()
    let d4 = await repo.create({ id: 4, b: 2 }).save()

    let f: EntityFilter<d> = { id: [1, 2] }
    expect(await repo.count(f)).toBe(2)
    expect((await repo.find({ where: f })).length).toBe(2)
    let json = Filter.entityFilterToJson(repo.metadata, f)

    f = Filter.entityFilterFromJson(repo.metadata, json)
    expect(await repo.count(f)).toBe(2)
    expect((await repo.find({ where: f })).length).toBe(2)
  })
  it('test that it works with inheritance', async () => {
    let c = await createEntity(entityForrawFilter1)
    for (let id = 0; id < 5; id++) {
      await c.create({ id }).save()
    }
    expect(await c.count(entityForrawFilter1.oneAndThree())).toBe(2)
    expect(
      (await c.findFirst(entityForrawFilter1.testNumericValue(2)))!.id,
    ).toBe(2)
    expect(
      (await c.findFirst(entityForrawFilter1.testObjectValue({ val: 2 })))!.id,
    ).toBe(2)
  })
  it('put with validations on column fails', async () => {
    var s = await createEntity(entityWithValidationsOnColumn)
    let c = s.create()

    c.myId = 1
    c.name = 'noam'
    await c._.save()
    let api = new DataApi(s, getRemult())
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.modelState.name).toBe('invalid on column')
      d.ok()
    }
    await api.put(t, 1, {
      name: '1',
    })
    d.test()
    var x = await s.find({ where: { myId: 1 } })
    expect(x[0].name).toBe('noam')
  })

  async function createData<T extends CategoriesForTesting = Categories>(
    doInsert?: (
      insert: (
        id: number,
        name: string,
        description?: string,
        status?: Status,
      ) => Promise<void>,
    ) => Promise<void>,
    entity?: {
      new (): T
    },
  ): Promise<Repository<T>> {
    //@ts-ignore
    if (!entity) entity = Categories
    let rep = (await createEntity(entity!)) as Repository<T>
    if (doInsert)
      await doInsert(async (id, name, description, status) => {
        let c = rep.create()
        c.id = id
        c.categoryName = name
        c.description = description!
        if (status) c.status = status
        await rep.save(c)
      })
    return rep
  }

  const insertFourRows = async () => {
    return createData(async (i) => {
      await i(1, 'noam', 'x')
      await i(4, 'yael', 'x')
      await i(2, 'yoni', 'y')
      await i(3, 'maayan', 'y')
    })
  }

  it('Insert', async () => {
    let forCat = await createData(async (x) => {})
    let rows = await forCat.find()
    expect(rows.length).toBe(0)
    let c = forCat.create()
    c.id = 1
    c.categoryName = 'noam'
    await c._.save()
    rows = await forCat.find()
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(1)
    expect(rows[0].categoryName).toBe('noam')
  })

  it('test delete', async () => {
    let c = await createData(async (insert) => await insert(5, 'noam'))
    let rows = await c.find()
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(5)
    await rows[0]._.delete()
    rows = await c.find()
    expect(rows.length).toBe(0)
  })
  it('test filter packer', async () => {
    let r = await insertFourRows()
    let rows = await r.find()
    expect(rows.length).toBe(4)

    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { description: 'x' }),
      ),
    })
    expect(rows.length).toBe(2)
    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { id: 4 }),
      ),
    })
    expect(rows.length).toBe(1)
    expect(rows[0].categoryName).toBe('yael')
    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, {
          description: 'y',
          categoryName: 'yoni',
        }),
      ),
    })
    expect(rows.length).toBe(1)
    expect(rows[0].id).toBe(2)
    rows = await r.find({
      where: Filter.entityFilterFromJson(
        r.metadata,
        entityFilterToJson(r.metadata, { id: { $ne: [2, 4] } }),
      ),
    })
    expect(rows.length).toBe(2)
  })
  it('Test unique Validation', async () => {
    let type = class extends newCategories {
      a!: string
    }
    Entity('categories')(type)
    Fields.string<typeof type.prototype>({
      validate: async (en, col) => {
        if (en._.isNew() || en.a != en._.fields.a.originalValue) {
          if (await c.count({ a: en.a })) en._.fields.a.error = 'already exists'
        }
      },
    })(type.prototype, 'a')
    var c = await createEntity(type)

    var cat = c.create()
    cat.a = '12'
    cat.id = 1
    await cat._.save()
    cat = c.create()
    cat.a = '12'

    var saved = false
    try {
      await cat._.save()
      saved = true
    } catch (err) {
      expect(cat._.fields.a.error).toEqual('already exists')
    }
    expect(saved).toBe(false)
  })

  it('Test unique Validation 2', async () => {
    let type = class extends newCategories {
      a!: string
    }
    Entity('sdfgds')(type)
    Fields.string<typeof type.prototype>({
      validate: Validators.unique,
    })(type.prototype, 'a')
    var c = await createEntity(type)
    var cat = c.create()
    cat.a = '12'

    await cat._.save()
    cat = c.create()
    cat.a = '12'

    var saved = false
    try {
      await cat._.save()
      saved = true
    } catch (err) {
      expect(cat._.fields.a.error).toEqual('already exists')
    }
    expect(saved).toBe(false)
  })

  @Entity('testNumbers', { allowApiCrud: true })
  class testNumbers extends EntityBase {
    @Fields.integer()
    id!: number
    @Fields.number()
    a!: number
  }

  it('test that integer and int work', async () => {
    let e = await (
      await createEntity(testNumbers)
    )
      .create({
        id: 1.5,
        a: 1.5,
      })
      .save()
    expect(e.id).toBe(2)
    expect(e.a).toBe(1.5)
  })

  it('post with logic works and max in entity', async () => {
    let c = await createEntity(entityWithValidations)

    var api = new DataApi(c, getRemult())
    let t = new TestDataApiResponse()
    let d = new Done()
    t.created = async (data: any) => {
      expect(data.name).toBe('noam honig')
      expect(data.myId).toBe(1)
      d.ok()
    }
    entityWithValidations.savingRowCount = 0
    await api.httpPost(
      t,
      { get: () => undefined },
      { name: 'noam honig', myId: 1 },
      () => undefined!,
    )
    expect(entityWithValidations.savingRowCount).toBe(1)
    d.test()
  })
  it('get array works with filter in body', async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open)
      await i(2, 'yael', undefined, Status.closed)
      await i(3, 'yoni', undefined, Status.hold)
    })
    var api = new DataApi(c, getRemult())
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(2)
      expect(data[1].id).toBe(3)
      d.ok()
    }
    await api.getArray(
      t,
      {
        get: (x) => {
          return undefined
        },
      },
      {
        where: {
          'status.in': '[1, 2]',
        },
      },
    )
    d.test()
  })
  it('entity order by works', async () => {
    let type = class extends newCategories {}
    Entity<typeof type.prototype>('', {
      defaultOrderBy: { categoryName: 'asc' },
    })(type)

    let c = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yoni')
      await insert(3, 'yael')
    }, type)

    var x = await c.find()
    expect(x[0].id).toBe(1)
    expect(x[1].id).toBe(3)
    expect(x[2].id).toBe(2)
    var x = await c.find({ orderBy: {} })
    expect(x[0].id).toBe(1)
    expect(x[1].id).toBe(3)
    expect(x[2].id).toBe(2)
    var x = (await c.query({ orderBy: {}, pageSize: 100 }).paginator()).items
    expect(x[0].id).toBe(1)
    expect(x[1].id).toBe(3)
    expect(x[2].id).toBe(2)
  })
  it('put with validation works', async () => {
    let count = 0
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined!, {
      allowApiCrud: true,
      saving: () => {
        count++
      },
    })(type)
    let c = await createData(async (insert) => await insert(1, 'noam'), type)

    var api = new DataApi(c, getRemult())
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      d.ok()
    }
    count = 0
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({
      where: { id: 1 },
    })

    expect(x[0].categoryName).toBe('noam 1')
    expect(count).toBe(1)
  })
  it('saves correctly to db', async () => {
    let type = class extends EntityBase {
      id!: number
      ok: Boolean = false
    }
    Entity('asdf', { allowApiCrud: true })(type)
    Fields.number()(type.prototype, 'id')
    Fields.boolean()(type.prototype, 'ok')
    let r = (await createEntity(type)).create()
    r.id = 1
    r.ok = true
    await r._.save()
    expect(r.ok).toBe(true)
    r.ok = false
    await r._.save()
    expect(r.ok).toBe(false)
  })

  @Entity('autoi', { allowApiCrud: true })
  class autoIncrement extends EntityBase {
    @Fields.autoIncrement()
    id!: number
    @Fields.integer()
    stam!: number
  }

  it("auto increment can't be affected by insert or update", async () => {
    let repo = await createEntity(autoIncrement)
    let r = await repo.create({ id: 1234, stam: 1 }).save()
    let x = r.id
    expect(x == 1234).toBe(false)

    r.id = 4321
    await r.save()
    expect(r.id).toBe(x)
  })

  it('Paging', async () => {
    let s = await entityWithValidations.create4RowsInDp(createEntity)
    expect((await s.find({ limit: 3, orderBy: { myId: 'asc' } })).length).toBe(
      3,
    )
    expect(
      (await s.find({ limit: 3, orderBy: { myId: 'asc' }, page: 2 })).length,
    ).toBe(1)
  })

  it('filter', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        a: 'z',
        $and: [testFilter.search('')],
      }),
    ).toBe(0)
  })
  it('filter 2_1', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [{ a: { '!=': 'b' } }, { a: { '!=': 'c' } }],
      }),
    ).toBe(1)
  })
  it('filter 2', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [testFilter.differentFrom('b'), testFilter.differentFrom('c')],
      }),
    ).toBe(1)
  })
  it('filter custom and not', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [{ $not: testFilter.differentFrom('b') }],
      }),
    ).toBe(0)
  })
  it('filter custom and not 2', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [{ $not: testFilter.differentFrom('a') }],
      }),
    ).toBe(1)
  })
  it('filter 3', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [
          testFilter.differentFromArray(['x', 'b']),
          testFilter.differentFromArray(['y', 'c']),
        ],
      }),
    ).toBe(1)
  })
  it('filter 4', async () => {
    const s = await createEntity(testFilter)
    await s.insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(
      await s.count({
        $and: [
          testFilter.differentFromObj({ str: 'b' }),
          testFilter.differentFromObj({ str: 'c' }),
        ],
      }),
    ).toBe(1)
  })

  it('large string field', async () => {
    const s = await createEntity(stam)
    await s.insert({ title: '1234567890'.repeat(100) })
    const r = await s.findFirst()
    expect(r!.title).toBe('1234567890'.repeat(100))
  })

  @Entity('testfilter', { allowApiCrud: true })
  class testFilter {
    @Fields.integer()
    id: number = 0
    @Fields.string()
    a: string = ''
    @Fields.string()
    b: string = ''
    @Fields.string()
    c: string = ''
    static search = Filter.createCustom<testFilter, string>((str, remult) => ({
      $and: [
        {
          $or: [{ a: 'a' }, { b: 'a' }, { c: 'a' }],
        },
      ],
    }))
    static differentFrom = Filter.createCustom<testFilter, string>((str) => {
      return {
        a: { '!=': str },
      }
    })
    static differentFromObj = Filter.createCustom<testFilter, { str: string }>(
      ({ str }) => {
        return {
          a: { '!=': str },
        }
      },
    )
    static differentFromArray = Filter.createCustom<testFilter, string[]>(
      (str) => {
        return {
          a: { '!=': str },
        }
      },
    )
  }

  @Entity('teststringWithNull', { allowApiCrud: true })
  class testStringWithNull extends EntityBase {
    @Fields.integer()
    id: number = 0
    @Fields.string({ allowNull: true })
    d!: string
  }

  @Entity('p', { allowApiCrud: true })
  class p extends EntityBase {
    @Fields.integer()
    id!: number
    @Fields.string()
    name!: string
    @Field(() => c)
    c!: c
    constructor(private remult: Remult) {
      super()
    }
  }

  it('task with enum string', async () => {
    const r = await createEntity(tasksWithStringEnum)
    await r.insert({
      title: 'a',
      priority: PriorityWithString.Critical,
    })
    const item = await r.findFirst()
    expect(item!.priority).toBe(PriorityWithString.Critical)
    expect(await r.count({ priority: PriorityWithString.Critical })).toBe(1)
    expect(await r.count({ priority: PriorityWithString.Low })).toBe(0)
  })
  it.skipIf(options?.excludeTransactions)(
    'test transaction rollback',
    async () => {
      let fail = true
      const r = await createEntity(stam)
      await r.insert({ title: 'task b', id: 1 })
      try {
        await getDb().transaction(async (db) => {
          var remultWithTransaction = new Remult(db).repo(stam)
          await remultWithTransaction.insert({ title: 'task a', id: 2 })
          expect(await remultWithTransaction.count()).toBe(2)
          throw 'error'
        })
        fail = false
      } catch (err) {
        expect(err).toBe('error')
      }
      expect(await r.count()).toBe(1)
      expect(fail).toBe(true)
    },
  )
  it.skipIf(options?.excludeTransactions)('transactions', async () => {
    let x = await createEntity(Categories)

    await getDb().transaction(async (db) => {
      let remult = new Remult(db)
      expect(await remult.repo(Categories).count()).toBe(0)
    })
  })
  it.skipIf(options?.excludeTransactions)('transactions 1', async () => {
    let x = await createEntity(Categories)

    try {
      await getDb().transaction(async (db) => {
        let remult = new Remult(db)
        await remult.repo(Categories).insert({ categoryName: 'testing' })
        expect(await remult.repo(Categories).count()).toBe(1)
        throw 'Fail'
      })
    } catch (err: any) {
      expect(err).toBe('Fail')
    }
    expect(await x.count()).toBe(0)
  })
  it.skipIf(options?.excludeTransactions)(
    'transaction should fully rollback if one fail',
    async () => {
      const originalConsoleError = console.error
      console.error = vi.fn()

      const ent = class {
        id = 0
        name = ''
      }
      describeClass(ent, Entity('test_transaction'), {
        id: Fields.integer(),
        name: Fields.string(),
      })

      await createEntity(ent)
      const remult = await getRemult()
      const all = await remult.repo(ent).find()
      for (let i = 0; i < all.length; i++) {
        await remult.repo(ent).delete(all[i].id)
      }

      const old_dataProvider = remult.dataProvider
      try {
        await remult.dataProvider.transaction(async (trx) => {
          remult.dataProvider = trx
          await remult.repo(ent).insert({ id: 1, name: 'a' })
          await remult.repo(ent).insert({ id: 1, name: 'b' })
        })
      } catch (error) {
      } finally {
        // Bring back the old dataprovider
        remult.dataProvider = old_dataProvider
      }

      // nothing should be inserted
      let data = await remult.repo(ent).find()
      expect(data.length).toBe(0)

      console.error = originalConsoleError
    },
  )

  it('test date', async () => {
    const e = class {
      a = 0
      d = new Date()
    }
    describeClass(e, Entity('tdate', { allowApiCrud: true }), {
      a: Fields.number(),
      d: Fields.date(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, d: new Date(1976, 5, 16) })
    let item = await r.findFirst()
    expect(item!.d.getFullYear()).toBe(1976)
  })
  it.skipIf(options?.excludeLiveQuery)('test live query storage', async () => {
    await createEntity(LiveQueryStorageEntity)
    var x = new DataProviderLiveQueryStorage(getDb())
    if (getDb().ensureSchema) await x.ensureSchema()
    const id = uuid()
    await x.add({ id, entityKey: 'x', data: 'noam' })
    await x.forEach('x', async (args) => {
      expect(args.query.data).toBe('noam')
    })
    expect(await x.keepAliveAndReturnUnknownQueryIds([id])).toEqual([])
  })

  it('test ensure schema adds missing columns', async () => {
    @Entity('testEnsureSchema', { allowApiCrud: true })
    class a {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    const r = await createEntity(a)
    await r.insert({ id: 1, name: 'noam' })
    @Entity('testEnsureSchema2', {
      allowApiCrud: true,
      dbName: 'testEnsureSchema',
    })
    class b extends a {
      @Fields.string({ allowNull: true })
      lastName = ''
    }
    const r2 = getRemult().repo(b)
    await getDb().ensureSchema?.([r2.metadata])
    await r2.insert({ id: 2, name: 'noam', lastName: 'honig' })
    expect(await r2.find()).toMatchInlineSnapshot(`
      [
        b {
          "id": 1,
          "lastName": null,
          "name": "noam",
        },
        b {
          "id": 2,
          "lastName": "honig",
          "name": "noam",
        },
      ]
    `)
  })

  it('test contains with names with casing', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    let item = await r.findFirst({ firstName: { $contains: 'oA' } })
    expect(item!.firstName).toBe('noam')
  })
  it('test not-contains with names with casing', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    await r.insert({ a: 2, firstName: 'abc' })
    let item = await r.find({ where: { firstName: { $notContains: 'oA' } } })
    expect(item.length).toBe(1)
  })
  it('test starts-with true', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    await r.insert({ a: 2, firstName: 'abc' })
    await r.insert({ a: 3, firstName: 'xyz' })
    let item = await r.find({ where: { firstName: { $startsWith: 'ab' } } })
    expect(item.length).toBe(1)
  })
  it('test starts-with false', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    await r.insert({ a: 2, firstName: 'abc' })
    await r.insert({ a: 3, firstName: 'xyz' })
    let item = await r.find({ where: { firstName: { $startsWith: 'b' } } })
    expect(item.length).toBe(0)
  })
  it('test ends with true', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    await r.insert({ a: 2, firstName: 'abc' })
    await r.insert({ a: 3, firstName: 'xyz' })
    let item = await r.find({ where: { firstName: { $endsWith: 'bc' } } })
    expect(item.length).toBe(1)
  })
  it('test ends-with false', async () => {
    const e = class {
      a = 0
      firstName = ''
    }
    describeClass(e, Entity('testNameContains', { allowApiCrud: true }), {
      a: Fields.number(),
      firstName: Fields.string(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, firstName: 'noam' })
    await r.insert({ a: 2, firstName: 'abc' })
    await r.insert({ a: 3, firstName: 'xyz' })
    let item = await r.find({ where: { firstName: { $endsWith: 'b' } } })
    expect(item.length).toBe(0)
  })
  it.skipIf(options?.excludeLiveQuery)('test live query storage', async () => {
    await createEntity(LiveQueryStorageEntity)
    const s = new DataProviderLiveQueryStorage(getDb())
    await s.ensureSchema()
    const entityKey = 'ek'
    const id = 'id'
    await s.add({ id, entityKey, data: {} })
    await s.add({ id, entityKey, data: {} })
    getRemult().clearAllCache()
    await s.add({ id, entityKey, data: {} })
    await s.keepAliveAndReturnUnknownQueryIds([id])
    await s.remove(id)
    await s.remove(id)
  })
  it('test json structure using object', async () => {
    const e = class {
      a = 0
      person!: {
        firstName: string
        lastName: string
      }
    }
    describeClass(e, Entity('testJsonStructure', { allowApiCrud: true }), {
      a: Fields.number(),
      person: Fields.object(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, person: { firstName: 'noam', lastName: 'honig' } })
    let item = await r.findFirst()
    expect(item!.person).toEqual({ firstName: 'noam', lastName: 'honig' })
  })
  @Entity('testObject', { allowApiCrud: true })
  class testObject {
    @Fields.integer()
    id = 0
    @Fields.object()
    person = { firstName: 'noam', lastName: 'honig' }
  }
  it('test object entity', async () => {
    const r = await createEntity(testObject)
    await r.insert({
      id: 1,
      person: { firstName: 'noam', lastName: 'honig' },
    })
    let item = await r.findFirst()
    expect(item!.person).toEqual({ firstName: 'noam', lastName: 'honig' })
  })
  @Entity('testObjectJson', { allowApiCrud: true })
  class testObjectJson {
    @Fields.integer()
    id = 0
    @Fields.json()
    person = { firstName: 'noam', lastName: 'honig' }
  }
  it('test object entity', async () => {
    const r = await createEntity(testObjectJson)
    await r.insert({
      id: 1,
      person: { firstName: 'noam', lastName: 'honig' },
    })
    let item = await r.findFirst()
    expect(item!.person).toEqual({ firstName: 'noam', lastName: 'honig' })
    await r.update(1, { person: { firstName: 'maayan', lastName: 'honig' } })
    expect(await r.findFirst()).toMatchInlineSnapshot(`
      testObjectJson {
        "id": 1,
        "person": {
          "firstName": "maayan",
          "lastName": "honig",
        },
      }
    `)
  })
  it('test json structure', async () => {
    const e = class {
      a = 0
      person!: {
        firstName: string
        lastName: string
      }
    }
    describeClass(e, Entity('testJsonFieldType', { allowApiCrud: true }), {
      a: Fields.number(),
      person: Fields.json(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, person: { firstName: 'noam', lastName: 'honig' } })
    let item = await r.findFirst()
    expect(item!.person).toEqual({ firstName: 'noam', lastName: 'honig' })
  })
  it('test json structure 2', async () => {
    const e = class {
      a = 0
      items: string[] = []
    }
    describeClass(e, Entity('testJsonFieldType2', { allowApiCrud: true }), {
      a: Fields.number(),
      items: Fields.json(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, items: ['a', 'b'] })
    let item = await r.findFirst()
    expect(item!.items).toEqual(['a', 'b'])
    //expect(await r.count({ items: { $contains: "b" } })).toBe(1)
  })

  it.skipIf(options?.excludeJsonStorage)('test json structure 3', async () => {
    const e = class {
      a = 0
      items: string[] = []
    }
    describeClass(e, Entity('testJsonFieldType3', { allowApiCrud: true }), {
      a: Fields.number(),
      items: Fields.object(),
    })
    const r = await createEntity(e)
    await r.insert({ a: 1, items: ['a', 'b'] })
    let item = await r.findFirst()
    expect(item!.items).toEqual(['a', 'b'])
    expect(await r.count({ items: { $contains: 'b' } })).toBe(1)
  })
  it('test relation to number id', async () => {
    const category = class {
      id = 0
      name = ''
    }
    let i = 0
    describeEntity(
      category,
      'rel_ID_categories',
      {
        id: Fields.integer(),
        name: Fields.string(),
      },
      {
        allowApiCrud: true,
        saving: (c, e) => {
          if (e.isNew) {
            c.id = i++
          }
        },
      },
    )
    const task = class {
      id = 0
      title = ''
      category?: InstanceType<typeof category>
    }

    describeEntity(
      task,
      'rel_ID_task',
      {
        id: Fields.integer(),
        title: Fields.string(),
        category: Field(() => category),
      },
      {
        allowApiCrud: true,
        saving: (task, e) => {
          if (e.isNew) task.id = i++
        },
      },
    )
    const catRepo = await createEntity(category)
    const taskRepo = await createEntity(task)
    const cat = await catRepo.insert([{ name: 'cat0' }, { name: 'cat1' }])
    await taskRepo.insert([
      { title: 't1', category: cat[0] },
      { title: 't2', category: cat[0] },
      { title: 't3', category: cat[1] },
    ])
    expect(taskRepo.fields.category!.valueConverter.fieldTypeInDb).toBe(
      ValueConverters.Integer.fieldTypeInDb,
    )
    expect(await taskRepo.count({ category: cat[0] })).toBe(2)
    expect(await taskRepo.count({ category: cat[1] })).toBe(1)
    expect(await taskRepo.count({ category: { $id: cat[0].id } })).toBe(2)
    // },

    // { exclude: [TestDbs.mongo, TestDbs.mongoNoTrans] },
  })
  it('test relation to string id', async () => {
    const category = class {
      id = ''
      name = ''
    }
    describeClass(
      category,
      Entity('rel_ID_string_categories1', { allowApiCrud: true }),
      {
        id: Fields.cuid(),
        name: Fields.string(),
      },
    )
    const task = class {
      id = 0
      title = ''
      category?: InstanceType<typeof category>
    }
    let i = 0
    describeClass(
      task,
      Entity<InstanceType<typeof task>>('rel_ID_string_task1', {
        allowApiCrud: true,
        saving: (task, e) => {
          if (e.isNew) {
            task.id = i++
          }
        },
      }),
      {
        id: Fields.integer(),
        title: Fields.string(),
        category: Field(() => category),
      },
    )
    const catRepo = await createEntity(category)
    const taskRepo = await createEntity(task)
    const cat = await catRepo.insert([{ name: 'cat0' }, { name: 'cat1' }])
    const r = await taskRepo.insert([
      { title: 't1', category: cat[0] },
      { title: 't2', category: cat[0] },
      { title: 't3', category: cat[1] },
    ])
    expect(
      r.map(({ title, category }) => ({
        title,
        cat: category?.name,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "cat": "cat0",
          "title": "t1",
        },
        {
          "cat": "cat0",
          "title": "t2",
        },
        {
          "cat": "cat1",
          "title": "t3",
        },
      ]
    `)
    expect(
      taskRepo.fields.category!.valueConverter.fieldTypeInDb,
    ).toBeUndefined()
    expect(
      (await taskRepo.find()).map(({ title, category }) => ({
        title,
        cat: category?.name,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "cat": "cat0",
          "title": "t1",
        },
        {
          "cat": "cat0",
          "title": "t2",
        },
        {
          "cat": "cat1",
          "title": "t3",
        },
      ]
    `)
    expect(await taskRepo.count({ category: cat[0] })).toBe(2)
    expect(await taskRepo.count({ category: cat[1] })).toBe(1)
    expect(
      (await taskRepo.find({ where: { category: { $id: cat[0].id } } })).length,
    ).toBe(2)
    expect(await taskRepo.count({ category: { $id: cat[0].id } })).toBe(2)
  })

  // { exclude: [TestDbs.mongo, TestDbs.mongoNoTrans] },
  it("test update doesn't override other values", async () => {
    const catRepo = await createEntity(Categories)
    const cat = await catRepo.insert({ id: 1, categoryName: 'cat' })
    const task = class {
      id = 0
      title = ''
      completed = false
      cat?: Categories
    }
    describeClass(task, Entity('tasks', { allowApiCrud: true }), {
      id: Fields.integer(),
      title: Fields.string(),
      cat: Field(() => Categories),
      completed: Fields.boolean(),
    })
    const taskRepo = await createEntity(task)
    await taskRepo.insert({ id: 1, cat, title: 'noam' })

    {
      const aTask = (await taskRepo.findFirst({}, { useCache: false }))!
      expect(aTask.title).toBe('noam')
      expect(aTask.cat!.categoryName).toBe('cat')
      expect(aTask.completed).toBe(false)
    }

    await taskRepo.update(1, { completed: true })
    {
      const aTask = (await taskRepo.findFirst({}, { useCache: false }))!
      expect(aTask.id).toBe(1)
      expect(aTask.title).toBe('noam')
      expect(aTask.cat!.categoryName).toBe('cat')
      expect(aTask.completed).toBe(true)
    }
  })
  it("test update doesn't validate non included fields", async () => {
    const catRepo = await createEntity(Categories)
    const cat = await catRepo.insert({ id: 1, categoryName: 'cat' })
    const task = class {
      id = 0
      title = ''
      completed = false
      cat?: Categories
    }
    describeClass(task, Entity('tasks', { allowApiCrud: true }), {
      id: Fields.integer(),
      title: Fields.string({ validate: Validators.required }),
      cat: Field(() => Categories),
      completed: Fields.boolean(),
    })
    const taskRepo = await createEntity(task)
    await taskRepo.insert({ id: 1, cat, title: 'noam' })

    await taskRepo.update(1, { completed: true })
    {
      const aTask = await taskRepo.findId(1, { useCache: false })
      expect(aTask!.completed).toBe(true)
    }
  })
  it('enforces unique ids', async () => {
    @Entity('enforce_id1', { allowApiCrud: true })
    class enforceId {
      @Fields.integer()
      id = 0
    }
    const r = await createEntity(enforceId)
    await r.insert({ id: 1 })
    await expect(() => r.insert({ id: 1 })).rejects.toThrowError()
  })

  it('enforces unique ids compound', async () => {
    @Entity('enforce_id2', { allowApiCrud: true, id: { a: true, b: true } })
    class enforceId {
      @Fields.integer()
      a = 0
      @Fields.integer()
      b = 0
    }

    const r = await createEntity(enforceId)
    await r.insert({ a: 1, b: 1 })
    await expect(() => r.insert({ a: 1, b: 1 })).rejects.toThrowError()
  })
  it('enforces unique ids compound update', async () => {
    @Entity('enforce_id3', {
      allowApiCrud: true,
      id: { a: true, b: true },
    })
    class enforceId {
      @Fields.integer()
      a = 0
      @Fields.integer()
      b = 0
    }
    const r = await createEntity(enforceId)
    await r.insert({ a: 1, b: 1 })
    await r.insert({ a: 1, b: 2 })
    await expect(() =>
      r.update({ a: 1, b: 2 }, { b: 1 }),
    ).rejects.toThrowError()
  })
  it('test date', async () => {
    const person = class {
      id = 0
      theDate = new Date()
    }
    describeClass(person, Entity('person', { allowApiCrud: true }), {
      id: Fields.integer(),
      theDate: Fields.date(),
    })
    const repo = await createEntity(person)
    await repo.insert({ theDate: new Date('1976-06-16T06:32:00.000Z') })
    expect(await repo.findFirst()).toMatchInlineSnapshot(`
      person {
        "id": 0,
        "theDate": 1976-06-16T06:32:00.000Z,
      }
    `)
  })
  it('task with enum', async () => {
    const r = await createEntity(tasksWithEnum)
    await r.insert({
      title: 'a',
      priority: Priority.Critical,
    })
    const item = await r.findFirst()
    expect(item!.priority).toBe(Priority.Critical)
    expect(await r.count({ priority: Priority.Critical })).toBe(1)
    expect(await r.count({ priority: Priority.Low })).toBe(0)
  })
  it.skipIf(options?.skipAutoIncrement)('test auto increment', async () => {
    const e = await createEntity(
      entity(
        'e',
        {
          id: Fields.autoIncrement(),
          name: Fields.string(),
        },
        {
          allowApiCrud: true,
        },
      ),
    )
    expect(await e.insert({ name: 'noam' })).toMatchInlineSnapshot(`
      e {
        "id": 1,
        "name": "noam",
      }
    `)
    expect(await e.insert({ name: 'noam' })).toMatchInlineSnapshot(`
    e {
      "id": 2,
      "name": "noam",
    }
  `)
  })
  it('strange names work', async () => {
    const e = createEntity(
      entity('x', {
        id: Fields.number(),
        order: Fields.number(),
        user: Fields.string(),
      }),
    )
    await e
  })
  it('test compound id', async () => {
    const e = await createEntity(
      entity(
        'e',
        {
          a: Fields.integer(),
          b: Fields.integer(),
          name: Fields.string(),
        },
        {
          id: { a: true, b: true },
          allowApiCrud: true,
        },
      ),
    )
    expect(await e.insert({ a: 1, b: 2, name: 'noam' })).toMatchInlineSnapshot(`
      e {
        "a": 1,
        "b": 2,
        "name": "noam",
      }
    `)
    expect(await e.update('1,2', { name: 'maayan' })).toMatchInlineSnapshot(`
      e {
        "a": 1,
        "b": 2,
        "name": "maayan",
      }
    `)
    expect(await e.update('1,2', { name: 'itamar', b: 3 }))
      .toMatchInlineSnapshot(`
    e {
      "a": 1,
      "b": 3,
      "name": "itamar",
    }
  `)
  })
  describe('test relations with updates', () => {
    async function setupRelationsTest() {
      @Entity('categories_r_u', { allowApiCrud: true })
      class Category {
        @Fields.number()
        id = 0
        @Fields.string()
        name = ''
        @Relations.toMany(() => Task)
        tasks?: Task[]
      }
      @Entity('tasks_r_u', { allowApiCrud: true })
      class Task {
        @Fields.number()
        id = 0
        @Relations.toOne(() => Category)
        category?: Category
      }
      let cr = await await createEntity(Category)

      let cat = await cr.insert([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ])
      let r = await createEntity(Task)
      await r.insert([{ id: 1, category: cat[2] }])
      return { r, cat, cr }
    }

    test('insert worked', async () => {
      const { r } = await setupRelationsTest()
      expect(
        (await r.findId(1, { include: { category: true } }))!.category!.name,
      ).toBe('c')
    })
    test('update worked', async () => {
      const { r, cat } = await setupRelationsTest()
      await r.update(1, { category: cat[1] })
      expect(
        (await r.findId(1, { include: { category: true } }))!.category!.name,
      ).toBe('b')
    })

    test('test update many', async () => {
      const { r, cat } = await setupRelationsTest()
      await r.updateMany({ where: { id: 1 }, set: { category: cat[0] } })
      expect(
        (await r.findId(1, { include: { category: true } }))!.category!.name,
      ).toBe('a')
    })
    test('upsert', async () => {
      const { r, cat } = await setupRelationsTest()
      await r.upsert({ where: { id: 1 }, set: { category: cat[1] } })
      expect(
        (await r.findId(1, { include: { category: true } }))!.category!.name,
      ).toBe('b')
    })
    test('upsert many', async () => {
      const { r, cat } = await setupRelationsTest()
      await r.upsert([{ where: { id: 1 }, set: { category: cat[0] } }])
      expect(
        (await r.findId(1, { include: { category: true } }))!.category!.name,
      ).toBe('a')
    })
    test('query with relations', async () => {
      const { r } = await setupRelationsTest()
      expect(
        (
          await r
            .query({
              aggregate: {},
              orderBy: {
                id: 'asc',
              },
              include: {
                category: true,
              },
            })
            .paginator()
        ).items[0].category!.name,
      ).toBe('c')
    })
    test('relation insert many', async () => {
      const { r, cat, cr } = await setupRelationsTest()
      await cr.relations(cat[1]).tasks.insert({ id: 2 })
      expect(
        (await r.findId(2, { include: { category: true } }))?.category!.id,
      ).toBe(2)
    })
    test('relation insert many', async () => {
      const { r, cat, cr } = await setupRelationsTest()
      await cr.relations(cat[1]).tasks.insert([{ id: 2 }, { id: 3 }])
      expect(
        (await r.findId(3, { include: { category: true } }))?.category!.id,
      ).toBe(2)
    })
    test('upsert through relation', async () => {
      const { r, cat, cr } = await setupRelationsTest()
      await cr.relations(cat[1]).tasks.upsert({ where: { id: 2 } })

      expect(
        (await r.findId(2, { include: { category: true } }))?.category!.id,
      ).toBe(2)
    })
  })
  describe('test value list field type with updates', () => {
    @ValueListFieldType()
    class Status {
      static a = new Status()
      static b = new Status()
      static c = new Status()
      constructor() {}
    }

    async function setupValueListFieldTest() {
      @Entity('tasks', { allowApiCrud: true })
      class Task {
        @Fields.number()
        id = 0
        @Field(() => Status)
        status?: Status
      }

      let r = await createEntity(Task)
      await r.insert([{ id: 1, status: Status.c }])
      return { r }
    }

    test('insert worked', async () => {
      const { r } = await setupValueListFieldTest()
      expect((await r.findId(1))!.status).toBe(Status.c)
    })
    test('update worked', async () => {
      const { r } = await setupValueListFieldTest()
      await r.update(1, { status: Status.b })
      expect((await r.findId(1))!.status).toBe(Status.b)
    })

    test('test update many', async () => {
      const { r } = await setupValueListFieldTest()
      await r.updateMany({ where: { id: 1 }, set: { status: Status.a } })
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    test('upsert', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert({ where: { id: 1 }, set: { status: Status.b } })
      expect((await r.findId(1))!.status).toBe(Status.b)
    })
    test('upsert many', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert([{ where: { id: 1 }, set: { status: Status.a } }])
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    it('upsert should not update if there is nothing to update', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert([{ where: { id: 1 }, set: { status: Status.a } }])
      expect((await r.findId(1))!.status).toBe(Status.a)
      await r.upsert([
        { where: { id: 1 }, set: { status: Status.a, id: undefined } },
      ])
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    it('update should not update if there is nothing to update', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert([{ where: { id: 1 }, set: { status: Status.a } }])
      expect((await r.findId(1))!.status).toBe(Status.a)
      await r.update({ id: 1 }, { status: Status.a, id: undefined })
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    it('update should not update if there is nothing to update', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert([{ where: { id: 1 }, set: { status: Status.a } }])
      expect((await r.findId(1))!.status).toBe(Status.a)
      await r.update({ id: 1 }, { status: Status.a })
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    it('update many should not update if there is nothing to update', async () => {
      const { r } = await setupValueListFieldTest()
      await r.upsert([{ where: { id: 1 }, set: { status: Status.a } }])
      expect((await r.findId(1))!.status).toBe(Status.a)
      await r.updateMany({
        where: { id: 1 },
        set: { status: Status.a, id: undefined },
      })
      expect((await r.findId(1))!.status).toBe(Status.a)
    })
    test('query with value list', async () => {
      const { r } = await setupValueListFieldTest()
      expect(
        (
          await r
            .query({
              aggregate: {},
              orderBy: {
                id: 'asc',
              },
            })
            .paginator()
        ).items[0].status,
      ).toBe(Status.c)
    })
  })
}
@Entity('a', { allowApiCrud: true })
export class stam extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Fields.string({ maxLength: 1500 })
  title: string = ''
}
@Entity('tasksWithEnum', {
  allowApiCrud: true,
})
export class tasksWithEnum extends IdEntity {
  @Fields.string()
  title = ''
  @Fields.boolean()
  completed = false
  @Fields.object()
  priority = Priority.Low
}

export enum Priority {
  Low,
  High,
  Critical,
}

@Entity('tasksWithStringEnum', {
  allowApiCrud: true,
})
export class tasksWithStringEnum extends IdEntity {
  @Fields.string()
  title = ''
  @Fields.boolean()
  completed = false
  @Fields.object()
  priority = PriorityWithString.Low
}

export enum PriorityWithString {
  Low = 'Low',
  High = 'High',
  Critical = 'Critical',
}
