import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  Repository,
  type EntityFilter,
  Filter,
} from '../../core/index.js'

import { TestApiDataProvider } from '../../core/server/test-api-data-provider.js'

@Entity('e', {
  allowApiCrud: true,
})
class e {
  @Fields.integer()
  id!: number
  @Fields.string({ required: true })
  name!: string
}

describe('test rest many operations', () => {
  let r: Repository<e>
  beforeEach(async () => {
    r = new Remult(TestApiDataProvider()).repo(e)
  })
  it('Insert many works', async () => {
    expect(
      await r.insert([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]),
    ).toMatchInlineSnapshot(`
      [
        e {
          "id": 1,
          "name": "a",
        },
        e {
          "id": 2,
          "name": "b",
        },
      ]
    `)
    expect(await r.count()).toBe(2)
  })
  it('Insert many works', async () => {
    await expect(() =>
      r.insert([
        { id: 1, name: 'a' },
        { id: 2, name: '' },
      ]),
    ).rejects.toMatchObject({
      message: 'Name: Should not be empty',
      modelState: {
        name: 'Should not be empty',
      },
    })
    expect(await r.count()).toBe(0)
  })
  it('test delete many without a filter shoud throw', async () => {
    await expect(() => r.deleteMany({ where: {} })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 400,
        "message": "deleteMany: requires a filter to protect against accidental delete/update of all rows",
      }
    `)
  })
  it('test update many without a filter shoud throw', async () => {
    await expect(() => r.updateMany({ where: {}, set: {} })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 400,
        "message": "updateMany: requires a filter to protect against accidental delete/update of all rows",
      }
    `)
  })
  it('test delete many all', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.deleteMany({ where: 'all' })).toBe(4)
  })
  it('test update many all', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.updateMany({ where: 'all', set: { name: 'z' } })).toBe(4)
  })
  it('test delete many', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.deleteMany({ where: { id: [1, 3, 4] } })).toBe(3)
    expect(await r.count()).toBe(1)
  })
  it('test update many', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(
      await r.updateMany({ where: { id: [1, 3, 4] }, set: { name: 'z' } }),
    ).toBe(3)
    expect(await r.count({ name: 'z' })).toBe(3)
  })
})
describe('test many operations with repo', () => {
  let r: Repository<e>
  beforeEach(async () => {
    r = new Remult(new InMemoryDataProvider()).repo(e)
  })

  it('test many delete', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.deleteMany({ where: { id: [1, 3, 4] } })).toBe(3)
    expect(await r.count()).toBe(1)
  })
  it('test update many', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(
      await r.updateMany({ where: { id: [1, 3, 4] }, set: { name: 'z' } }),
    ).toMatchInlineSnapshot('3')
    expect(await r.count({ name: 'z' })).toBe(3)
  })
  it('test delete many without a filter should throw', async () => {
    await expect(() => r.deleteMany({ where: {} })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 400,
        "message": "deleteMany: requires a filter to protect against accidental delete/update of all rows",
      }
    `)
  })
  it('test filter variations', async () => {
    function test(filter: EntityFilter<e>, empty: boolean) {
      expect(Filter.isFilterEmpty(filter)).toBe(empty)
    }
    test({ $or: [{ id: 1 }, { id: 2 }] }, false)
    test({ $or: [{ id: 1 }, {}] }, true)
    test({}, true)
    test({ id: 1 }, false)
    test({ id: [1, 2] }, false)
  })
  it('test update many without a filter shoud throw', async () => {
    await expect(() => r.updateMany({ where: {}, set: {} })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 400,
        "message": "updateMany: requires a filter to protect against accidental delete/update of all rows",
      }
    `)
  })
})
