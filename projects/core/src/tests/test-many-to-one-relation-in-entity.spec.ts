import { Remult } from '../context'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import {
  Field,
  Entity,
  EntityBase,
  rowHelperImplementation,
  EntityFilter,
  Fields,
  getEntityRef,
} from '../remult3'

import { entityFilterToJson, Filter } from '../filter/filter-interfaces'
import { Language } from './RowProvider.spec'


import { SqlDatabase } from '../data-providers/sql-database'

import { DataApi } from '../data-api'

import { actionInfo } from '../server-action'
import { Done } from './Done'
import { TestDataApiResponse } from './TestDataApiResponse'
import { h } from './h'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'
import { Categories, Products } from './entities-for-tests'

@Entity('products')
class ProductsEager extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.string()
  name: string
  @Field(() => Categories)
  category: Categories
}
@Entity('profile')
class profile extends EntityBase {
  @Fields.string()
  id: string
  async rel() {
    return this.remult.repo(following).findFirst(
      { id: '1', profile: this },
      {
        createIfNotFound: true,
      },
    )
  }
  @Fields.boolean<profile>({
    serverExpression: async (self) => {
      await self.rel()
      return false
    },
  })
  following: boolean
  constructor(private remult: Remult) {
    super()
  }
}
@Entity('following')
class following extends EntityBase {
  @Fields.string()
  id: string
  @Field(() => profile)
  profile: profile
}

