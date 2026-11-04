import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  Relations,
  type EntityOrderBy,
  type QueryResult,
  type Repository,
} from '../../../core'
import { NullSort } from '../../../core/internals'
import type { DbTestProps } from './db-tests-props'
import type { DbTestOptions } from './db-tests'

@Entity('paginatorNullSort', { allowApiCrud: true })
class Row {
  @Fields.integer()
  id = 0
  @Fields.string()
  grp = ''
  @Fields.date({ allowNull: true })
  due: Date | null = null
  @Fields.integer({ allowNull: true })
  num: number | null = null
}

@Entity('paginatorNullSortCat', { allowApiCrud: true })
class Cat {
  @Fields.integer()
  id = 0
}

@Entity('paginatorNullSortItem', { allowApiCrud: true })
class Item {
  @Fields.integer()
  id = 0
  @Fields.integer({ allowNull: true })
  catId: number | null = null
  @Relations.toOne<Item, Cat>(() => Cat, { field: 'catId' })
  byField?: Cat
  @Relations.toOne(() => Cat, { allowNull: true })
  ref?: Cat | null
}

@Entity('paginatorNullSortDated', { allowApiCrud: true })
class Dated {
  @Fields.integer()
  id = 0
  @Fields.date()
  at: Date | null = null
  @Fields.date({ allowNull: false })
  strict = new Date(2026, 10, 7)
}

const nov = (d: number) => new Date(2026, 10, d)

const NATIVE = { asc: 'native', desc: 'native' } as const
const LOWEST = { asc: 'NULL FIRST', desc: 'NULL LAST' } as const
const HIGHEST = { asc: 'NULL LAST', desc: 'NULL FIRST' } as const

