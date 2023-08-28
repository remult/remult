import { describe, expect, it } from 'vitest'
import { Entity, EntityBase, Fields } from '../../../core/src/remult3'
import { describeClass } from '../../../core/src/remult3/DecoratorReplacer'
import type { DbTestProps } from './db-tests-props'

export function customIdTests({ createEntity }: DbTestProps) {
  describe('custom id column', () => {
    it('basic test', async () => {
      let type = class extends EntityBase {
        a: number
        b: number
      }
      describeClass(type, Entity('custom', { allowApiCrud: true }), {
        a: Fields.number(),
        b: Fields.number(),
      })
      let c = await createEntity(type)
      let r = c.create()
      r.a = 1
      r.b = 1
      await r._.save()
      r = c.create()
      r.a = 2
      r.b = 2
      await r._.save()
      expect(c.metadata.idMetadata.field.key).toBe(c.metadata.fields.a.key)
    })
    it('basic test id column not first column', async () => {
      let type = class extends EntityBase {
        a: number
        id: number
      }
      Entity('custom2', { allowApiCrud: true })(type)
      Fields.number()(type.prototype, 'a')
      Fields.number()(type.prototype, 'id')
      let c = await createEntity(type)
      let r = c.create()
      r.a = 1
      r.id = 5
      await r._.save()
      r = c.create()
      r.a = 2
      r.id = 6
      await r._.save()
      expect(r._.repository.metadata.idMetadata.field.key).toBe(
        r._.fields.id.metadata.key,
      )
      expect((await c.findId(6)).a).toBe(2)
    })
  })
}