describe('many to one relation', () => {
  beforeEach(() => {(actionInfo.runningOnServer = true)})
  afterEach(() =>{ (actionInfo.runningOnServer = false)})
  it('xx', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    await remult.repo(profile).create({ id: '1' }).save()
    let p = await remult.repo(profile).findId('1')
    expect(p.following).toBe(false)
  })
  it('test that it is loaded to begin with', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let category = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    await remult.repo(Products).create({ id: 1, name: 'p1', category }).save()
    remult.clearAllCache()
    let p = await remult.repo(ProductsEager).findId(1)
    expect(p.category.id).toBe(1)
    expect(p.$.category.getId()).toBe(1)
  })
  it('test repo save', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    let category = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    let p = await remult.repo(Products).save({ name: 'p1', category })
    expect(p.category.id).toBe(1)
  })
  it('test repo save2', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    let category = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    let p = await remult.repo(Products).create({ name: 'p1' }).save()
    expect(p.category).toBeNull()
    p = await remult.repo(Products).save({ id: 0, category })
    expect(p.category.id).toBe(1)
    expect(p.name).toBe('p1')
  })
  it('test that it is loaded onDemand', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let category = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    await remult.repo(Products).create({ id: 1, name: 'p1', category }).save()
    remult.clearAllCache()
    let p = await remult.repo(ProductsEager).findId(1, { load: () => [] })
    expect(p.category).toBe(undefined)
    await p.$.category.load()
    expect(p.category.id).toBe(1)
  })
  it('test that it is loaded onDemand', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let category = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    await remult.repo(Products).create({ id: 1, name: 'p1', category }).save()
    remult.clearAllCache()
    let p = await remult.repo(ProductsEager).findFirst(
      { id: 1 },
      {
        load: () => [],
      },
    )
    expect(p.category).toBe(undefined)
    await p.$.category.load()
    expect(p.category.id).toBe(1)
  })

  it('what', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = remult.repo(Categories).create()
    cat.id = 1
    cat.name = 'cat 1'
    await cat.save()
    let p = remult.repo(Products).create()
    p.id = 10
    p.name = 'prod 10'
    p.category = cat
    expect(p.category.id).to.eq(1, 'right after set')
    //    expect(p.category.name).toBe("cat 1", "right after set");
    await p.$.category.load()
    expect(p.category.name).to.eq('cat 1', 'after set and wait load')
    await p.save()
    expect(p.category.name).to.eq('cat 1', 'after save')
    expect(mem.rows[remult.repo(Products).metadata.key][0].category).toBe(1)
    expect(p._.toApiJson().category).to.eq(1, 'to api pojo')
    p = await remult.repo(Products).findFirst()
    expect(p.id).toBe(10)
    expect(p.category.id).toBe(1)
    await p.$.category.load()
    expect(p.category.name).toBe('cat 1')
    expect(await p.$.name.load()).toBe('prod 10')
    expect(await remult.repo(Products).count({ category: cat })).toBe(1)

    let c2 = remult.repo(Categories).create()
    c2.id = 2
    c2.name = 'cat 2'
    await c2.save()
    expect(p._.wasChanged()).to.eq(false, 'x')
    expect(p.$.category.valueChanged()).to.eq(false, 'y')
    p.category = c2
    expect(p._.wasChanged()).toBe(true)
    expect(p.$.category.valueChanged()).toBe(true)
    expect(p.$.category.value.id).toBe(2)
    expect(p.$.category.originalValue.id).toBe(1)
    await p.save()
    expect(p._.wasChanged()).to.eq(false, 'a')
    expect(p.$.category.valueChanged()).toBe(false)
    expect(p.$.category.value.id).toBe(2)
    expect(p.$.category.originalValue.id).toBe(2)
    p.category = null
    await p.save()
    expect(p.$.category.inputValue).toBeNull()
    p.category = cat
    expect(p.$.category.inputValue).toBe('1')
    p.$.category.inputValue = '2'
    expect(p.category).toBe(c2)
  })

  it('test wait load', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = remult.repo(Categories).create()
    cat.id = 1
    cat.name = 'cat 1'
    await cat.save()
    let c2 = remult.repo(Categories).create()
    c2.id = 2
    c2.name = 'cat 2'
    await c2.save()
    let p = remult.repo(Products).create()
    p.id = 10
    p.name = 'prod 10'
    p.category = cat
    await p.save()
    remult = new Remult()
    remult.dataProvider = mem
    p = await remult.repo(Products).findFirst()
    p.category = c2
    await p.$.category.load()
    expect(p.category.name).toBe('cat 2')
    expect(p.$.category.value.name).toBe('cat 2')
    expect(p.$.category.originalValue.name).toBe('cat 1')
  })
  it('test null', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem

    let p = remult.repo(Products).create()
    p.id = 10
    p.name = 'prod 10'
    expect(p.category).toBe(null)
    expect(p.category === undefined).toBe(false)
    expect(p.category === null).toBe(true)
    expect(null == undefined).toBe(true)
    //expect(p.category==undefined).toBe(false);
    expect(p.category == null).toBe(true)
    await p.save()

    p = await remult.repo(Products).findFirst()
    expect(p.category).toBe(null)

    expect(await remult.repo(Products).count({ category: null })).toBe(1)
  })
  it('test stages', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem

    let p = remult.repo(Products).create()
    p.id = 10
    p.name = 'prod 10'

    let c = remult.repo(Categories).create()
    c.id = 1
    c.name = 'cat 1'
    await c.save()
    p.category = c
    await p.save()
    remult = new Remult()
    remult.dataProvider = mem
    p = await remult.repo(Products).findFirst()
    expect(p.category).toBeUndefined()
    expect(p.category === undefined).toBe(true)
    expect(p.category === null).toBe(false)
    await p.$.category.load()
    expect(p.category.name).toBe('cat 1')
  })
  it('test update from api', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem

    let p = remult.repo(Products).create()
    p.id = 10
    p.name = 'prod 10'

    let c = remult.repo(Categories).create()
    c.id = 1
    c.name = 'cat 1'
    await c.save()
    await p.save()
    expect(p.category).toBeNull()
    ;(p._ as rowHelperImplementation<Products>)._updateEntityBasedOnApi({
      category: 1,
    })
    expect(p.$.category.inputValue).toBe('1')
    await p.$.category.load()
    expect(p.category.id).toBe(c.id)
  })
  it('test easy create', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem

    let c = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 1',
      })
      .save()
    expect(c.id).toBe(1)
    expect(c.name).toBe('cat 1')

    let p = remult.repo(Products).create({
      id: 10,
      name: 'prod 10',
      category: c,
    })
    expect(p.category.id).toBe(1)
    await p.save()
    expect(p.category.id).toBe(1)
  })
  it('test filter create', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let c = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 1',
      })
      .save()
    let c2 = await remult
      .repo(Categories)
      .create({
        id: 2,
        name: 'cat 2',
      })
      .save()
    let repo = remult.repo(Products)
    await repo
      .create({
        id: 10,
        name: 'prod 10',
        category: c,
      })
      .save()
    await repo
      .create({
        id: 11,
        name: 'prod 1',
        category: c,
      })
      .save()
    await repo
      .create({
        id: 12,
        name: 'prod 12',
        category: c2,
      })
      .save()
    await repo
      .create({
        id: 13,
        name: 'prod 13',
      })
      .save()
    await repo
      .create({
        id: 14,
        name: 'prod 14',
      })
      .save()
    await repo
      .create({
        id: 15,
        name: 'prod 15',
      })
      .save()
    async function test(where: EntityFilter<Products>, expected: number) {
      expect(await repo.count(where)).toBe(expected)
      function log(x: any) {
        return x
      }
      expect(
        await repo.count(
          log(
            Filter.entityFilterFromJson(
              repo.metadata,
              log(entityFilterToJson(repo.metadata, where)),
            ),
          ),
        ),
      ).to.eq(expected, 'packed where')
    }

    await test({ category: c }, 2)
    await test({ category: null }, 3)
    await test({ category: c2 }, 1)
  })
  it('test that not too many reads are made', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()
    let p = await remult
      .repo(Products)
      .create({
        id: 10,
        name: 'prod 10',
        category: cat,
      })
      .save()
    let fetches = 0
    remult = new Remult()
    remult.dataProvider = {
      transaction: undefined,
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          find: (x) => {
            fetches++
            return r.find(x)
          },
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: r.update,
        }
      },
    }
    p = await remult.repo(Products).findFirst()
    expect(fetches).toBe(1)
    p._.toApiJson()
    expect(fetches).toBe(1)
  })
  it('test that not too many reads are made when getting multiple entities', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult(mem)

    await remult
      .repo(Products)
      .create({
        id: 10,
        name: 'prod 10',
        category: await remult
          .repo(Categories)
          .create({
            id: 1,
            name: 'cat 1',
          })
          .save(),
      })
      .save()
    await remult
      .repo(Products)
      .create({
        id: 11,
        name: 'prod 11',
        category: await remult
          .repo(Categories)
          .create({
            id: 2,
            name: 'cat 2',
          })
          .save(),
      })
      .save()
    await remult
      .repo(Products)
      .create({
        id: 12,
        name: 'prod 12',
        category: await remult
          .repo(Categories)
          .create({
            id: 3,
            name: 'cat 3',
          })
          .save(),
      })
      .save()
    let fetches = 0
    remult = new Remult()
    remult.dataProvider = {
      transaction: undefined,
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          find: (x) => {
            fetches++
            return r.find(x)
          },
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: r.update,
        }
      },
    }
    let r = await remult.repo(Products).find({ load: (x) => [x.category] })
    expect(fetches).toBe(2)
    for (const z of r) {
      await z.$.category.load()
    }
    expect(fetches).toBe(2)
  })
  it("test update only updates what's needed", async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()
    let p = await remult
      .repo(Products)
      .create({
        id: 10,
        name: 'prod 10',
        category: cat,
      })
      .save()

    let d = new Done()
    remult.dataProvider = {
      transaction: undefined,
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          find: (x) => r.find(x),
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: (id, data) => {
            d.ok()
            expect(data).toEqual({ name: 'prod 11' })
            return r.update(id, data)
          },
        }
      },
    }

    p = await remult.repo(Products).findFirst()
    p.name = 'prod 11'
    await p.save()
    d.test()
  })
  it("test is null doesn't invoke read", async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 1',
      })
      .save()
    let p = await remult
      .repo(Products)
      .create({
        id: 10,
        name: 'prod 10',
        category: cat,
      })
      .save()
    let fetches = 0
    await remult.repo(Categories).create({ id: 2, name: 'cat2' }).save()
    await remult.repo(Categories).create({ id: 3, name: 'cat3' }).save()
    remult = new Remult()
    remult.dataProvider = {
      transaction: undefined,
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          find: (x) => {
            fetches++
            return r.find(x)
          },
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: r.update,
        }
      },
    }

    p = await remult.repo(Products).findFirst()
    expect(fetches).toBe(1)
    expect(p.$.category.valueIsNull()).toBe(false)
    expect(fetches).toBe(1)
    await p.$.category.load()
    expect(fetches).toBe(2)
    p.category = 2 as any
    expect(fetches).toBe(2)
    await p.$.category.load()
    expect(fetches).toBe(3)
    expect(p.category.name).toBe('cat2')
    p.$.category.setId(3)
    expect(fetches).toBe(3)
    await p.$.category.load()
    expect(fetches).toBe(4)
    expect(p.category.name).toBe('cat3')
  })
  it('test to and from json ', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
        language: Language.Russian,
      })
      .save()
    let json = cat._.toApiJson()
    let x = await remult.repo(Categories).fromJson(json)
    expect(x.isNew()).toBe(false)
    expect(x.language).toBe(Language.Russian)
    expect(x.archive).toBe(false)
    x.name = 'cat 3'
    await x.save()
    let rows = await remult.repo(Categories).find()
    expect(rows.length).toBe(1)
    expect(rows[0].name).toBe('cat 3')
  })
  it('test to and from json 2', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()
    let p = await remult.repo(Products).create({ id: 10, name: 'p1' }).save()
    let json = p._.toApiJson()
    let x = await remult.repo(Products).fromJson(json)
    expect(x.isNew()).toBe(false)
    await p.$.category.load()
    expect(p.category).toBe(null)
    p.category = cat
    await p.save()

    json = p._.toApiJson()
    x = await remult.repo(Products).fromJson(json)
    expect(x.isNew()).toBe(false)
    await p.$.category.load()
    expect(p.category.id).toBe(cat.id)
  })
  it('test to and from json 2', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await (
      await remult.repo(Categories).fromJson(
        {
          id: 1,
          name: 'cat 2',
        },
        true,
      )
    ).save()
    expect(await remult.repo(Categories).count()).toBe(1)
  })
  it('test lookup with create', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()
    let p = await remult
      .repo(Products)
      .findFirst({ id: 10, category: cat }, { createIfNotFound: true })
    expect(p.isNew()).toBe(true)
    expect(p.id).toBe(10)
    expect((await p.$.category.load()).id).toBe(cat.id)
  })
  it('test set with id', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()

    let p = remult.repo(Products).create({
      id: 10,
      category: 1 as any,
    })
    expect(p.id).toBe(10)
    expect((await p.$.category.load()).id).toBe(cat.id)
  })
  it('test set with json object', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    let cat = await remult
      .repo(Categories)
      .create({
        id: 1,
        name: 'cat 2',
      })
      .save()

    let p = remult.repo(Products).create({
      id: 10,
      category: cat._.toApiJson(),
    })
    expect(p.id).toBe(10)
    expect((await p.$.category.load()).id).toBe(cat.id)
    expect((await p.$.category.load()).isNew()).toBe(false)
  })
 
  it('test filter with id', async () => {
    let mem = new InMemoryDataProvider()
    let remult = new Remult()
    remult.dataProvider = mem
    const c1 = await remult
      .repo(Categories)
      .create({ id: 1, name: 'cat 1' })
      .save()
    const c2 = await remult
      .repo(Categories)
      .create({ id: 2, name: 'cat 2' })
      .save()
    const c3 = await remult
      .repo(Categories)
      .create({ id: 3, name: 'cat 3' })
      .save()
    await remult.repo(Products).create({ id: 10, category: c1 }).save()
    await remult.repo(Products).create({ id: 20, category: c2 }).save()
    await remult.repo(Products).create({ id: 30, category: c3 }).save()
    expect(await remult.repo(Products).count({ category: { $id: 1 } })).toBe(1)
    expect(
      await remult.repo(Products).count({ category: { $id: [2, 3] } }),
    ).toBe(2)
    expect(
      await remult.repo(Products).count({ category: { $id: { $ne: 1 } } }),
    ).toBe(2)
    expect(
      await remult.repo(Products).count({ category: { $id: { $ne: [2, 3] } } }),
    ).toBe(1)
    expect(
      await remult.repo(Products).count({ category: { $id: { $in: [2, 3] } } }),
    ).toBe(2)
    expect(
      await remult
        .repo(Products)
        .count({ category: { $id: { $nin: [2, 3] } } }),
    ).toBe(1)
  })
  it('test cache', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    const cat = await remult
      .repo(Categories)
      .insert({ id: 1, name: 'c1', archive: true })
    cat['x'] = true
    const p = await remult.repo(Products2).insert({ id: 1, name: 'p1', cat })
    await p.$.cat.load()
    expect(p.cat['x']).toBe(true)
    expect((p.cat as Categories).archive).toBe(true)
  })
  it('test cache2', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    const cat = await remult
      .repo(Categories)
      .insert({ id: 1, name: 'c1', archive: true })
    cat['x'] = true
    const p = await remult
      .repo(Products2)
      .insert({ id: 1, name: 'p1', cat: { id: 1, name: 'b' } })
    await p.$.cat.load()
    expect((p.cat as Categories).archive).toBe(undefined)
  })
})

