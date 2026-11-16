import { expect, it } from 'vitest'
import { Entity, Fields, type EntityFilter } from '../../../core'
import type { DbTestProps } from './db-tests-props'

@Entity('nullFilter', { allowApiCrud: true })
class NullFilter {
  @Fields.integer()
  id = 0
  @Fields.integer({ allowNull: true })
  n: number | null = null
}

// Rows: 1 → -5, 2 → null, 3 → 0, 4 → 5.
// null is a value, and it is not 0.
const cases: [EntityFilter<NullFilter>, number[]][] = [
  [{ n: { $in: [] } }, []],
  [{ n: { $nin: [] } }, [1, 2, 3, 4]],
  [{ n: { $in: [-5, 0, 5] } }, [1, 3, 4]],
  [{ n: { $nin: [-5, 0, 5] } }, [2]],
  [{ n: { $in: [0, null] } }, [2, 3]],
  [{ n: { $nin: [0, null] } }, [1, 4]],
  [{ n: { $nin: [0] } }, [1, 2, 4]],
  [{ n: { $ne: 0 } }, [1, 2, 4]],
  [{ n: { $in: [null] } }, [2]],
  [{ n: { $nin: [null] } }, [1, 3, 4]],
  [{ n: null! }, [2]],
  [{ n: { $ne: null } }, [1, 3, 4]],
  [{ n: { $gt: -5 } }, [3, 4]],
  [{ n: { $gte: 0 } }, [3, 4]],
  [{ n: { $lt: 5 } }, [1, 3]],
  [{ n: { $lte: 0 } }, [1, 3]],
  [{ $not: { n: { $ne: 0 } } }, [3]],
  [{ $not: { n: { $in: [0, null] } } }, [1, 4]],
  [{ $not: { n: { $nin: [0, null] } } }, [2, 3]],
  [{ $not: { n: null! } }, [1, 3, 4]],
]

export function nullFilterTests({ createEntity }: DbTestProps) {
  it('null filters', async () => {
    const repo = await createEntity(NullFilter)
    await repo.insert([
      { id: 1, n: -5 },
      { id: 2, n: null },
      { id: 3, n: 0 },
      { id: 4, n: 5 },
    ])
    for (const [where, ids] of cases) {
      const found = await repo.find({ where, orderBy: { id: 'asc' } })
      expect(
        found.map((row) => row.id),
        JSON.stringify(where),
      ).toEqual(ids)
    }
  })
}
