import { describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  Relations,
  type EntityOrderBy,
  type QueryResult,
  type Repository,
} from '../../../core'
import type { DbTestProps } from './db-tests-props'

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

const nov = (d: number) => new Date(2026, 10, d)

export function paginatorNullSortTests({ createEntity }: DbTestProps) {
  async function seed(rows: Partial<Row>[]) {
    const r = await createEntity(Row)
    await r.insert(rows.map((row, i) => ({ id: i + 1, ...row })))
    return r
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

  it('sorts NULL first on asc, last on desc', async () => {
    const r = await seed([{ num: 2 }, { num: null }, { num: 3 }])
    const nums = async (num: 'asc' | 'desc') =>
      (await r.find({ orderBy: { num } })).map((x) => x.num)
    expect(await nums('asc')).toEqual([null, 2, 3])
    expect(await nums('desc')).toEqual([3, 2, null])
    expect(
      (await r.groupBy({ group: ['num'], orderBy: { num: 'asc' } })).map(
        (x) => x.num,
      ),
    ).toEqual([null, 2, 3])
  })

  describe.each(['asc', 'desc'] as const)(
    'paginator with NULL in a sort key %s',
    (dir) => {
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
}