@Entity('products2')
class Products2 extends EntityBase {
  @Fields.integer()
  id: number = 0
  @Fields.string()
  name: string = ''
  @Field(() => Categories)
  cat: { id: number; name: string }
}

export type test<Type> = {
  [Properties in keyof Type]: Type[Properties]
}
export type test2<Type> = Partial<test<Type>>
let z: test2<Categories>
z = {
  id: 3,
  name: 'noam',
}

describe('Test entity relation and count finds', () => {
  it('test it', async () => {
    let mem = new InMemoryDataProvider()
    let c = new Remult()
    c.dataProvider = mem
    await c.repo(h).create({ id: '1' }).save()
    expect(mem.rows['h'][0]).toEqual({ id: '1', refH: '', refHId: '' })
    let countFind = 0
    c = new Remult()
    c.dataProvider = {
      transaction: mem.transaction,
      getEntityDataProvider: (x) => {
        let r = mem.getEntityDataProvider(x)
        return {
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: r.update,
          find: (o) => {
            countFind++
            return r.find(o)
          },
        }
      },
    }
    let h1 = await c.repo(h).findId('1')
    await h1.$.refH.load()
    expect(countFind).toBe(1)
  })
  it('test api', async () => {
    let mem = new InMemoryDataProvider()
    let c = new Remult()
    c.dataProvider = mem
    let a = await c.repo(h).create({ id: 'a' }).save()
    let b = await c.repo(h).create({ id: 'b' }).save()
    await c.repo(h).create({ id: 'd', refH: a }).save()
    c = new Remult() //clear the cache;
    c.dataProvider = mem
    let api = new DataApi(c.repo(h), c)
    let t = new TestDataApiResponse()
    let done = new Done()
    t.success = (d) => {
      expect(d.id).toBe('d')
      expect(d.refH).toBe('b')
      expect(d.refHId).toBe('b')
      done.ok()
    }
    await api.put(t, 'd', { refH: 'b' })
    done.test()
  })

  it("test api get array doesn't load", async () => {
    let mem = new InMemoryDataProvider()
    let c = new Remult()
    c.dataProvider = mem
    let a = await c.repo(h).create({ id: 'a' }).save()
    let b = await c.repo(h).create({ id: 'b' }).save()
    await c.repo(h).create({ id: 'd', refH: a }).save()
    c = new Remult() //clear the cache;
    let fetches = 0
    c.dataProvider = {
      transaction: undefined,
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          find: (x) => {
            fetches++
            return r.find(x)
          },
          count: r.count,
          delete: r.delete,
          insert: r.insert,
          update: r.update,
        }
      },
    } //clear the cache;
    let api = new DataApi(c.repo(h), c)
    let t = new TestDataApiResponse()
    let done = new Done()
    t.success = (d) => {
      done.ok()
    }
    await api.getArray(t, {
      get: (key) => {
        if (key == 'id') return 'd'
      },
    })
    done.test()
    expect(fetches).toBe(1)
  })
})