export function paginatorNullSortTests(
  { createEntity }: DbTestProps,
  options?: DbTestOptions,
) {
  afterEach(() => {
    Object.assign(NullSort, NATIVE)
  })

  async function seed(rows: Partial<Row>[]) {
    const r = await createEntity(Row)
    await r.insert(rows.map((row, i) => ({ id: i + 1, ...row })))
    return r
  }

  async function nums(r: Repository<Row>, num: 'asc' | 'desc') {
    return (await r.find({ orderBy: { num } })).map((x) => x.num)
  }

  async function walk(query: QueryResult<any, any>, rowCount: number) {
    const ids: number[] = []
    let page = await query.paginator()
    ids.push(...page.items.map((x) => x.id))
    // A repeated page must fail the assertion, not hang the suite.
    while (page.hasNextPage && ids.length <= rowCount) {
      page = await page.nextPage()
      ids.push(...page.items.map((x) => x.id))
    }
    return ids
  }

  /** `find` is the oracle. */
  async function expectEveryPageSizeMatchesFind(
    r: Repository<any>,
    orderBy: EntityOrderBy<any>,
    rowCount: number,
    options = {},
  ) {
    const expected = (await r.find({ orderBy })).map((x) => x.id)
    expect(expected).toHaveLength(rowCount)
    for (let pageSize = 1; pageSize <= rowCount + 1; pageSize++) {
      expect(
        await walk(r.query({ orderBy, pageSize, ...options }), rowCount),
        `pageSize ${pageSize}`,
      ).toEqual(expected)
    }
  }

  it('sorts NULL as NullSort says', async () => {
    const r = await seed([{ num: 2 }, { num: null }, { num: 3 }])
    const groups = async () =>
      (await r.groupBy({ group: ['num'], orderBy: { num: 'asc' } })).map(
        (x) => x.num,
      )
    Object.assign(NullSort, LOWEST)
    expect(await nums(r, 'asc')).toEqual([null, 2, 3])
    expect(await nums(r, 'desc')).toEqual([3, 2, null])
    expect(await groups()).toEqual([null, 2, 3])
    Object.assign(NullSort, HIGHEST)
    if (options?.nullsOnlyLowest) {
      await expect(nums(r, 'asc')).rejects.toThrow('NullSort.asc')
      await expect(nums(r, 'desc')).rejects.toThrow('NullSort.desc')
      return
    }
    expect(await nums(r, 'asc')).toEqual([2, 3, null])
    expect(await nums(r, 'desc')).toEqual([null, 3, 2])
    expect(await groups()).toEqual([2, 3, null])
  })

  it('treats a Date as nullable, as its column is', async () => {
    const r = await createEntity(Dated)
    await r.insert([{ id: 1, at: nov(8) }, { id: 2 }, { id: 3, at: nov(7) }])
    expect(r.metadata.fields.at.allowNull).toBe(true)
    expect(r.metadata.fields.strict.allowNull).toBe(false)
    Object.assign(NullSort, LOWEST)
    expect((await r.find({ orderBy: { at: 'asc' } })).map((x) => x.id)).toEqual(
      [2, 3, 1],
    )
    expect((await r.find({ where: { at: null! } })).map((x) => x.id)).toEqual([
      2,
    ])
    expect(
      (await r.find({ where: { at: { $ne: null } } })).map((x) => x.id),
    ).toEqual([1, 3])
  })

  describe.each([
    ['NULL lowest', LOWEST],
    ['NULL highest', HIGHEST],
    ['native', NATIVE],
  ] as const)('%s', (_, order) => {
    describe.each(['asc', 'desc'] as const)(
      'paginator with NULL in a sort key %s',
      (dir) => {
        beforeEach(async (ctx) => {
          if (order === HIGHEST && options?.nullsOnlyLowest) ctx.skip()
          // Native, the paginator holds only where the database sorts NULL lowest.
          if (order === NATIVE) {
            const probe = await seed([{ num: 1 }, {}])
            const [first] = await nums(probe, dir)
            await probe.deleteMany({ where: { id: [1, 2] } })
            if ((first === null) !== (dir === 'asc')) ctx.skip()
          }
          Object.assign(NullSort, order)
        })

        it('reaches every row when a page ends on either side of the NULLs', async () => {
          const r = await seed([
            { due: nov(8) },
            { due: null },
            { due: nov(7) },
            { due: null },
            { due: nov(8) },
            { due: nov(9) },
            { due: null },
          ])
          await expectEveryPageSizeMatchesFind(r, { due: dir, id: 'asc' }, 7)
        })

        it('reaches every row when every value is NULL', async () => {
          const r = await seed([{}, {}, {}, {}])
          await expectEveryPageSizeMatchesFind(r, { due: dir, id: 'asc' }, 4)
        })

        it('reaches every row when the nullable key is not the first', async () => {
          const r = await seed([
            { grp: 'a', due: nov(7) },
            { grp: 'a', due: nov(8) },
            { grp: 'b', due: null },
            { grp: 'b', due: nov(7) },
            { grp: 'b', due: null },
            { grp: 'c', due: null },
            { grp: 'd', due: nov(7) },
          ])
          await expectEveryPageSizeMatchesFind(
            r,
            { grp: 'asc', due: dir, id: 'asc' },
            7,
          )
        })

        it('reaches every row with two nullable keys', async () => {
          const r = await seed([
            { num: null, due: null },
            { num: 1, due: nov(7) },
            { num: 1, due: null },
            { num: null, due: nov(7) },
            { num: 2, due: null },
            { num: 2, due: nov(8) },
          ])
          await expectEveryPageSizeMatchesFind(
            r,
            { num: dir, due: dir, id: 'asc' },
            6,
          )
        })

        // In memory, `null > -5` is true.
        it('reaches every row on negative numbers', async () => {
          const r = await seed([
            { num: -5 },
            { num: null },
            { num: 0 },
            { num: null },
            { num: 5 },
          ])
          await expectEveryPageSizeMatchesFind(r, { num: dir, id: 'asc' }, 5)
        })

        it('reaches every row when iterating the query', async () => {
          const r = await seed([
            { due: nov(7) },
            { due: null },
            { due: nov(8) },
            { due: null },
            { due: null },
          ])
          const orderBy: EntityOrderBy<Row> = { due: dir, id: 'asc' }
          const ids: number[] = []
          for await (const row of r.query({ orderBy, pageSize: 2 })) {
            ids.push(row.id)
            if (ids.length > 5) break
          }
          expect(ids).toEqual((await r.find({ orderBy })).map((x) => x.id))
        })

        it.each([
          ['turns NULL', [1, 2, 3, 4, 5], null],
          ['leaves NULL', [null, null, null, null, null], 9],
        ])(
          'reaches each row and ends when a sort key %s while paging',
          async (_, nums, updated) => {
            const r = await seed(nums.map((num) => ({ num })))
            const ids: number[] = []
            let page = await r
              .query({ orderBy: { num: dir, id: 'asc' }, pageSize: 2 })
              .paginator()
            while (true) {
              for (const row of page.items) {
                ids.push(row.id)
                await r.update(row.id, { num: updated })
              }
              if (!page.hasNextPage || ids.length > 20) break
              page = await page.nextPage()
            }
            // As with any keyset, a row moved ahead of the cursor comes back.
            expect([...new Set(ids)].sort()).toEqual([1, 2, 3, 4, 5])
            expect(page.hasNextPage).toBe(false)
          },
        )

        // `ref` without `include` is not loaded: its value must come from the id.
        it.each([
          ['byField', {}],
          ['ref', {}],
          ['ref', { include: { ref: true } }],
        ])(
          'reaches every row sorted on relation %s %j',
          async (relation, options) => {
            const cats = await createEntity(Cat)
            const [one, two] = await cats.insert([{ id: 1 }, { id: 2 }])
            const r = await createEntity(Item)
            await r.insert(
              [two, null, one, null, two, one].map((cat, i) => ({
                id: i + 1,
                catId: cat?.id ?? null,
                ref: cat,
              })),
            )
            await expectEveryPageSizeMatchesFind(
              r,
              { [relation]: dir, id: 'asc' },
              6,
              options,
            )
          },
        )
      },
    )
  })
}
