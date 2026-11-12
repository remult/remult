import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest'
import {
  Entity,
  Fields,
  Relations,
  type EntityFilter,
  type EntityOrderBy,
  type NullOrder,
  type QueryResult,
  type Repository,
} from '../../../core'
import { NullSort } from '../../../core/internals'
import type { DbTestProps } from './db-tests-props'
import type { DbTestOptions } from './db-tests'

@Entity('nullSortRow', { allowApiCrud: true })
class Row {
  @Fields.integer()
  id = 0
  @Fields.date({ allowNull: true })
  due: Date | null = null
  @Fields.integer({ allowNull: true })
  num: number | null = null
}

@Entity('nullSortCat', { allowApiCrud: true })
class Cat {
  @Fields.integer()
  id = 0
}

@Entity('nullSortItem', { allowApiCrud: true })
class Item {
  @Fields.integer()
  id = 0
  @Relations.toOne(() => Cat, { allowNull: true })
  ref?: Cat | null
}

const nov = (d: number) => new Date(2026, 10, d)
const dues = (...days: (number | null)[]) =>
  days.map((d) => ({ due: d === null ? null : nov(d) }))

export const NATIVE = 'native'
export const LOWEST: NullOrder = { asc: 'NULLS FIRST', desc: 'NULLS LAST' }
export const HIGHEST: NullOrder = { asc: 'NULLS LAST', desc: 'NULLS FIRST' }

export function nullSortTests(
  { createEntity }: DbTestProps,
  options?: DbTestOptions,
) {
  afterEach(() => {
    NullSort.order = NATIVE
  })

  async function seed(rows: Partial<Row>[]) {
    const r = await createEntity(Row)
    await r.insert(rows.map((row, i) => ({ id: i + 1, ...row })))
    return r
  }

  async function nums(r: Repository<Row>, num: 'asc' | 'desc') {
    return (await r.find({ orderBy: { num } })).map((x) => x.num)
  }

  async function walk<T extends { id: number }>(
    query: QueryResult<T>,
    rowCount: number,
  ) {
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
  async function expectEveryPageSizeMatchesFind<T extends { id: number }>(
    r: Repository<T>,
    orderBy: EntityOrderBy<T>,
    rowCount: number,
  ) {
    const expected = (await r.find({ orderBy })).map((x) => x.id)
    expect(expected).toHaveLength(rowCount)
    for (let pageSize = 1; pageSize <= rowCount + 1; pageSize++) {
      expect(
        await walk(r.query({ orderBy, pageSize }), rowCount),
        `pageSize ${pageSize}`,
      ).toEqual(expected)
    }
  }

  it('$gt, $gte, $lt and $lte never match NULL', async () => {
    const r = await seed([{ num: -5 }, { num: null }, { num: 5 }])
    const ids = async (num: EntityFilter<Row>['num']) =>
      (await r.find({ where: { num }, orderBy: { id: 'asc' } })).map(
        (x) => x.id,
      )
    expect(await ids({ $gt: -10 })).toEqual([1, 3])
    expect(await ids({ $gte: -10 })).toEqual([1, 3])
    expect(await ids({ $lt: 10 })).toEqual([1, 3])
    expect(await ids({ $lte: 10 })).toEqual([1, 3])
  })

  // Each order is the database's own in one direction, where nothing is written.
  it('sorts NULL as NullSort says', async () => {
    const r = await seed([{ num: 2 }, { num: null }, { num: 3 }])
    const groups = async () =>
      (await r.groupBy({ group: ['num'], orderBy: { num: 'asc' } })).map(
        (x) => x.num,
      )
    NullSort.order = LOWEST
    expect(await nums(r, 'asc')).toEqual([null, 2, 3])
    expect(await nums(r, 'desc')).toEqual([3, 2, null])
    expect(await groups()).toEqual([null, 2, 3])
    NullSort.order = HIGHEST
    if (options?.nullLowestOnly) {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      onTestFinished(() => warn.mockRestore())
      expect(await nums(r, 'asc')).toEqual([null, 2, 3])
      expect(warn).toHaveBeenCalledOnce()
      return
    }
    expect(await nums(r, 'asc')).toEqual([2, 3, null])
    expect(await nums(r, 'desc')).toEqual([null, 3, 2])
    expect(await groups()).toEqual([2, 3, null])
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
          if (order === HIGHEST && options?.nullLowestOnly) ctx.skip()
          // Native, the paginator holds only where the database sorts NULL lowest.
          if (order === NATIVE) {
            const probe = await seed([{ num: 1 }, {}])
            const [first] = await nums(probe, dir)
            await probe.deleteMany({ where: { id: [1, 2] } })
            if ((first === null) !== (dir === 'asc')) ctx.skip()
          }
          NullSort.order = order
        })

        it('reaches every row when a page ends on either side of the NULLs', async () => {
          const r = await seed(dues(8, null, 7, null, 8, 9, null))
          await expectEveryPageSizeMatchesFind(r, { due: dir, id: 'asc' }, 7)
        })

        it('reaches every row when every value is NULL', async () => {
          const r = await seed([{}, {}, {}, {}])
          await expectEveryPageSizeMatchesFind(r, { due: dir, id: 'asc' }, 4)
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

        it('reaches every row when iterating the query', async () => {
          const r = await seed(dues(7, null, 8, null, null))
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

        // Without `include`, `ref` is not loaded: the cursor must read its id.
        it('reaches every row sorted on an unloaded relation', async () => {
          const cats = await createEntity(Cat)
          const [one, two] = await cats.insert([{ id: 1 }, { id: 2 }])
          const r = await createEntity(Item)
          await r.insert(
            [two, null, one, null, two, one].map((ref, i) => ({
              id: i + 1,
              ref,
            })),
          )
          await expectEveryPageSizeMatchesFind(r, { ref: dir, id: 'asc' }, 6)
        })
      },
    )
  })
}