@Entity('testUpdateDate')
export class testUpdateDate extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.date()
  date: Date = new Date(176, 6, 16)
}
it("test that it doesn't save if it doesn't need to", async () => {
  let mem = new InMemoryDataProvider()
  let updates = 0
  let repo = new Remult({
    transaction: undefined,
    getEntityDataProvider: (e) => {
      let r = mem.getEntityDataProvider(e)
      return {
        find: (x) => {
          return r.find(x)
        },
        count: r.count,
        delete: r.delete,
        insert: (x) => r.insert(x),
        update: (id, x) => {
          updates++
          return r.update(id, x)
        },
      }
    },
  }).repo(testUpdateDate)
  await Promise.all(await repo.find().then((x) => x.map((y) => repo.delete(y))))
  var r = await repo.create({ id: 1 }).save()
  expect(updates).toBe(0)
  await r.save()
  expect(updates).toBe(0)
  r.date = new Date(1978, 3, 15)
  await r.save()
  expect(updates).toBe(1)
})
it('test set uuid', async () => {
  const remult = new Remult(new InMemoryDataProvider())
  const x = await remult.repo(Contact).insert({ id: 'a', name: 'a' })
  expect(x.id).toBe('a')
})

@Entity('contact')
class Contact {
  @Fields.uuid()
  id!: string
  @Fields.string()
  name = ''
}
@Entity('tag')
class Tags {
  @Fields.uuid()
  id!: string
  @Field(() => Contact)
  contact!: Contact
}
describe('Test many to one without active record', () => {
  it('should work', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    const c = await remult.repo(Contact).insert({ name: 'c1' })
    const t = await remult.repo(Tags).insert({ contact: c })
    expect(getEntityRef(t).fields.contact.getId()).toBe(c.id)
  })
})
