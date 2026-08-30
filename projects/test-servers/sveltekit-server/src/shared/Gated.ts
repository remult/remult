import { Entity, Fields, remult } from 'remult'

@Entity<Gated>('gated', {
  allowApiCrud: true,
  apiPrefilter: () => (remult.isAllowed('admin') ? {} : { pub: true }),
})
export class Gated {
  @Fields.integer()
  id = 0
  @Fields.boolean()
  pub = false
  @Fields.string({ includeInApi: 'admin' })
  secret = ''
}
