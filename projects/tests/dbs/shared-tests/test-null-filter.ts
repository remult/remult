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

// Rows: 1 → -1, 2 → null, 3 → 0, 4 → 1.
// Each comparison is one 0 would pass. null is not 0, so the null row stays out.
const notZero: [EntityFilter<NullFilter>, number[]][] = [
  [{ n: { $gt: -1 } }, [3, 4]],
  [{ n: { $gte: 0 } }, [3, 4]],
  [{ n: { $lt: 1 } }, [1, 3]],
  [{ n: { $lte: 0 } }, [1, 3]],
]

export function nullFilterTests({ createEntity }: DbTestProps) {
  function rows(seed: { id: number; n: number | null }[]) {
    return function test(
      cases: [EntityFilter<NullFilter>, number[]][],
    ) {
      for (const [where, ids] of cases) {
        it(JSON.stringify(where), async () => {
          const repo = await createEntity(NullFilter)
          await repo.insert(seed)
          const found = await repo.find({ where, orderBy: { id: 'asc' } })
          expect(found.map((row) => row.id)).toEqual(ids)
        })
      }
    }
  }

  describe('null membership', () => {
    rows([
      { id: 1, n: 1 },
      { id: 2, n: null },
      { id: 3, n: 5 },
    ])(cases)
  })

  describe('null is not 0', () => {
    rows([
      { id: 1, n: -1 },
      { id: 2, n: null },
      { id: 3, n: 0 },
      { id: 4, n: 1 },
    ])(notZero)
  })
}
