import { beforeEach, describe, expect, it } from 'vitest'
import { Entity, Fields, Repository } from '../../../core'
import { describeClass } from '../../../core/src/remult3/classDescribers'
import type { DbTestProps } from './db-tests-props'

export function manyOperations({ createEntity }: DbTestProps) {
  describe('many operations', () => {
    let r: Repository<unknown>
    beforeEach(async () => {
      let e = class {
        id!: number
        name?: string
      }
      describeClass(e, Entity('many', { allowApiCrud: true }), {
        id: Fields.id(),
        name: Fields.string(),
      })
      r = await createEntity(e)
    })

    it('delete many', async () => {
      await r.insert([{}, {}, {}])
      expect(await r.count()).toBe(3)
      expect(await r.deleteMany({ where: 'all' })).toBe(3)
      expect(await r.count()).toBe(0)
    })

    it('update many', async () => {
      await r.insert([{}, {}, {}])
      expect(await r.count()).toBe(3)
      expect(await r.updateMany({ where: 'all', set: { name: 'yo' } })).toBe(3)
      expect(await r.count()).toBe(3)
    })

    it('insert many select none', async () => {
      const result = await r.insert([{ name: 'a' }, { name: 'b' }], {
        select: 'none',
      })
      expect(result).toBeUndefined()
      expect(await r.count()).toBe(2)
    })

    it('insert many autoincrement', async () => {
      let e = class {
        id!: number
        name?: string
      }
      describeClass(e, Entity('many_ai', { allowApiCrud: true }), {
        id: Fields.autoIncrement(),
        name: Fields.string(),
      })
      const repo = await createEntity(e)
      const inserted = await repo.insert([
        { name: 'a' },
        { name: 'b' },
        { name: 'c' },
      ])
      expect(inserted.map((x: any) => x.name)).toEqual(['a', 'b', 'c'])
      expect(inserted.map((x: any) => x.id)).toEqual([1, 2, 3])
    })
  })
}
