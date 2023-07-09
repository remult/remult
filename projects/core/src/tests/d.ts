import { BackendMethod } from '../server-action'
import { Field, Entity, EntityBase, Fields } from '../remult3'
import { dWithPrefilter } from './dWithPrefilter'

@Entity('d1', {
  allowApiCrud: true,
})
export class d extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.integer()
  b: number

  static count = 0
}
