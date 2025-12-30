import type { EntityFilter, EntityOrderBy, Repository } from '../../core'
import {
  CompoundIdField,
  Entity,
  EntityBase,
  Fields,
  InMemoryDataProvider,
} from '../../core'
import type { FieldMetadata } from '../../core/src/column-interfaces'
import { Remult, queryConfig } from '../../core/src/context'
import { entityFilterToJson } from '../../core/src/filter/filter-interfaces'
import { Sort } from '../../core/src/sort'
import { createData } from './createData'
import { Categories } from './remult-3-entities'

import { describe, expect, it } from 'vitest'
import { testRestDb } from './testHelper'
import { getRepositoryInternals } from '../../core/src/remult3/repository-internals'
import { entity } from './dynamic-classes.js'
import type { QueryOptions, QueryResult } from '../../core/src/remult3/remult3'
import { pagedQueryResult } from '../../core/src/remult3/pagedQueryResult.js'

testPaging('test paged Query ', (r, o) => {
  o = {
    pageSize: queryConfig.defaultPageSize,
    ...o,
  }
  const getPage = async (pageNumber?: number) => {
    if ((pageNumber ?? 0) < 1) pageNumber = 1
    return r.find({ ...o, page: pageNumber, limit: o.pageSize })
  }
  return pagedQueryResult(r, o, getPage)
})

testPaging('test query ', (r, o) => r.query(o))
function testPaging(
  name: string,
  query: <T>(r: Repository<T>, options?: QueryOptions<T>) => QueryResult<T>,
) {
  describe(name, () => {
    queryConfig.defaultPageSize = 2

    it('basic foreach with where', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0
      for await (const x of query(c, {
        where: { categoryName: { $gte: 'n' } },
      })) {
        expect(x.id).toBe([1, 2, 3, 4][i++])
      }
      expect(i).toBe(4)
    })
    it('basic foreach with where 2', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0
      for await (const x of query(c, {
        where: { categoryName: { '>=': 'n' } },
      })) {
        expect(x.id).toBe([1, 2, 3, 4][i++])
      }
      expect(i).toBe(4)
    })
    it('basic foreach with order by', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0
      for await (const x of query(c, {
        orderBy: { categoryName: 'asc' },
      })) {
        expect(x.id).toBe([5, 1, 4, 2, 3][i++])
      }
      expect(i).toBe(5)

      expect(
        (await c.findFirst(
          {},
          {
            orderBy: { categoryName: 'asc' },
          },
        ))!.id,
      ).toBe(5)
    })

    it('basic foreach with order by desc', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0
      for await (const x of query(c, {
        orderBy: { categoryName: 'desc' },
      })) {
        expect(x.id).toBe([3, 2, 4, 1, 5][i++])
      }

      expect(i).toBe(5)
    })
    it('iterate', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0
      for await (const x of query(c)) {
        expect(x.id).toBe(++i)
      }

      expect(i).toBe(5)
    })
    it('paginate', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let p = await query(c).paginator()
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
      const [c] = await createData(async (insert) => {
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
      await testRestDb(async ({ remult }) => {
        const c = remult.repo(Categories)
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
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      const p = await query(c, {
        pageSize: 3,
      })

      expect((await p.getPage()).map((x) => x.id)).toEqual([1, 2, 3])
      expect((await p.getPage(2)).map((x) => x.id)).toEqual([4, 5])
    })
    it('paginate on boundries', async () => {
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
      })
      let p = await query(c).paginator()
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
      const [c] = await createData(async (insert) => {
        await insert(1, 'noam')
        await insert(2, 'yael')
        await insert(3, 'yoni')
        await insert(4, 'shay')
        await insert(5, 'ido')
      })
      let i = 0

      for (const x of await query(c, { pageSize: 10 }).getPage()) {
        expect(x.id).toBe(++i)
      }
      expect(i).toBe(5)
    })
    it('test createUniqueSort with multiple Id Columns', async () => {
      const task = new Remult(new InMemoryDataProvider()).repo(
        entity(
          'task',
          { a: Fields.number(), b: Fields.number(), c: Fields.number() },
          {
            id: {
              a: true,
              b: true,
            },
          },
        ),
      )
      expect(Sort.createUniqueEntityOrderBy(task.metadata))
        .toMatchInlineSnapshot(`
      {
        "a": "asc",
        "b": "asc",
      }
    `)
    })
    it('test createUniqueSort with multiple Id Columns', async () => {
      const task = new Remult(new InMemoryDataProvider()).repo(
        entity(
          'task',
          { a: Fields.number(), b: Fields.number(), c: Fields.number() },
          {
            id: {
              a: true,
              b: true,
            },
          },
        ),
      )
      expect(Sort.createUniqueSort(task.metadata).toEntityOrderBy())
        .toMatchInlineSnapshot(`
      {
        "a": "asc",
        "b": "asc",
      }
    `)
    })
    it('test make sort unique', async () => {
      const remult = new Remult()
      const e = remult.repo(Categories)
      function test(
        orderBy: EntityOrderBy<Categories>,
        ...sort: FieldMetadata[]
      ) {
        const z = { ...orderBy }
        const s = Sort.createUniqueEntityOrderBy(e.metadata, orderBy)
        const expected: any = {}
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
      const remult = new Remult()

      const eDefs = remult.repo(theTable).metadata
      const e = eDefs.fields

      function test(
        orderBy: EntityOrderBy<theTable>,
        ...sort: FieldMetadata[]
      ) {
        const s = Sort.createUniqueEntityOrderBy(eDefs, orderBy)
        const expected: any = {}
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
      const remult = new Remult()

      const eDefs = remult.repo(theTable)
      const e = eDefs.create()
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
              await getRepositoryInternals(eDefs)._createAfterFilter(
                orderBy,
                e,
              ),
            ),
          ),
        ).toEqual(
          JSON.stringify(
            await entityFilterToJson(eDefs.metadata, expectedWhere),
          ),
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
      const remult = new Remult()

      const eDefs = remult.repo(theTable)
      const e = eDefs.create()
      e.a = 'a'
      e.b = 'b'
      e.c = 'c'

      const f = await getRepositoryInternals(eDefs)._createAfterFilter(
        { a: 'asc', b: 'asc' },
        e,
      )
      e.a = '1'
      e.b = '2'
      expect(
        JSON.stringify(await entityFilterToJson(eDefs.metadata, f)),
      ).toEqual(
        JSON.stringify(
          await entityFilterToJson<theTable>(eDefs.metadata, {
            $or: [{ a: { $gt: 'a' } }, { a: 'a', b: { $gt: 'b' } }],
          }),
        ),
      )
    })
    it('serialize filter with or', async () => {
      const remult = new Remult()
      const eDefs = remult.repo(theTable)
      eDefs.create()

      async function test(
        expectedWhere: EntityFilter<theTable>,
        expected: any,
      ) {
        expect(
          JSON.stringify(
            await entityFilterToJson(eDefs.metadata, expectedWhere),
          ),
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
    a!: string
    @Fields.string()
    b!: string
    @Fields.string()
    c!: string
  }
}
