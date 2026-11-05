import { afterEach, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  type EntityFilter,
  type Repository,
} from '../../../core'
import { NullSort } from '../../../core/internals'
import type { DbTestProps } from './db-tests-props'
import type { DbTestOptions } from './db-tests'

@Entity('nullSortRow', { allowApiCrud: true })
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

const NATIVE = { asc: 'native', desc: 'native' } as const
const LOWEST = { asc: 'NULL FIRST', desc: 'NULL LAST' } as const
const HIGHEST = { asc: 'NULL LAST', desc: 'NULL FIRST' } as const

export function nullSortTests(
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
    Object.assign(NullSort, LOWEST)
    expect(await nums(r, 'asc')).toEqual([null, 2, 3])
    expect(await nums(r, 'desc')).toEqual([3, 2, null])
    expect(await groups()).toEqual([null, 2, 3])
    Object.assign(NullSort, HIGHEST)
    if (options?.nullLowestOnly) {
      await expect(nums(r, 'asc')).rejects.toThrow('NullSort.asc')
      await expect(nums(r, 'desc')).rejects.toThrow('NullSort.desc')
      return
    }
    expect(await nums(r, 'asc')).toEqual([2, 3, null])
    expect(await nums(r, 'desc')).toEqual([null, 3, 2])
    expect(await groups()).toEqual([2, 3, null])
  })
}
