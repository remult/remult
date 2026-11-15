import { describe, expect, it } from 'vitest'
import { Entity, Fields, type EntityFilter } from '../../../core'
import type { DbTestProps } from './db-tests-props'

@Entity('nullFilter', { allowApiCrud: true })
class NullFilter {
  @Fields.integer()
  id = 0
  @Fields.integer({ allowNull: true })
  n: number | null = null
}

// Rows: 1 → 1, 2 → null, 3 → 5.
// null is a value: $in is OR of $eq, $nin is AND of $ne.
const cases: [EntityFilter<NullFilter>, number[]][] = [
  [{ n: { $in: [] } }, []],
  [{ n: { $nin: [] } }, [1, 2, 3]],
  [{ n: { $in: [1, 5] } }, [1, 3]],
  [{ n: { $nin: [1, 5] } }, [2]],
  [{ n: { $in: [1, null] } }, [1, 2]],
  [{ n: { $nin: [1, null] } }, [3]],
  [{ n: { $nin: [1] } }, [2, 3]],
  [{ n: { $ne: 1 } }, [2, 3]],
  [{ n: { $in: [null] } }, [2]],
  [{ n: { $nin: [null] } }, [1, 3]],
  [{ n: null! }, [2]],
  [{ n: { $ne: null } }, [1, 3]],
]

export function nullFilterTests({ createEntity }: DbTestProps) {
  describe('null membership', () => {
    for (const [where, ids] of cases) {
      it(JSON.stringify(where), async () => {
        const repo = await createEntity(NullFilter)
        await repo.insert([
          { id: 1, n: 1 },
          { id: 2, n: null },
          { id: 3, n: 5 },
        ])
        const rows = await repo.find({ where, orderBy: { id: 'asc' } })
        expect(rows.map((row) => row.id)).toEqual(ids)
      })
    }
  })
}
