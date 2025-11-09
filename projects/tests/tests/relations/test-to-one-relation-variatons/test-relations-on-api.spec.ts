import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Field,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
} from '../../../../core'
import { DataApi } from '../../../../core/src/data-api'
import {
  TestDataApiRequest,
  TestDataApiResponse,
} from '../../TestDataApiResponse'
import { Done } from '../../Done'

describe('Test relations on api', () => {
  @Entity('categories', { allowApiCrud: true })
  class Category {
    @Fields.integer()
    id = 0
    @Fields.string()
    name = ''
    @Relations.toMany(() => Product, { defaultIncluded: true })
    products?: Product[]
  }
  @Entity('products', { allowApiCrud: true })
  class Product {
    @Fields.integer()
    id = 0
    @Fields.string()
    name = ''
    @Relations.toOne(() => Category, { defaultIncluded: true })
    category?: Category
  }
  let remult: Remult

  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    await remult.repo(Product).insert({
      id: 1,
      name: 'p1',
      category: await remult.repo(Category).insert({ id: 1, name: 'c1' }),
    })
  })
  it("shouldn't return defaultIncluded in api", async () => {
    let api = new DataApi(remult.repo(Product), remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data: any) => {
      expect(data).toMatchInlineSnapshot(`
        {
          "category": 1,
          "id": 1,
          "name": "p1",
        }
      `)
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it("shouldn't return defaultIncluded in api to many get array", async () => {
    let api = new DataApi(remult.repo(Category), remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data: any) => {
      expect(data).toMatchInlineSnapshot(`
        {
          "id": 1,
          "name": "c1",
        }
      `)
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it("shouldn't return defaultIncluded in api to many update", async () => {
    let api = new DataApi(remult.repo(Category), remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data: any) => {
      expect(data).toMatchInlineSnapshot(`
        {
          "id": 1,
          "name": "c2",
        }
      `)
      d.ok()
    }
    await api.put(t, new TestDataApiRequest(), 1, { name: 'c2' })
    d.test()
  })
  it("shouldn't return defaultIncluded in api to many", async () => {
    let api = new DataApi(remult.repo(Category), remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data: any) => {
      expect(data).toMatchInlineSnapshot(`
        [
          {
            "id": 1,
            "name": "c1",
          },
        ]
      `)
      d.ok()
    }
    await api.getArray(t, undefined!)
    d.test()
  })
  it('should return a value', async () => {
    await remult.repo(Product).insert({ name: 'a', id: 2 })
    expect(
      await remult.repo(Product).find({
        where: {
          category: { $id: 0 },
        },
      }),
    ).toMatchInlineSnapshot(`
      [
        Product {
          "category": null,
          "id": 2,
          "name": "a",
        },
      ]
    `)
  })

  it('should return a value too', async () => {
    await remult.repo(Product).insert({ name: 'a', id: 2 })
    expect(
      await remult.repo(Product).find({
        where: {
          category: null!,
        },
      }),
    ).toMatchInlineSnapshot(`
    [
      Product {
        "category": null,
        "id": 2,
        "name": "a",
      },
    ]
  `)
  })
  it('should return a value too b', async () => {
    await remult.repo(Product).insert({ name: 'a', id: 2, category: null! })
    expect(
      await remult.repo(Product).find({
        where: {
          category: null!,
        },
      }),
    ).toMatchInlineSnapshot(`
      [
        Product {
          "category": null,
          "id": 2,
          "name": "a",
        },
      ]
    `)
  })
  it('should return a value too c', async () => {
    await remult.repo(Product).insert({ name: 'a', id: 2, category: null! })
    expect(
      await remult.repo(Product).find({
        where: {
          category: { $ne: null! },
        },
      }),
    ).toMatchInlineSnapshot(`
      [
        Product {
          "category": Category {
            "id": 1,
            "name": "c1",
            "products": [
              Product {
                "category": [Circular],
                "id": 1,
                "name": "p1",
              },
            ],
          },
          "id": 1,
          "name": "p1",
        },
      ]
    `)
  })
  it('override default included', async () => {
    expect(await remult.repo(Category).find({ include: {} }))
      .toMatchInlineSnapshot(`
      [
        Category {
          "id": 1,
          "name": "c1",
          "products": [
            Product {
              "category": Category {
                "id": 1,
                "name": "c1",
                "products": [Circular],
              },
              "id": 1,
              "name": "p1",
            },
          ],
        },
      ]
    `)
  })
})
