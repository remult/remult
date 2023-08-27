import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { Categories, Products } from './remult-3-entities'
import {
  createOldEntity,
  Entity,
  Field,
  Fields,
  getEntityRef,
} from '../remult3'
import { Remult } from '../context'
import { describeClass } from '../remult3/DecoratorReplacer'
import { MockRestDataProvider } from './testHelper'
import { describe, it, expect } from 'vitest'

describe('remult-3-basics', () => {
  it('test the very basics', async () => {
    let mem = new InMemoryDataProvider()
    let c = new Remult()
    c.dataProvider = mem
    expect(await c.repo(Products).count()).toBe(0)
    let p = c.repo(Products).create()
    p.id = 1
    p.name = 'noam'
    p.price = 5
    p.archived = false
    await c.repo(Products).save(p)
    expect(await c.repo(Products).count()).toBe(1)
    expect(await c.repo(Products).count({ id: 1 })).toBe(1)
    expect(await c.repo(Products).count({ id: 2 })).toBe(0)
    p = c.repo(Products).create()
    p.id = 2
    p.name = 'yael'
    p.price = 10
    p.archived = true
    await getEntityRef(p).save()
    p = new Products()
    p.id = 3
    p.name = 'yoni'
    p.price = 7
    p.archived = false
    await c.repo(Products).insert(p)
    expect(await c.repo(Products).count()).toBe(3)
    let products = await c.repo(Products).find({
      where: { id: 2 },
    })
    expect(products[0].name).toBe('yael')
    p = await c.repo(Products).findFirst({ id: 3 })
    p = await c.repo(Products).findFirst({}, { where: { id: 3 } })
    expect(p.name).toBe('yoni')
  })
  it('test save scenarios', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let error = false
    try {
      let x = await repo.save({ id: 1, categoryName: 'a' })
    } catch {
      error = true
    }
    expect(error).toBe(true)
  })
  it('test save scenarios2', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let x = await repo.save(new Categories())
    expect(x.isNew()).toBe(false)
    expect(await repo.count()).toBe(1)
  })
  it('test save scenarios3', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let x = await repo.save({ categoryName: 'a' })
    expect(x.isNew()).toBe(false)
    expect(x._.wasChanged()).toBe(false)
    expect(await repo.count()).toBe(1)
    x.categoryName = 'b'
    expect(x._.wasChanged()).toBe(true)
    await x.save()
    expect(x._.wasChanged()).toBe(false)
    expect(x.categoryName).toBe('b')
    await x.delete()
    expect(await repo.count()).toBe(0)
  })
  it('test save scenarios4', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let x = await repo.insert({ id: 1, categoryName: 'a' })
    expect(x.isNew()).toBe(false)
    expect(x._.wasChanged()).toBe(false)
    expect(await repo.count()).toBe(1)
    x.categoryName = 'b'
    expect(x._.wasChanged()).toBe(true)
    await x.save()
    expect(x._.wasChanged()).toBe(false)
    expect(x.categoryName).toBe('b')
    await x.delete()
    expect(await repo.count()).toBe(0)
  })
  it('test save scenarios 5', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    await repo.insert({ id: 1, categoryName: 'a' })
    let x = await repo.save({ id: 1, categoryName: 'c' })
    expect(x.isNew()).toBe(false)
    expect(x.categoryName).toBe('c')
    expect(x._.wasChanged()).toBe(false)
    expect(await repo.count()).toBe(1)
    x.categoryName = 'b'
    expect(x._.wasChanged()).toBe(true)
    await x.save()
    expect(x._.wasChanged()).toBe(false)
    expect(x.categoryName).toBe('b')
    await x.delete()
    expect(await repo.count()).toBe(0)
  })
  it('test save scenarios 6', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    await repo.create({ id: 1, categoryName: 'a' }).save()
    let x = await repo.update(1, { id: 2, categoryName: 'c' })
    expect(x.isNew()).toBe(false)
    expect(x.categoryName).toBe('c')
    expect(x._.wasChanged()).toBe(false)
    expect(await repo.count()).toBe(1)
    expect(x.id).toBe(2)
    expect(x.categoryName).toBe('c')
  })
  it('test save scenarios 7', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    await repo.create({ id: 1, categoryName: 'a' }).save()
    let x = await repo.update(1, { id: 2, description: 'c' })
    expect(x.isNew()).toBe(false)
    expect(x.categoryName).toBe('a')
    expect(x.description).toBe('c')
  })
  it('test delete scenarios', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let r = await repo.create({ id: 1, categoryName: 'a' }).save()
    await r.delete()
    expect(await repo.count()).toBe(0)
  })
  it('test delete scenarios 1', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let r = await repo.create({ id: 1, categoryName: 'a' }).save()
    await repo.delete(r)
    expect(await repo.count()).toBe(0)
  })
  it('test delete scenarios 2', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    await repo.create({ id: 1, categoryName: 'a' }).save()
    await repo.delete(1)
    expect(await repo.count()).toBe(0)
  })
  it('test insert works with active record and fails on existing one', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    var r = await repo.insert(repo.create({ id: 1 }))
    expect(await repo.count()).toBe(1)
    let ok = false
    try {
      await repo.insert(r)
      ok = true
    } catch {}
    expect(ok).toBe(false)
  })
  it('save works with array', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let repo = remult.repo(Categories)
    let items = (await repo.insert([{ id: 1 }, { id: 2 }])).map((y) => ({
      ...y,
      categoryName: y.id.toString(),
    }))
    await repo.save(items)
    expect(items[0].categoryName).toBe('1')
  })
  it('test update of object', async () => {
    const product = class {
      id = 0
      category!: Categories
    }
    describeClass(product, Entity('pr'), {
      id: Fields.number(),
      category: Field(() => Categories),
    })
    var remult = new Remult(new InMemoryDataProvider())
    const [c1, c2] = await remult.repo(Categories).insert([
      { id: 1, categoryName: 'cat1' },
      { id: 2, categoryName: 'cat2' },
    ])
    const r = remult.repo(product)
    let p = await r.insert({ id: 1, category: c1 })
    expect(p.category.id).toBe(1)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(1)
    p = await r.update(1, { ...p, category: c2 })
    expect(p.id).toBe(1)
    expect(p.category.id).toBe(2)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(2)
    p = await r.update(1, {
      ...p,

      category: { id: 1 } as any,
    })
    expect(p.id).toBe(1)
    expect(p.category.id).toBe(1)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(1)
    expect(p.category.categoryName).toBe('cat1')
  })
  it('test update of object data api', async () => {
    const product = class {
      id = 0
      category!: Categories
    }
    describeClass(product, Entity('pr', { allowApiCrud: true }), {
      id: Fields.number(),
      category: Field(() => Categories),
    })

    var sr = new Remult(new InMemoryDataProvider())
    var dp = new MockRestDataProvider(sr)
    var remult = new Remult(dp)
    const [c1, c2] = await remult.repo(Categories).insert([
      { id: 1, categoryName: 'cat1' },
      { id: 2, categoryName: 'cat2' },
    ])
    const r = remult.repo(product)
    let p = await r.insert({ id: 1, category: c1 })
    expect(p.category.id).toBe(1)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(1)
    p = await r.update(1, { ...p, category: c2 })
    expect(p.id).toBe(1)
    expect(p.category.id).toBe(2)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(2)
    p = await r.update(1, {
      ...p,

      category: { id: 1 } as any,
    })
    expect(p.id).toBe(1)
    expect(p.category.id).toBe(1)
    p = await r.findId(1, { useCache: false })
    expect(p.category.id).toBe(1)
    expect(p.category.categoryName).toBe('cat1')
  })
})
