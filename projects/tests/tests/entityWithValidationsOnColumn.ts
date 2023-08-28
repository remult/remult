import { Entity, EntityBase, Fields } from '../../core/src/remult3'
import type { entityWithValidations } from '../shared-tests/entityWithValidations'

@Entity('', { allowApiCrud: true })
export class entityWithValidationsOnColumn extends EntityBase {
  @Fields.integer()
  myId: number
  @Fields.string<entityWithValidations>({
    validate: (t, c) => {
      if (!t.name || t.name.length < 3) c.error = 'invalid on column'
    },
  })
  name: string
}
