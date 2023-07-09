import { BackendMethod } from '../server-action'
import { Field, Entity, EntityBase, Fields } from '../remult3'

@Entity<dWithPrefilter>('d', {
  apiPrefilter: { b: 2 },
  allowApiCrud: true,
})
export class dWithPrefilter extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.integer()
  b: number

  static count = 0
  @BackendMethod({ allowed: true })
  async doIt() {
    dWithPrefilter.count++
    return true
  }
}
