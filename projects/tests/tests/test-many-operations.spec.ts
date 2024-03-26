import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  Repository,
} from '../../core/index.js'
import { MockRestDataProvider } from './testHelper.js'

@Entity('e', {
  allowApiCrud: true,
})
class e {
  @Fields.integer()
  id: number
  @Fields.string({ required: true })
  name: string
}

describe('test rest many operations', () => {
  let r: Repository<e>
  beforeEach(async () => {
    let backendRemult = new Remult(new InMemoryDataProvider())
    r = new Remult(new MockRestDataProvider(backendRemult)).repo(e)
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
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "message": "Name: Should not be empty",
        "modelState": {
          "name": "Should not be empty",
        },
      }
    `)
    expect(await r.count()).toBe(0)
  })
  it('test delete many', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.deleteMany({ id: [1, 3, 4] })).toBe(3)
    expect(await r.count()).toBe(1)
  })
  it('test update many', async () => {
    await r.insert([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ])
    expect(await r.updateMany({ id: [1, 3, 4] }, { name: 'z' })).toBe(3)
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
    expect(await r.deleteMany({ id: [1, 3, 4] })).toBe(3)
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
      await r.updateMany({ id: [1, 3, 4] }, { name: 'z' }),
    ).toMatchInlineSnapshot('3')
    expect(await r.count({ name: 'z' })).toBe(3)
  })
})
