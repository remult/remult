import { describe, expect, it } from 'vitest'
import { Entity, Fields } from '../../../core'
import { describeClass } from '../../../core/src/remult3/classDescribers'
import type { DbTestProps } from './db-tests-props'

export function manyOperations({ createEntity }: DbTestProps) {
  describe('many operations', () => {
    it('delete many', async () => {
      let e = class {
        id!: number
      }
      describeClass(e, Entity('many', { allowApiCrud: true }), {
        id: Fields.id(),
      })
      let c = await createEntity(e)
      await c.insert([{}, {}, {}])
      expect(await c.count()).toBe(3)
      expect(await c.deleteMany({ where: 'all' })).toBe(3)
    })
  })
}
