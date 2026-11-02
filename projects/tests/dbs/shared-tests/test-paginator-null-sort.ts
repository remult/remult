import { describe, expect, it } from 'vitest'
import {
  Entity,
  Field,
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
  @Fields.string({ allowNull: true })
  label: string | null = null
}

// The same table as `Row`, as an entity that doesn't know its columns are nullable.
@Entity('paginatorNullSortUndeclared', {
  dbName: 'paginatorNullSort',
  allowApiCrud: true,
})
class UndeclaredRow {
  @Fields.integer()
  id = 0
  @Fields.string()
  grp = ''
  @Fields.date()
  due = new Date()
  @Fields.integer()
  num = 0
  @Fields.string()
  label = ''
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

@Entity('paginatorNullSortConverted', { allowApiCrud: true })
class Converted {
  @Fields.integer()
  id = 0
  @Fields.string({ valueConverter: { toDb: (x) => x ?? '' } })
  code = ''
}

@Entity('paginatorNullSortNullAsValue', {
  dbName: 'paginatorNullSort',
  allowApiCrud: true,
})
class NullAsValue {
  @Fields.integer()
  id = 0
  @Fields.string({ valueConverter: { fromDb: (x) => x ?? '' } })
  label = ''
}

@Entity('paginatorNullSortBigKey', { allowApiCrud: true })
class BigKey {
  @Fields.integer()
  id = 0
  @Field(() => BigInt as any, {
    valueConverter: {
      fieldTypeInDb: 'integer',
      toJson: (x: any) => Number(x),
      fromJson: (x: any) => BigInt(x),
      toDb: (x: any) => Number(x),
      fromDb: (x: any) => BigInt(x),
    },
  })
  big: any = BigInt(0)
}

@Entity('paginatorNullSortStrict', { allowApiCrud: true })
class Strict {
  @Fields.integer()
  id = 0
  @Fields.string({ valueConverter: { toDb: (x: string) => x.trim() } })
  code = ''
}

@Entity('paginatorNullSortRoundTrip', { allowApiCrud: true })
class RoundTrip {
  @Fields.integer()
  id = 0
  @Fields.string({
    valueConverter: {
      toDb: (x) => x ?? '',
      fromDb: (x) => (x === '' ? null : x),
    },
  })
  code: string | null = null
}

class Money {
  constructor(public amount: number) {}
}

@Entity('paginatorNullSortObjectKey', { allowApiCrud: true })
class ObjectKey {
  @Fields.integer()
  id = 0
  @Field(() => Money, {
    valueConverter: {
      fieldTypeInDb: 'integer',
      toJson: (x) => x?.amount,
      fromJson: (x) => new Money(x),
    },
  })
  price = new Money(0)
  @Fields.integer({ allowNull: true })
  num: number | null = null
}

@Entity('paginatorNullSortRequiredRef', { allowApiCrud: true })
class RequiredRef {
  @Fields.integer()
  id = 0
  @Relations.toOne(() => Cat)
  cat!: Cat
}

const day = (d: number) => new Date(2024, 0, d)
const directions = ['asc', 'desc'] as const

export function paginatorNullSortTests({
  createEntity,
  getRemult,
}: DbTestProps) {
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

  /** `find` is the oracle: NULL position is the provider's, so the expected order must come from it. */
  async function expectEveryPageSizeMatchesFind(
    r: Repository<any>,
    orderBy: EntityOrderBy<any>,
    rowCount: number,
    options = {},
  ) {
    const expected = (await r.find({ orderBy })).map((x) => x.id)
    expect([...expected].sort((a, b) => a - b)).toEqual(
      Array.from({ length: rowCount }, (_, i) => i + 1),
    )
    for (let pageSize = 1; pageSize <= rowCount + 1; pageSize++) {
      expect(
        await walk(r.query({ orderBy, pageSize, ...options }), rowCount),
        `pageSize ${pageSize}`,
      ).toEqual(expected)
    }
  }

  describe('paginator with NULL in a sort key', () => {
    describe.each(directions)('%s', (dir) => {
      it('reaches every row when a page ends on either side of the NULLs', async () => {
        const r = await seed([
          { due: day(2) },
          { due: null },
          { due: day(1) },
          { due: null },
          { due: day(2) },
          { due: day(3) },
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
          { grp: 'a', due: day(1) },
          { grp: 'a', due: day(2) },
          { grp: 'b', due: null },
          { grp: 'b', due: day(1) },
          { grp: 'b', due: null },
          { grp: 'c', due: null },
          { grp: 'c', due: null },
          { grp: 'd', due: day(1) },
        ])
        await expectEveryPageSizeMatchesFind(
          r,
          { grp: 'asc', due: dir, id: 'asc' },
          8,
        )
      })

      it('reaches every row with two nullable keys', async () => {
        const r = await seed([
          { num: null, due: null },
          { num: 1, due: day(1) },
          { num: 1, due: null },
          { num: null, due: day(1) },
          { num: 2, due: null },
          { num: 2, due: day(2) },
        ])
        await expectEveryPageSizeMatchesFind(
          r,
          { num: dir, due: dir, id: 'asc' },
          6,
        )
      })

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
          { due: day(1) },
          { due: null },
          { due: day(2) },
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
        expect(ids).toHaveLength(5)
      })

      it('keeps its place when rows are deleted while iterating', async () => {
        const r = await seed([
          { due: day(1) },
          { due: null },
          { due: day(2) },
          { due: null },
          { due: null },
        ])
        const orderBy: EntityOrderBy<Row> = { due: dir, id: 'asc' }
        const expected = (await r.find({ orderBy })).map((x) => x.id)
        const ids: number[] = []
        for await (const row of r.query({ orderBy, pageSize: 2 })) {
          ids.push(row.id)
          await r.delete(row)
          if (ids.length > 5) break
        }
        expect(ids).toEqual(expected)
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

      it('reaches every row with an aggregate', async () => {
        const r = await seed([
          { due: day(1) },
          { due: null },
          { due: day(2) },
          { due: null },
          { due: null },
        ])
        await expectEveryPageSizeMatchesFind(r, { due: dir, id: 'asc' }, 5, {
          aggregate: {},
        })
      })

      it.each(['due', 'num', 'label'])(
        'reaches every row when %s does not declare allowNull',
        async (key) => {
          await seed([
            { grp: 'a', due: null, num: null, label: null },
            { grp: 'a', due: day(1), num: 1, label: 'a' },
            { grp: 'a', due: null, num: null, label: null },
            { grp: 'b', due: day(2), num: 2, label: 'b' },
            { grp: 'b', due: null, num: null, label: null },
          ])
          const r = getRemult().repo(UndeclaredRow)
          await expectEveryPageSizeMatchesFind(r, { [key]: dir, id: 'asc' }, 5)
          await expectEveryPageSizeMatchesFind(
            r,
            { grp: 'asc', [key]: dir, id: 'asc' },
            5,
          )
        },
      )

      it('reaches every row when a converter stores null as a value', async () => {
        const r = await createEntity(Converted)
        await r.insert(
          ['', 'a', '', 'b', ''].map((code, i) => ({ id: i + 1, code })),
        )
        await expectEveryPageSizeMatchesFind(r, { code: dir, id: 'asc' }, 5)
      })

      it('ends when a converter reads NULL as a value', async () => {
        await seed([
          { label: 'a' },
          { label: null },
          { label: 'b' },
          { label: null },
          { label: null },
        ])
        const r = getRemult().repo(NullAsValue)
        const orderBy: EntityOrderBy<NullAsValue> = { label: dir, id: 'asc' }
        const ids = await walk(r.query({ orderBy, pageSize: 2 }), 5)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('iterates a BigInt sort key', async () => {
        const r = await createEntity(BigKey)
        await r.insert([1, 2, 3].map((id) => ({ id, big: BigInt(id) })))
        const orderBy: EntityOrderBy<BigKey> = { big: dir, id: 'asc' }
        const ids: number[] = []
        for await (const row of r.query({ orderBy, pageSize: 2 })) {
          ids.push(row.id)
        }
        expect(ids).toEqual((await r.find({ orderBy })).map((x) => x.id))
      })

      it('reaches every row when a converter rejects null', async () => {
        const r = await createEntity(Strict)
        await r.insert(
          ['a', 'b', 'c', 'd'].map((code, i) => ({ id: i + 1, code })),
        )
        await expectEveryPageSizeMatchesFind(r, { code: dir, id: 'asc' }, 4)
      })

      it('reaches every row when a converter reads a value as null', async () => {
        const r = await createEntity(RoundTrip)
        await r.insert(
          [null, 'a', null, 'b', null].map((code, i) => ({ id: i + 1, code })),
        )
        await expectEveryPageSizeMatchesFind(r, { code: dir, id: 'asc' }, 5)
      })

      it('reaches every row after an object key', async () => {
        const r = await createEntity(ObjectKey)
        await r.insert(
          [
            [1, 1],
            [1, 2],
            [1, null],
            [2, null],
            [2, 1],
            [2, 2],
          ].map(([amount, num], i) => ({
            id: i + 1,
            price: new Money(amount!),
            num,
          })),
        )
        await expectEveryPageSizeMatchesFind(
          r,
          { price: 'asc', num: dir, id: 'asc' },
          6,
        )
      })

      it('keeps iterating when the loop clears its own sort key', async () => {
        const r = await seed([1, 2, 3, 4, 5].map((num) => ({ num })))
        const ids: number[] = []
        for await (const row of r.query({
          orderBy: { num: dir, id: 'asc' },
          pageSize: 1,
        })) {
          ids.push(row.id)
          await r.update(row.id, { num: null })
          if (ids.length > 20) break
        }
        expect([...new Set(ids)].sort()).toEqual([1, 2, 3, 4, 5])
      })

      it('reaches every row on a required relation with an empty id', async () => {
        const cats = await createEntity(Cat)
        const [one] = await cats.insert([{ id: 1 }])
        const r = await createEntity(RequiredRef)
        await r.insert(
          [undefined, one, undefined, one, undefined].map((cat, i) => ({
            id: i + 1,
            cat,
          })),
        )
        await expectEveryPageSizeMatchesFind(r, { cat: dir, id: 'asc' }, 5)
      })

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
    })
  })
}
