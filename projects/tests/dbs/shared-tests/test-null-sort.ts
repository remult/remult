import { expect, it } from 'vitest'
import { Entity, Fields, type EntityFilter } from '../../../core'
import type { DbTestProps } from './db-tests-props'

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

export function nullSortTests({ createEntity }: DbTestProps) {
  async function seed(rows: Partial<Row>[]) {
    const r = await createEntity(Row)
    await r.insert(rows.map((row, i) => ({ id: i + 1, ...row })))
    return r
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
}
