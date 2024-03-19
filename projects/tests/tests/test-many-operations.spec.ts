import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  Repository,
} from '../../core/index.js'
import { MockRestDataProvider } from './testHelper.js'

describe('test insert many', () => {
  @Entity('e', {
    allowApiCrud: true,
  })
  class e {
    @Fields.integer()
    id: number
    @Fields.string({ required: true })
    name: string
  }
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
})
