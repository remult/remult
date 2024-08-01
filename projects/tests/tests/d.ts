import { Entity, EntityBase, Fields } from '../../core/'

@Entity('d1', {
  allowApiCrud: true,
})
export class d extends EntityBase {
  @Fields.integer()
  id!: number
  @Fields.integer()
  b!: number

  static count = 0
}
