import { expect, it } from 'vitest'
import { Entity, Fields, type EntityFilter } from '../../../core'
import type { DbTestProps } from './db-tests-props'

@Entity('nullFilter', { allowApiCrud: true })
class NullFilter {
  @Fields.integer()
  id = 0
  @Fields.integer({ allowNull: true })
  n: number | null = null
  @Fields.integer({ allowNull: true })
  m: number | null = null
}

// Rows (n, m): 1 → (-5, 1), 2 → (null, 1), 3 → (0, null), 4 → (5, 1).
// null is a value, and it is not 0.
const cases: [EntityFilter<NullFilter>, number[]][] = [
  [{ n: { $in: [] } }, []],
  [{ n: { $nin: [] } }, [1, 2, 3, 4]],
  [{ n: { $in: [-5, 0, 5] } }, [1, 3, 4]],
  [{ n: { $nin: [-5, 0, 5] } }, [2]],
  [{ n: { $in: [0, null!] } }, [2, 3]],
  [{ n: { $nin: [0, null!] } }, [1, 4]],
  [{ n: { $nin: [0] } }, [1, 2, 4]],
  [{ n: { $ne: 0 } }, [1, 2, 4]],
  [{ n: { $in: [null!] } }, [2]],
  [{ n: { $nin: [null!] } }, [1, 3, 4]],
  [{ n: null! }, [2]],
  [{ n: { $ne: null! } }, [1, 3, 4]],
  [{ n: { $gt: -5 } }, [3, 4]],
  [{ n: { $gte: 0 } }, [3, 4]],
  [{ n: { $lt: 5 } }, [1, 3]],
  [{ n: { $lte: 0 } }, [1, 3]],
  // Under `$not`, a null in m must not hide a null in n.
  [{ n: { $gt: -10 }, m: { $ne: null! } }, [1, 4]],
  [{ $or: [{ n: 0 }, { m: null! }] }, [3]],
]

export function nullFilterTests({ createEntity }: DbTestProps) {
  it('null filters', async () => {
    const repo = await createEntity(NullFilter)
    const rows = await repo.insert([
      { id: 1, n: -5, m: 1 },
      { id: 2, n: null!, m: 1 },
      { id: 3, n: 0, m: null! },
      { id: 4, n: 5, m: 1 },
    ])
    const allIds = rows.map((row) => row.id).sort((a, b) => a - b)
    for (const [where, ids] of cases) {
      const found = await repo.find({ where, orderBy: { id: 'asc' } })
      expect(found.map((row) => row.id), JSON.stringify(where)).toEqual(ids)
      const foundNot = await repo.find({
        where: { $not: where },
        orderBy: { id: 'asc' },
      })
      expect(
        foundNot.map((row) => row.id),
        JSON.stringify({ $not: where }),
      ).toEqual(allIds.filter((id) => !ids.includes(id)))
    }
  })
}
