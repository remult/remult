import { Entity, Fields } from '../../../../core/index.js'

@Entity<NoNo>('nonos', {
  allowApiCrud: false,
})
export class NoNo {
  @Fields.autoIncrement()
  id?: number
}
