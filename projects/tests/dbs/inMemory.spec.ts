import { beforeEach, describe, expect, it } from 'vitest'
import type { DataProvider } from '../../core'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  describeClass,
  describeEntity,
} from '../../core'
import { allDbTests } from './shared-tests'

describe('In Memory Tests', () => {
  var db: InMemoryDataProvider
  let remult: Remult

  beforeEach(() => {
    db = new InMemoryDataProvider()
    remult = new Remult(db)
  })
  allDbTests(
    {
      getDb() {
        return db
      },
      getRemult() {
        return remult
      },
      createEntity: async (entity) => remult.repo(entity),
    },
    {
      excludeTransactions: true,
      excludeLiveQuery: true,
    },
  )
  it("test doesn't store server expressions and db readonly", async () => {
    const c = class {
      id = 0
      a = ''
      b = ''
      c = ''
    }
    describeEntity(c, 'c', {
      id: Fields.number(),
      a: Fields.string(),
      b: Fields.string({ serverExpression: () => 'x' }),
      c: Fields.string({ dbReadOnly: true }),
    })
    await remult.repo(c).insert({ id: 1, a: 'a', b: 'b', c: 'c' })
    expect(db.rows).toMatchInlineSnapshot(`
      {
        "c": [
          {
            "a": "a",
            "c": "",
            "id": 1,
          },
        ],
      }
    `)
  })
  it('test db names are respected', async () => {
    const c = class {
      id = 0
      a = ''
    }
    describeClass(c, Entity('c'), {
      id: Fields.number(),
      a: Fields.string({ dbName: 'aaa' }),
    })
    await remult.repo(c).insert({ id: 1, a: 'a' })
    expect(db.rows).toMatchInlineSnapshot(`
      {
        "c": [
          {
            "aaa": "a",
            "id": 1,
          },
        ],
      }
    `)
    expect(await remult.repo(c).count({ a: 'a' })).toBe(1)
    await remult.repo(c).update(1, { a: 'b' }) 
    expect(db.rows).toMatchInlineSnapshot(`
      {
        "c": [
          {
            "aaa": "b",
            "id": 1,
          },
        ],
      }
    `)
  })
})
