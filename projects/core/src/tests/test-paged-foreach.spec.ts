import { createData } from './createData'
import { Remult, queryConfig } from '../context'
import {
  Entity,
  EntityBase,
  Field,
  EntityOrderBy,
  RepositoryImplementation,
  EntityFilter,
  Fields,
} from '../remult3'
import { Categories } from './remult-3-entities'
import { FieldMetadata } from '../column-interfaces'
import { Sort } from '../sort'
import { CompoundIdField } from '../column'
import { entityFilterToJson, Filter } from '../filter/filter-interfaces'

import { SqlDatabase } from '../..'
import { testRestDb } from './testHelper'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

describe('test paged foreach ', () => {
  queryConfig.defaultPageSize = 2

  it('basic foreach with where', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let i = 0
    for await (const x of c.query({ where: { categoryName: { $gte: 'n' } } })) {
      expect(x.id).toBe([1, 2, 3, 4][i++])
    }
    expect(i).toBe(4)
  })
  it('basic foreach with where 2', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let i = 0
    for await (const x of c.query({
      where: { categoryName: { '>=': 'n' } },
    })) {
      expect(x.id).toBe([1, 2, 3, 4][i++])
    }
    expect(i).toBe(4)
  })
  it('basic foreach with order by', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let i = 0
    for await (const x of c.query({
      orderBy: { categoryName: 'asc' },
    })) {
      expect(x.id).toBe([5, 1, 4, 2, 3][i++])
    }
    expect(i).toBe(5)

    expect(
      (
        await c.findFirst(
          {},
          {
            orderBy: { categoryName: 'asc' },
          },
        )
      ).id,
    ).toBe(5)
  })

  it('basic foreach with order by desc', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let i = 0
    for await (const x of c.query({
      orderBy: { categoryName: 'desc' },
    })) {
      expect(x.id).toBe([3, 2, 4, 1, 5][i++])
    }

    expect(i).toBe(5)
  })
  it('iterate', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    var i = 0
    for await (const x of c.query()) {
      expect(x.id).toBe(++i)
    }

    expect(i).toBe(5)
  })
  it('paginate', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let p = await c.query().paginator()
    expect(p.items.length).toBe(2)
    expect(await p.count()).toBe(5)
    expect(p.items.map((x) => x.id)).toEqual([1, 2])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([3, 4])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([5])
    expect(p.hasNextPage).toBe(false)
  })
  it('paginate3', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'aoam')
      await insert(2, 'bael')
      await insert(3, 'coni')
      await insert(4, 'dhay')
      await insert(5, 'edo')
    })
    let p = await c
      .query({
        where: {
          $or: [
            { categoryName: { $contains: '' } },
            { categoryName: { $contains: '' } },
          ],
        },
        orderBy: { categoryName: 'asc' },
      })
      .paginator()
    expect(p.items.length).toBe(2)
    expect(await p.count()).toBe(5)
    expect(p.items.map((x) => x.id)).toEqual([1, 2])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([3, 4])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([5])
    expect(p.hasNextPage).toBe(false)
  })
  it('paginate2', async () => {
    testRestDb(async ({ remult }) => {
      let c = remult.repo(Categories)
      await c.insert([
        { id: 1, categoryName: 'aoam' },
        { id: 2, categoryName: 'bael' },
      ])
      await c.insert({ id: 3, categoryName: 'coni' })
      await c.insert({ id: 4, categoryName: 'dhay' })
      await c.insert({ id: 5, categoryName: 'edo' })

      let p = await c
        .query({
          where: {
            $or: [
              { categoryName: { $contains: '' } },
              { categoryName: { $contains: '' } },
            ],
          },
          orderBy: { categoryName: 'asc' },
        })
        .paginator()
      expect(p.items.length).toBe(2)
      expect(await p.count()).toBe(5)
      expect(p.items.map((x) => x.id)).toEqual([1, 2])
      expect(p.hasNextPage).toBe(true)
      p = await p.nextPage()
      expect(p.items.map((x) => x.id)).toEqual([3, 4])
      expect(p.hasNextPage).toBe(true)
      p = await p.nextPage()
      expect(p.items.map((x) => x.id)).toEqual([5])
      expect(p.hasNextPage).toBe(false)
    })
  })
  it('paginate', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    let p = await c.query({
      pageSize: 3,
    })

    expect((await p.getPage()).map((x) => x.id)).toEqual([1, 2, 3])
    expect((await p.getPage(2)).map((x) => x.id)).toEqual([4, 5])
  })
  it('paginate on boundries', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
    })
    let p = await c.query().paginator()
    expect(p.items.length).toBe(2)
    expect(await p.count()).toBe(4)
    expect(p.items.map((x) => x.id)).toEqual([1, 2])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([3, 4])
    expect(p.hasNextPage).toBe(true)
    p = await p.nextPage()
    expect(p.items.map((x) => x.id)).toEqual([])
    expect(p.hasNextPage).toBe(false)
  })
  it('test toArray', async () => {
    let [c] = await createData(async (insert) => {
      await insert(1, 'noam')
      await insert(2, 'yael')
      await insert(3, 'yoni')
      await insert(4, 'shay')
      await insert(5, 'ido')
    })
    var i = 0

    for (const x of await c.query({ pageSize: 10 }).getPage()) {
      expect(x.id).toBe(++i)
    }
    expect(i).toBe(5)
  })
  it('test make sort unique', async () => {
    let remult = new Remult()
    let e = remult.repo(Categories) as RepositoryImplementation<Categories>
    function test(
      orderBy: EntityOrderBy<Categories>,
      ...sort: FieldMetadata[]
    ) {
      let z = { ...orderBy }
      let s = Sort.createUniqueEntityOrderBy(e.metadata, orderBy)
      let expected = {}
      for (const c of sort) {
        expected[c.key] = 'asc'
      }
      expect(s).toEqual(expected)
      expect(orderBy).toEqual(z)
    }
    test({ id: 'asc' }, e.metadata.fields.id)
    test(
      { categoryName: 'asc' },
      e.metadata.fields.categoryName,
      e.metadata.fields.id,
    )
  })

  it('unique sort and  compound id', async () => {
    let remult = new Remult()

    let eDefs = remult.repo(theTable).metadata
    let e = eDefs.fields

    function test(orderBy: EntityOrderBy<theTable>, ...sort: FieldMetadata[]) {
      let s = Sort.createUniqueEntityOrderBy(eDefs, orderBy)
      let expected = {}
      for (const c of sort) {
        expected[c.key] = 'asc'
      }
      expect(s).toEqual(expected)
    }
    test({ b: 'asc', c: 'asc' }, e.b, e.c, e.a)
    test({ a: 'asc', b: 'asc' }, e.a, e.b)
    test({ a: 'asc' }, e.a, e.b)
    test({ b: 'asc' }, e.b, e.a)
    test({ c: 'asc' }, e.c, e.a, e.b)
  })
  it('create rows after filter compound id', async () => {
    let remult = new Remult()

    let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>
    let e = eDefs.create()
    e.a = 'a'
    e.b = 'b'
    e.c = 'c'
    async function test(
      orderBy: EntityOrderBy<theTable>,
      expectedWhere: EntityFilter<theTable>,
    ) {
      expect(
        JSON.stringify(
          await entityFilterToJson(
            eDefs.metadata,
            await eDefs.createAfterFilter(orderBy, e),
          ),
        ),
      ).toEqual(
        JSON.stringify(await entityFilterToJson(eDefs.metadata, expectedWhere)),
      )
    }
    test({ a: 'asc' }, { a: { $gt: 'a' } })
    test({ a: 'desc' }, { a: { $lt: 'a' } })
    test(
      { a: 'asc', b: 'asc' },
      {
        $or: [{ a: { $gt: 'a' } }, { a: 'a', b: { $gt: 'b' } }],
      },
    )
  })
  it('create rows after filter, values are frozen when filter is created', async () => {
    let remult = new Remult()

    let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>
    let e = eDefs.create()
    e.a = 'a'
    e.b = 'b'
    e.c = 'c'

    let f = await eDefs.createAfterFilter({ a: 'asc', b: 'asc' }, e)
    e.a = '1'
    e.b = '2'
    expect(JSON.stringify(await entityFilterToJson(eDefs.metadata, f))).toEqual(
      JSON.stringify(
        await entityFilterToJson<theTable>(eDefs.metadata, {
          $or: [{ a: { $gt: 'a' } }, { a: 'a', b: { $gt: 'b' } }],
        }),
      ),
    )
  })
  it('serialize filter with or', async () => {
    let remult = new Remult()
    let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>
    let e = eDefs.create()

    async function test(expectedWhere: EntityFilter<theTable>, expected: any) {
      expect(
        JSON.stringify(await entityFilterToJson(eDefs.metadata, expectedWhere)),
      ).toEqual(JSON.stringify(expected))
    }
    await test(
      {
        $or: [
          {
            a: 'a',
            b: { $gt: 'b' },
          },
          {
            a: { $gt: 'a' },
          },
        ],
      },
      {
        OR: [
          {
            a: 'a',
            'b.gt': 'b',
          },
          {
            'a.gt': 'a',
          },
        ],
      },
    )
    await test(
      {
        a: 'a',
        b: { $gt: 'b' },
      },
      {
        a: 'a',
        'b.gt': 'b',
      },
    )
    await test(
      {
        $or: [{ a: 'a' }, { b: { $gt: 'b' } }],
      },
      {
        OR: [{ a: 'a' }, { 'b.gt': 'b' }],
      },
    )
  })
})

@Entity<theTable>('', {
  id: (t) => new CompoundIdField(t.a, t.b),
})
class theTable extends EntityBase {
  @Fields.string()
  a: string
  @Fields.string()
  b: string
  @Fields.string()
  c: string
}
