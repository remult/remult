import { Entity, EntityBase, Fields } from '../../core/'
import { BackendMethod } from '../../core/src/server-action'

@Entity<dWithPrefilter>('d', {
  apiPrefilter: { b: 2 },
  allowApiCrud: true,
})
export class dWithPrefilter extends EntityBase {
  @Fields.integer()
  id!: number
  @Fields.integer()
  b!: number

  static count = 0
  @BackendMethod({ allowed: true })
  async doIt() {
    dWithPrefilter.count++
    return true
  }
}
